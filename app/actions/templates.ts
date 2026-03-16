"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface MessageTemplateDTO {
  id: string;
  nom: string;
  type: string;
  sujet: string;
  corps: string;
  variables: string[];
  createdAt: string;
}

const TEMPLATES_DEFAUT: Omit<MessageTemplateDTO, "id" | "createdAt">[] = [
  {
    nom: "Relance loyer",
    type: "RELANCE_LOYER",
    sujet: "Rappel de paiement — {{adresse}}",
    corps: `Bonjour {{nom_locataire}},

Nous constatons que le loyer du mois de {{date}} pour le logement situé au {{adresse}} n'a pas encore été réglé.

Montant dû : {{montant}} EUR

Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.

En cas de difficultés, n'hésitez pas à nous contacter.

Cordialement,
L'équipe BailBot`,
    variables: ["nom_locataire", "adresse", "montant", "date"],
  },
  {
    nom: "Confirmation de visite",
    type: "CONFIRMATION_VISITE",
    sujet: "Confirmation de visite — {{adresse}}",
    corps: `Bonjour {{nom_locataire}},

Nous vous confirmons votre visite du logement situé au {{adresse}} le {{date}}.

Merci de vous présenter muni(e) d'une pièce d'identité.

Cordialement,
L'équipe BailBot`,
    variables: ["nom_locataire", "adresse", "date"],
  },
  {
    nom: "Refus de candidature",
    type: "REFUS_CANDIDATURE",
    sujet: "Suite à votre candidature — {{adresse}}",
    corps: `Bonjour {{nom_locataire}},

Nous vous remercions pour l'intérêt que vous avez porté au logement situé au {{adresse}}.

Après examen des candidatures reçues, nous sommes au regret de vous informer que votre candidature n'a pas été retenue.

Nous vous souhaitons bonne chance dans vos recherches.

Cordialement,
L'équipe BailBot`,
    variables: ["nom_locataire", "adresse"],
  },
  {
    nom: "Bienvenue locataire",
    type: "BIENVENUE_LOCATAIRE",
    sujet: "Bienvenue dans votre logement — {{adresse}}",
    corps: `Bonjour {{nom_locataire}},

Nous avons le plaisir de vous accueillir dans votre nouveau logement situé au {{adresse}}.

Votre bail prend effet le {{date}}. Le loyer mensuel charges comprises est de {{montant}} EUR.

Pour toute question relative à votre logement, n'hésitez pas à nous contacter.

Votre espace locataire est accessible ici : {{lien}}

Cordialement,
L'équipe BailBot`,
    variables: ["nom_locataire", "adresse", "date", "montant", "lien"],
  },
  {
    nom: "Rappel échéance",
    type: "RAPPEL_ECHEANCE",
    sujet: "Rappel — Échéance à venir pour {{adresse}}",
    corps: `Bonjour {{nom_locataire}},

Nous vous rappelons qu'une échéance approche pour votre logement situé au {{adresse}}.

Date : {{date}}

Merci de prendre les dispositions nécessaires.

Cordialement,
L'équipe BailBot`,
    variables: ["nom_locataire", "adresse", "date"],
  },
  {
    nom: "Restitution dépôt de garantie",
    type: "RESTITUTION_DEPOT",
    sujet: "Restitution du dépôt de garantie — {{adresse}}",
    corps: `Bonjour {{nom_locataire}},

Suite à votre départ du logement situé au {{adresse}}, nous procédons à la restitution de votre dépôt de garantie.

Montant restitué : {{montant}} EUR

Le virement sera effectué dans les prochains jours.

Cordialement,
L'équipe BailBot`,
    variables: ["nom_locataire", "adresse", "montant"],
  },
];

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");
  return user.id;
}

function toDTO(row: {
  id: string;
  nom: string;
  type: string;
  sujet: string;
  corps: string;
  variables: string[];
  createdAt: Date;
}): MessageTemplateDTO {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type,
    sujet: row.sujet,
    corps: row.corps,
    variables: row.variables,
    createdAt: row.createdAt.toISOString(),
  };
}

async function seedDefaults(userId: string): Promise<MessageTemplateDTO[]> {
  const rows = await prisma.$transaction(
    TEMPLATES_DEFAUT.map((t) =>
      prisma.messageTemplate.create({
        data: { userId, ...t },
      })
    )
  );
  return rows.map(toDTO);
}

export async function getTemplates(): Promise<MessageTemplateDTO[]> {
  const userId = await getUserId();
  const rows = await prisma.messageTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) return seedDefaults(userId);
  return rows.map(toDTO);
}

export async function saveTemplates(templates: MessageTemplateDTO[]) {
  const userId = await getUserId();
  await prisma.$transaction([
    prisma.messageTemplate.deleteMany({ where: { userId } }),
    ...templates.map((t) =>
      prisma.messageTemplate.create({
        data: {
          userId,
          nom: t.nom,
          type: t.type,
          sujet: t.sujet,
          corps: t.corps,
          variables: t.variables,
        },
      })
    ),
  ]);
  return { success: true };
}

export async function saveTemplate(template: MessageTemplateDTO) {
  const userId = await getUserId();
  const existing = await prisma.messageTemplate.findFirst({
    where: { id: template.id, userId },
  });

  if (existing) {
    await prisma.messageTemplate.update({
      where: { id: template.id },
      data: {
        nom: template.nom,
        type: template.type,
        sujet: template.sujet,
        corps: template.corps,
        variables: template.variables,
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.messageTemplate.create({
      data: {
        userId,
        nom: template.nom,
        type: template.type,
        sujet: template.sujet,
        corps: template.corps,
        variables: template.variables,
      },
    });
  }
  return { success: true };
}

export async function deleteTemplate(templateId: string) {
  const userId = await getUserId();
  await prisma.messageTemplate.deleteMany({
    where: { id: templateId, userId },
  });
  return { success: true };
}

export async function duplicateTemplate(templateId: string) {
  const userId = await getUserId();
  const source = await prisma.messageTemplate.findFirst({
    where: { id: templateId, userId },
  });
  if (!source) throw new Error("Template introuvable");

  const copy = await prisma.messageTemplate.create({
    data: {
      userId,
      nom: `${source.nom} (copie)`,
      type: source.type,
      sujet: source.sujet,
      corps: source.corps,
      variables: source.variables,
    },
  });
  return { success: true, template: toDTO(copy) };
}

export async function resetTemplates() {
  const userId = await getUserId();
  await prisma.messageTemplate.deleteMany({ where: { userId } });
  await seedDefaults(userId);
  return { success: true };
}

export async function getDefaultTemplates(): Promise<MessageTemplateDTO[]> {
  return TEMPLATES_DEFAUT.map((t, i) => ({
    ...t,
    id: `default-${i}`,
    createdAt: new Date().toISOString(),
  }));
}
