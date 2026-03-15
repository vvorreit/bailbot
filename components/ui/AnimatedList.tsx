"use client";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedListProps<T> {
  items: T[];
  keyFn: (item: T) => string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function AnimatedList<T>({ items, keyFn, renderItem, className = "" }: AnimatedListProps<T>) {
  const prefersReduced = useReducedMotion();

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={keyFn(item)}
          className={prefersReduced ? "" : "animate-list-item-in"}
          style={prefersReduced ? undefined : { animationDelay: `${index * 50}ms` }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
