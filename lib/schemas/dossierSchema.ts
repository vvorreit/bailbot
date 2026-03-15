import { z } from "zod";

export const dossierIdentiteSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  dateNaissance: z.string().optional(),
  nationalite: z.string().optional(),
  numeroCNI: z.string().optional(),
  adresseActuelle: z.string().optional(),
});

export const dossierEmploiSchema = z.object({
  employeur: z.string().optional(),
  salaireNet: z.coerce.number().min(0).optional(),
  typeContrat: z.string().optional(),
  anciennete: z.string().optional(),
});

export const dossierFiscalSchema = z.object({
  revenusN1: z.coerce.number().min(0).optional(),
  revenusN2: z.coerce.number().min(0).optional(),
  partsFiscales: z.coerce.number().min(0).optional(),
  statusDeclaration: z.string().optional(),
});

export const dossierBanqueSchema = z.object({
  titulaire: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  banque: z.string().optional(),
});

export const garantSchema = z.object({
  nom: z.string().min(1, "Le nom du garant est requis"),
  prenom: z.string().min(1, "Le prénom du garant est requis"),
  lienParente: z.string().optional(),
  employeur: z.string().optional(),
  salaireNet: z.coerce.number().min(0).optional(),
  revenusN1: z.coerce.number().min(0).optional(),
});

export const dossierSchema = z.object({
  identite: dossierIdentiteSchema,
  emploi: dossierEmploiSchema,
  fiscal: dossierFiscalSchema,
  banque: dossierBanqueSchema,
  garant: garantSchema.optional(),
});

export type DossierFormData = z.infer<typeof dossierSchema>;
