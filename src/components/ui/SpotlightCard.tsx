"use client";

import {
  useRef,
  useState,
  type ElementType,
  type MouseEvent,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

type SpotlightCardOwnProps<E extends ElementType> = {
  as?: E;
  children: ReactNode;
  className?: string;
  /**
   * Color of the radial spotlight. Use a translucent value so it blends with
   * the card surface. Defaults to a subtle peach (brand primary).
   */
  spotlightColor?: string;
  /** Peak opacity of the spotlight while hovered/focused. */
  spotlightOpacity?: number;
};

type SpotlightCardProps<E extends ElementType> = SpotlightCardOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof SpotlightCardOwnProps<E>>;

/**
 * Interactive card surface that reveals a soft brand-tinted spotlight
 * following the pointer. Inspired by reactbits.dev, themed with SoleBook's
 * peach + snow palette so it reads as a warm "spotlight" on a light card.
 *
 * Use `as` to render a different host element (e.g. `as="li"` inside a list).
 */
export function SpotlightCard<E extends ElementType = "div">({
  as,
  children,
  className = "",
  spotlightColor = "rgba(242, 115, 68, 0.18)",
  spotlightOpacity = 0.7,
  ...rest
}: SpotlightCardProps<E>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!ref.current || isFocused) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(spotlightOpacity);
  const handleMouseLeave = () => {
    if (!isFocused) setOpacity(0);
  };

  const handleFocus = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: rect.width / 2, y: rect.height / 2 });
    setIsFocused(true);
    setOpacity(spotlightOpacity);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`group relative overflow-hidden ${className}`}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
        style={{
          opacity,
          background: `radial-gradient(360px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </Tag>
  );
}
