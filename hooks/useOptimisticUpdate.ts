"use client";
import { useState, useCallback } from "react";

export function useOptimisticUpdate<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousRef = { current: initialValue };

  const update = useCallback(
    async (optimisticValue: T, asyncFn: () => Promise<T>) => {
      previousRef.current = value;
      setValue(optimisticValue);
      setIsOptimistic(true);
      setError(null);

      try {
        const result = await asyncFn();
        setValue(result);
        setIsOptimistic(false);
        return result;
      } catch (err) {
        setValue(previousRef.current);
        setIsOptimistic(false);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [value]
  );

  return { value, update, isOptimistic, error, setValue };
}
