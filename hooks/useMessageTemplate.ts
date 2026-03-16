"use client";

import { useState, useEffect, useCallback } from "react";
import { getTemplates, type MessageTemplateDTO as MessageTemplate } from "@/app/actions/templates";

/**
 * Interpole les variables {{var}} dans un texte.
 */
export function interpolerTemplate(
  texte: string,
  variables: Record<string, string>
): string {
  return texte.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}

/**
 * Hook pour charger les templates et les interpoler.
 */
export function useMessageTemplate() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const t = await getTemplates();
      setTemplates(t);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const getByType = useCallback(
    (type: string) => templates.find((t) => t.type === type) ?? null,
    [templates]
  );

  const getById = useCallback(
    (id: string) => templates.find((t) => t.id === id) ?? null,
    [templates]
  );

  const interpoler = useCallback(
    (template: MessageTemplate, variables: Record<string, string>) => ({
      sujet: interpolerTemplate(template.sujet, variables),
      corps: interpolerTemplate(template.corps, variables),
    }),
    []
  );

  return {
    templates,
    loading,
    reload,
    getByType,
    getById,
    interpoler,
  };
}
