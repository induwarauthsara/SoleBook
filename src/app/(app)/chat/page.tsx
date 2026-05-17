"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { messageFromApiBody, readJsonSafe } from "@/lib/api-error";
import type { ChatMessage } from "@/types/app";
import { cn } from "@/lib/utils";
import { AdvisorMessageBody } from "@/components/chat/AdvisorMessageBody";

async function parseChatSse(
  res: Response,
  onTextChunk: (chunk: string) => void,
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      for (const line of block.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const raw = trimmed.slice(5).trim();
        if (raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw) as { text?: string };
          if (typeof parsed.text === "string" && parsed.text.length > 0) {
            onTextChunk(parsed.text);
          }
        } catch {
          /* ignore malformed chunk */
        }
      }
    }
  }
}

export default function ChatPage() {
  const { t } = useLocale();
  const { session, isHydrated, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !session?.access_token) return;

    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/ai/chat", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await readJsonSafe(res);
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(
            messageFromApiBody(data, `Could not load chat (${res.status})`),
          );
          return;
        }
        const payload = data as { messages?: ChatMessage[] };
        if (Array.isArray(payload.messages)) {
          setMessages(payload.messages);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load chat");
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isAuthenticated, session?.access_token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !session?.access_token || sending) return;

    counterRef.current += 1;
    const userId = `local-u-${counterRef.current}`;
    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: userId,
      role: "user",
      content: trimmed,
      createdAt: now,
    };

    counterRef.current += 1;
    const assistantId = `local-a-${counterRef.current}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", createdAt: now },
    ]);
    setDraft("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const data = await readJsonSafe(res);
        const errText = messageFromApiBody(
          data,
          `Assistant could not respond (${res.status})`,
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errText } : m,
          ),
        );
        return;
      }

      await parseChatSse(res, (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        );
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: msg } : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const clearConversation = async () => {
    if (!session?.access_token || clearing || sending || messages.length === 0)
      return;
    if (!window.confirm(t.chat.clearChatConfirm)) return;

    setClearing(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        setLoadError(
          messageFromApiBody(data, `Could not clear chat (${res.status})`),
        );
        return;
      }
      setMessages([]);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Could not clear chat");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-ink-300">{t.chat.title}</h2>
          <p className="text-sm text-ink-50">{t.chat.sub}</p>
        </div>
        {isAuthenticated && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            disabled={
              clearing ||
              sending ||
              !session?.access_token ||
              messages.length === 0
            }
            aria-label={t.chat.clearChat}
            onClick={() => void clearConversation()}
          >
            <Trash2 className="size-4" />
            {t.chat.clearChat}
          </Button>
        )}
      </header>
      {loadError && (
        <p className="text-sm text-red-600 -mt-2" role="alert">
          {loadError}
        </p>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {historyLoading && messages.length === 0 && (
            <p className="text-sm text-ink-50">Loading conversation…</p>
          )}
          {messages.map((msg) => (
            <Bubble key={msg.id} msg={msg} />
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-snow-300 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {t.chat.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={sending || !session?.access_token}
                onClick={() => void send(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-snow-300 bg-snow-100 px-3 py-1.5 text-xs font-medium text-ink-100 hover:border-peach-300 hover:text-peach-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className="size-3" />
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.chat.placeholder}
              className="flex-1"
              disabled={sending || !session?.access_token}
            />
            <Button
              type="submit"
              size="icon"
              aria-label={t.chat.send}
              disabled={sending || !session?.access_token}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <span className="size-8 shrink-0 rounded-full bg-peach-500/15 grid place-items-center">
          <Sparkles className="size-4 text-peach-700" />
        </span>
      )}
      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        {!isUser && (
          <Badge variant="peach" className="self-start">
            SoleBook AI
          </Badge>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm min-h-[2.5rem]",
            isUser
              ? "bg-peach-500 text-white"
              : "bg-snow-100 text-ink-300 border border-snow-300",
          )}
        >
          {isUser ? (
            (msg.content || null)
          ) : msg.content.trim() ? (
            <AdvisorMessageBody content={msg.content} />
          ) : (
            "…"
          )}
        </div>
      </div>
    </div>
  );
}
