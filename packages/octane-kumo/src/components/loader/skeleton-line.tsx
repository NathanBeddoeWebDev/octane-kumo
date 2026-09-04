/** @jsxImportSource octane */
import { useId, useMemo } from "octane";
import type { JSX } from "octane/jsx-runtime";
import { cn } from "../../utils/cn";

export interface SkeletonLineProps {
  blockHeight?: string | number;
  className?: string;
  maxDelay?: number;
  maxDuration?: number;
  maxWidth?: number;
  minDelay?: number;
  minDuration?: number;
  minWidth?: number;
}

type NativeStyle = Exclude<
  JSX.IntrinsicElements["div"]["style"],
  string | undefined
>;
type SkeletonStyle = NativeStyle & Record<`--${string}`, string>;

function seededFraction(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function seededInteger(min: number, max: number, seed: string) {
  return Math.floor(seededFraction(seed) * (max - min + 1) + min);
}

function seededFloat(min: number, max: number, seed: string) {
  return (seededFraction(seed) * (max - min) + min).toFixed(2);
}

export function SkeletonLine({
  minWidth = 30,
  maxWidth = 100,
  minDuration = 1.3,
  maxDuration = 1.7,
  minDelay = 0,
  maxDelay = 0.5,
  blockHeight,
  className,
}: SkeletonLineProps) {
  const id = useId();
  const { width, duration, delay } = useMemo(
    () => ({
      width: seededInteger(minWidth, maxWidth, `${id}:width`),
      duration: seededFloat(minDuration, maxDuration, `${id}:duration`),
      delay: seededFloat(minDelay, maxDelay, `${id}:delay`),
    }),
    [id, minWidth, maxWidth, minDuration, maxDuration, minDelay, maxDelay],
  );
  const style: SkeletonStyle = {
    "--skeleton-width": `${width}%`,
    "--shimmer-duration": `${duration}s`,
    "--shimmer-delay": `${delay}s`,
  };
  const line = (
    <div
      aria-hidden="true"
      className={cn("skeleton-line", className)}
      data-kumo-component="SkeletonLine"
      style={style}
    />
  );

  if (blockHeight === undefined) return line;

  const height =
    typeof blockHeight === "number" ? `${blockHeight}px` : blockHeight;
  return (
    <div className={cn("flex items-center")} style={{ height }}>
      {line}
    </div>
  );
}
