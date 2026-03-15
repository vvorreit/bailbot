import { z } from "zod";

export const locataireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  dateNaissance: z.string().optional(),
  adresse: z.string().optional(),
  employeur: z.string().optional(),
  salaireNet: z.coerce.number().min(0).optional(),
  typeContrat: z.string().optional(),
});

export type LocataireFormData = z.infer<typeof locataireSchema>;
