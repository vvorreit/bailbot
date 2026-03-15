"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface MessageTemplate {
  id: string;
  nom: string;
  type: string;
  sujet: string;
  corps: string;
  variables: string[];
  createdAt: string;
}

const TEMPLATES_DEFAUT: MessageTemplate[] = [
  {
    id: "relance-loyer",
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
    createdAt: new Date().toISOString(),
  },
  {
    id: "confirmation-visite",
    nom: "Confirmation de visite",
    type: "CONFIRMATION_VISITE",
    sujet: "Confirmation de visite — {{adresse}}",
    corps: `Bonjour {{nom_locataire}},

Nous vous confirmons votre visite du logement situé au {{adresse}} le {{date}}.

Merci de vous présenter muni(e) d'une pièce d'identité.

Cordialement,
L'équipe BailBot`,
    variables: ["nom_locataire", "adresse", "date"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "refus-candidature",
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
    createdAt: new Date().toISOString(),
  },
  {
    id: "bienvenue-locataire",
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
    createdAt: new Date().toISOString(),
  },
  {
    id: "rappel-echeance",
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
    createdAt: new Date().toISOString(),
  },
  {
    id: "restitution-depot",
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
    createdAt: new Date().toISOString(),
  },
];

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorisé");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

export async function getTemplates(): Promise<MessageTemplate[]> {
  const user = await getUser();
  const templates = user.messageTemplates as MessageTemplate[] | null;
  if (!templates || !Array.isArray(templates) || templates.length === 0) {
    return TEMPLATES_DEFAUT;
  }
  return templates;
}

export async function saveTemplates(templates: MessageTemplate[]) {
  const user = await getUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { messageTemplates: templates as any },
  });
  return { success: true };
}

export async function saveTemplate(template: MessageTemplate) {
  const user = await getUser();
  const existing = (user.messageTemplates as MessageTemplate[] | null) || TEMPLATES_DEFAUT;
  const index = existing.findIndex((t) => t.id === template.id);

  let updated: MessageTemplate[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = template;
  } else {
    updated = [...existing, template];
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { messageTemplates: updated as any },
  });
  return { success: true };
}

export async function deleteTemplate(templateId: string) {
  const user = await getUser();
  const existing = (user.messageTemplates as MessageTemplate[] | null) || TEMPLATES_DEFAUT;
  const updated = existing.filter((t) => t.id !== templateId);

  await prisma.user.update({
    where: { id: user.id },
    data: { messageTemplates: updated as any },
  });
  return { success: true };
}

export async function duplicateTemplate(templateId: string) {
  const user = await getUser();
  const existing = (user.messageTemplates as MessageTemplate[] | null) || TEMPLATES_DEFAUT;
  const source = existing.find((t) => t.id === templateId);
  if (!source) throw new Error("Template introuvable");

  const copy: MessageTemplate = {
    ...source,
    id: `${source.id}-copie-${Date.now()}`,
    nom: `${source.nom} (copie)`,
    createdAt: new Date().toISOString(),
  };

  const updated = [...existing, copy];
  await prisma.user.update({
    where: { id: user.id },
    data: { messageTemplates: updated as any },
  });
  return { success: true, template: copy };
}

export async function resetTemplates() {
  const user = await getUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { messageTemplates: TEMPLATES_DEFAUT as any },
  });
  return { success: true };
}

export async function getDefaultTemplates(): Promise<MessageTemplate[]> {
  return TEMPLATES_DEFAUT;
}
