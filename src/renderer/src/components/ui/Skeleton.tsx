/** Skeleton loader block — uses .skeleton class from design-system.css */
import type React from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height, className = "", style }: SkeletonProps): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

/** A set of skeleton lines that mimic a card placeholder */
export function SkeletonCard(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading game..." className="overflow-hidden rounded-2xl border border-white/8">
      <Skeleton height="140px" width="100%" style={{ borderRadius: 0 }} />
      <div className="p-4 space-y-3">
        <Skeleton height="16px" width="70%" />
        <Skeleton height="12px" width="90%" />
        <Skeleton height="36px" width="100%" style={{ borderRadius: 8, marginTop: 16 }} />
      </div>
    </div>
  );
}
