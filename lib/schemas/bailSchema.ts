import { z } from "zod";

export const bailSchema = z.object({
  locataireNom: z.string().min(1, "Le nom du locataire est requis"),
  locatairePrenom: z.string().min(1, "Le prénom est requis"),
  locataireEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  locataireTelephone: z.string().optional(),
  bienAdresse: z.string().min(1, "L'adresse du bien est requise"),
  bienId: z.string().optional(),
  loyerHC: z.coerce.number().min(0, "Le loyer doit être positif"),
  charges: z.coerce.number().min(0, "Les charges doivent être positives"),
  depotGarantie: z.coerce.number().min(0).optional(),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateFin: z.string().optional(),
  typeBail: z.enum(["habitation_vide", "habitation_meublee", "professionnel"]).default("habitation_vide"),
  duree: z.coerce.number().min(1, "La durée est requise"),
  jourPaiement: z.coerce.number().min(1).max(31).default(5),
  zoneTendue: z.boolean().default(false),
  descriptionLot: z.string().optional(),
  surfaceHabitable: z.coerce.number().min(0).optional(),
  dateSignature: z.string().optional(),
  diagnosticsFinDate: z.string().optional(),
});

export type BailFormData = z.infer<typeof bailSchema>;
