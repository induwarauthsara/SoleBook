"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/components/providers/LocaleProvider";
import { mockChatHistory } from "@/lib/mock-data";
import type { ChatMessage } from "@/types/app";
import { cn } from "@/lib/utils";

const SCRIPTED_REPLY = (q: string): string => {
  const lower = q.toLowerCase();
  if (lower.includes("reserve"))
    return "Your reserve fell 40% last month because operations took an extra LKR 96K. Shifting 5% of incoming sales should bring it back on track in three weeks.";
  if (lower.includes("withdraw") || lower.includes("salary"))
    return "Right now I’d cap your withdrawal at LKR 62,000 this week so the EPF/ETF contribution on the 18th still has cover.";
  if (lower.includes("month") || lower.includes("forecast"))
    return "Next month looks balanced. Days 12–18 will be tight — three obligations cluster there. I’ll reserve them ahead of time once approved.";
  return "Got it. Based on the latest figures, I’d focus on protecting the supplier invoice and keeping the reserve untouched until the next settlement clears.";
};

export default function ChatPage() {
  const { t } = useLocale();
  const sessionId = useId();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    counterRef.current += 1;
    const userId = `u-${sessionId}-${counterRef.current}`;
    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: userId,
      role: "user",
      content: text,
      createdAt: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setTimeout(() => {
      counterRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${sessionId}-${counterRef.current}`,
          role: "assistant",
          content: SCRIPTED_REPLY(text),
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 600);
  };

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.chat.title}</h2>
        <p className="text-sm text-ink-50">{t.chat.sub}</p>
      </header>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
                onClick={() => send(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-snow-300 bg-snow-100 px-3 py-1.5 text-xs font-medium text-ink-100 hover:border-peach-300 hover:text-peach-700 transition-colors"
              >
                <Sparkles className="size-3" />
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.chat.placeholder}
              className="flex-1"
            />
            <Button type="submit" size="icon" aria-label={t.chat.send}>
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
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-peach-500 text-white"
              : "bg-snow-100 text-ink-300 border border-snow-300",
          )}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
}
