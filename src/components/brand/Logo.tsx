import Image from "next/image";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

/**
 * SoleBook brand mark.
 * Uses the official brand asset at /assets/logo.jpg, displayed as a
 * rounded tile so the burnt-peach background reads as a contained badge.
 */
export function Logo({
  variant = "dark",
  className = "",
  showWordmark = true,
  size = 36,
}: LogoProps) {
  const ink = variant === "dark" ? "#111827" : "#F8FAFC";

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="SoleBook"
    >
      <span
        className="relative inline-block shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5"
        style={{ width: size, height: size }}
      >
        <Image
          src="/assets/logo.jpg"
          alt="SoleBook logo"
          fill
          sizes={`${size}px`}
          priority
          className="object-cover"
        />
      </span>
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
