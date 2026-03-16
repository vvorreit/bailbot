"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormProps, FieldValues } from "react-hook-form";
import type { z } from "zod";

export function useFormWithSchema<T extends z.ZodType<FieldValues>>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, "resolver">
) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema as never),
    ...options,
  });
}
