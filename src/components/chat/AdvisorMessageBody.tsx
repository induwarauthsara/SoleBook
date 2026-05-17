"use client";

import { Fragment, type ReactNode } from "react";

function inlineSegments(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([\s\S]+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={`t-${key++}`}>{text.slice(last, m.index)}</Fragment>);
    out.push(
      <strong key={`s-${key++}`} className="font-semibold text-ink-300">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={`t-${key++}`}>{text.slice(last)}</Fragment>);
  return out.length > 0 ? out : [<Fragment key="e">{text}</Fragment>];
}

function isBulletLine(line: string): boolean {
  return /^\s*(\*|-|•)\s+/.test(line);
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^\s*(\*|-|•)\s+/, "").trimEnd();
}

/**
 * Lightweight formatting for Gemini-style replies (bold ** **, bullets, paragraphs).
 */
export function AdvisorMessageBody({ content }: { content: string }) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const blocks = trimmed.split(/\n\n+/).map((b) => b.trim());

  return (
    <div className="space-y-3 text-[0.9375rem] leading-relaxed [&_strong]:font-semibold">
      {blocks.map((block, bi) => {
        const rawLines = block.split("\n");
        const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

        if (lines.length === 0) return null;

        if (lines.length > 0 && lines.every(isBulletLine)) {
          return (
            <ul
              key={bi}
              className="list-disc space-y-2 pl-5 marker:text-ink-50 [&_li]:pl-1"
            >
              {lines.map((line, li) => (
                <li key={li} className="leading-relaxed">
                  {inlineSegments(stripBulletPrefix(line))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="leading-relaxed">
            {lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 ? <br /> : null}
                {inlineSegments(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
