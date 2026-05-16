interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
  showWordmark?: boolean;
}

/**
 * SoleBook brand mark.
 * - Mark: stacked discipline bars rising into a coin/peach arc — meaning
 *   "ordered cash buckets that grow upward."
 * - Wordmark: clean sans-serif.
 *
 * Colors are locked to the brand palette only.
 */
export function Logo({
  variant = "dark",
  className = "",
  showWordmark = true,
}: LogoProps) {
  const ink = variant === "dark" ? "#111827" : "#F8FAFC";
  const peach = "#F27344";

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="SoleBook"
    >
      <svg
        viewBox="0 0 32 32"
        width="28"
        height="28"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="26" height="26" rx="7" fill={ink} />
        <rect x="8" y="18" width="3.5" height="7" rx="1.5" fill={peach} />
        <rect
          x="13.25"
          y="14"
          width="3.5"
          height="11"
          rx="1.5"
          fill={peach}
          opacity="0.85"
        />
        <rect
          x="18.5"
          y="10"
          width="3.5"
          height="15"
          rx="1.5"
          fill={peach}
          opacity="0.7"
        />
        <circle cx="24" cy="9" r="2.2" fill={peach} />
      </svg>
      {showWordmark && (
        <span
          className="text-[17px] font-semibold tracking-[-0.01em]"
          style={{ color: ink }}
        >
          SoleBook
        </span>
      )}
    </span>
  );
}
