import { z } from "zod";

export const paiementSchema = z.object({
  bienAdresse: z.string().min(1, "Le bien est requis"),
  mois: z.string().min(1, "Le mois est requis"),
  locataireNom: z.string().min(1, "Le nom du locataire est requis"),
  locataireEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  montant: z.coerce.number().min(0, "Le montant doit être positif"),
  statut: z.enum(["attendu", "paye", "partiel", "retard", "impaye"]).default("attendu"),
  datePaiement: z.string().optional(),
  montantRecu: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export type PaiementFormData = z.infer<typeof paiementSchema>;
