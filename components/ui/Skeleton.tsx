"use client";

interface SkeletonProps {
  variant?: "line" | "card" | "avatar" | "table-row";
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

function SkeletonBase({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
      style={style}
    />
  );
}

export function Skeleton({ variant = "line", width, height, className = "", count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (variant) {
    case "avatar":
      return (
        <div className={`flex gap-3 ${className}`}>
          {items.map((i) => (
            <SkeletonBase
              key={i}
              className="rounded-full shrink-0"
              style={{ width: width || "40px", height: height || "40px" }}
            />
          ))}
        </div>
      );

    case "card":
      return (
        <div className={`space-y-3 ${className}`}>
          {items.map((i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <SkeletonBase style={{ width: "60%", height: "16px" }} />
              <SkeletonBase style={{ width: "100%", height: "12px" }} />
              <SkeletonBase style={{ width: "80%", height: "12px" }} />
            </div>
          ))}
        </div>
      );

    case "table-row":
      return (
        <div className={`space-y-2 ${className}`}>
          {items.map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <SkeletonBase style={{ width: "20%", height: "14px" }} />
              <SkeletonBase style={{ width: "30%", height: "14px" }} />
              <SkeletonBase style={{ width: "25%", height: "14px" }} />
              <SkeletonBase style={{ width: "15%", height: "14px" }} />
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className={`space-y-2 ${className}`}>
          {items.map((i) => (
            <SkeletonBase
              key={i}
              style={{ width: width || "100%", height: height || "14px" }}
            />
          ))}
        </div>
      );
  }
}
