"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface Clause {
  id: string;
  titre: string;
  contenu: string;
  obligatoire: boolean;
  active: boolean;
}

export interface ModeleBailData {
  id: string;
  nom: string;
  type: string;
  clauses: Clause[];
  createdAt: string;
}

const CLAUSES_VIDE: Clause[] = [
  { id: "designation", titre: "Désignation des parties", contenu: "Le présent contrat est conclu entre le bailleur et le locataire désignés ci-après, conformément aux dispositions de la loi n°89-462 du 6 juillet 1989.", obligatoire: true, active: true },
  { id: "objet", titre: "Objet du contrat", contenu: "Le bailleur loue au locataire le logement décrit ci-après, à usage d'habitation principale, constituant la résidence principale du locataire.", obligatoire: true, active: true },
  { id: "description", titre: "Description du logement", contenu: "Le logement loué est situé à l'adresse indiquée, comprenant les pièces et équipements décrits dans l'état des lieux d'entrée annexé au présent bail.", obligatoire: true, active: true },
  { id: "duree", titre: "Durée du bail", contenu: "Le présent bail est consenti pour une durée de trois (3) ans à compter de la date d'effet. Il se renouvelle par tacite reconduction pour des périodes de trois ans.", obligatoire: true, active: true },
  { id: "loyer", titre: "Montant du loyer et charges", contenu: "Le loyer mensuel est fixé selon les conditions convenues entre les parties. Les charges locatives sont payables mensuellement par provision, avec régularisation annuelle.", obligatoire: true, active: true },
  { id: "revision", titre: "Révision annuelle du loyer", contenu: "Le loyer sera révisé chaque année à la date anniversaire du bail, en fonction de la variation de l'Indice de Référence des Loyers (IRL) publié par l'INSEE.", obligatoire: true, active: true },
  { id: "depot", titre: "Dépôt de garantie", contenu: "Un dépôt de garantie équivalent à un mois de loyer hors charges est versé par le locataire à la signature du bail. Il sera restitué dans un délai d'un mois si l'état des lieux de sortie est conforme, deux mois dans le cas contraire.", obligatoire: true, active: true },
  { id: "edl", titre: "État des lieux", contenu: "Un état des lieux contradictoire est établi à l'entrée et à la sortie du locataire, conformément à la loi ALUR du 24 mars 2014.", obligatoire: true, active: true },
  { id: "diagnostics", titre: "Diagnostics techniques", contenu: "Le dossier de diagnostic technique (DDT) comprenant le DPE, le CREP, l'état des installations électriques et gaz, et l'état des risques est annexé au présent bail.", obligatoire: true, active: true },
  { id: "clause_resolutoire", titre: "Clause résolutoire", contenu: "Le bail sera résilié de plein droit en cas de non-paiement du loyer et des charges, du dépôt de garantie, ou de défaut d'assurance, deux mois après un commandement de payer demeuré infructueux.", obligatoire: false, active: true },
  { id: "solidarite", titre: "Clause de solidarité (colocation)", contenu: "En cas de colocation, les colocataires sont solidairement responsables du paiement du loyer et des charges, pendant toute la durée de leur occupation et six mois après le départ d'un colocataire.", obligatoire: false, active: false },
  { id: "animaux", titre: "Animaux de compagnie", contenu: "Le locataire est autorisé à détenir des animaux de compagnie, sous réserve qu'ils ne causent pas de nuisances ni de dégradations.", obligatoire: false, active: true },
  { id: "travaux", titre: "Travaux et transformations", contenu: "Le locataire ne pourra effectuer de travaux de transformation sans l'accord écrit préalable du bailleur. Les travaux d'embellissement sont autorisés sans accord préalable.", obligatoire: false, active: false },
];

const CLAUSES_MEUBLE: Clause[] = [
  { id: "designation", titre: "Désignation des parties", contenu: "Le présent contrat est conclu entre le bailleur et le locataire désignés ci-après, conformément au décret n°2015-981 du 31 juillet 2015.", obligatoire: true, active: true },
  { id: "objet", titre: "Objet du contrat", contenu: "Le bailleur loue au locataire le logement meublé décrit ci-après, à usage d'habitation principale, conformément aux articles 25-3 à 25-11 de la loi du 6 juillet 1989.", obligatoire: true, active: true },
  { id: "description", titre: "Description du logement et mobilier", contenu: "Le logement est loué meublé, équipé du mobilier et des éléments listés en annexe, conformément au décret n°2015-981 du 31 juillet 2015 définissant la liste minimale des meubles.", obligatoire: true, active: true },
  { id: "duree", titre: "Durée du bail", contenu: "Le présent bail est consenti pour une durée d'un (1) an. Il se renouvelle par tacite reconduction pour des périodes d'un an. Le locataire peut donner congé à tout moment avec un préavis d'un mois.", obligatoire: true, active: true },
  { id: "loyer", titre: "Montant du loyer et charges", contenu: "Le loyer mensuel est fixé selon les conditions convenues. Les charges locatives sont forfaitaires ou réelles, avec régularisation annuelle le cas échéant.", obligatoire: true, active: true },
  { id: "revision", titre: "Révision annuelle du loyer", contenu: "Le loyer sera révisé chaque année à la date anniversaire du bail en fonction de l'IRL.", obligatoire: true, active: true },
  { id: "depot", titre: "Dépôt de garantie", contenu: "Un dépôt de garantie équivalent à deux mois de loyer hors charges est versé à la signature. Restitution sous un à deux mois après la sortie.", obligatoire: true, active: true },
  { id: "inventaire", titre: "Inventaire du mobilier", contenu: "Un inventaire détaillé du mobilier et des équipements fournis est annexé au présent bail. Le locataire s'engage à restituer le mobilier en bon état d'usage.", obligatoire: true, active: true },
  { id: "diagnostics", titre: "Diagnostics techniques", contenu: "Le dossier de diagnostic technique (DDT) est annexé au présent bail.", obligatoire: true, active: true },
  { id: "clause_resolutoire", titre: "Clause résolutoire", contenu: "Le bail sera résilié de plein droit en cas de non-paiement du loyer ou défaut d'assurance, deux mois après commandement.", obligatoire: false, active: true },
  { id: "charges_forfaitaires", titre: "Charges forfaitaires", contenu: "Les charges sont forfaitaires et fixées à un montant mensuel. Ce forfait ne peut pas faire l'objet de régularisation.", obligatoire: false, active: false },
];

const CLAUSES_MOBILITE: Clause[] = [
  { id: "designation", titre: "Désignation des parties", contenu: "Le présent bail mobilité est conclu conformément aux articles 25-12 à 25-18 de la loi du 6 juillet 1989, créés par la loi ELAN du 23 novembre 2018.", obligatoire: true, active: true },
  { id: "objet", titre: "Objet du contrat — Bail mobilité", contenu: "Le bailleur loue au locataire un logement meublé pour une durée déterminée, dans le cadre d'un bail mobilité. Le locataire atteste être en formation, études, stage, engagement civique, mutation ou mission temporaire.", obligatoire: true, active: true },
  { id: "duree", titre: "Durée du bail (1 à 10 mois)", contenu: "Le bail est conclu pour une durée de [X] mois, non renouvelable et non reconductible. La durée peut être modifiée une fois par avenant, sans dépasser 10 mois au total.", obligatoire: true, active: true },
  { id: "loyer", titre: "Montant du loyer et charges", contenu: "Le loyer mensuel est fixé conformément à l'encadrement des loyers le cas échéant. Les charges sont forfaitaires.", obligatoire: true, active: true },
  { id: "pas_de_depot", titre: "Absence de dépôt de garantie", contenu: "Conformément à la loi, aucun dépôt de garantie ne peut être exigé dans le cadre d'un bail mobilité. Le bailleur peut en revanche demander la mise en place de la garantie Visale.", obligatoire: true, active: true },
  { id: "motif", titre: "Motif du bail mobilité", contenu: "Le locataire déclare être dans l'une des situations prévues par la loi : formation professionnelle, études supérieures, contrat d'apprentissage, stage, engagement de service civique, mutation professionnelle ou mission temporaire.", obligatoire: true, active: true },
  { id: "diagnostics", titre: "Diagnostics techniques", contenu: "Le DDT est annexé au présent bail.", obligatoire: true, active: true },
  { id: "conge_locataire", titre: "Congé du locataire", contenu: "Le locataire peut résilier le bail à tout moment en respectant un préavis d'un mois.", obligatoire: false, active: true },
];

export async function getModelesBaux(): Promise<ModeleBailData[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const modeles = await prisma.modeleBail.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return modeles.map((m) => ({
    id: m.id,
    nom: m.nom,
    type: m.type,
    clauses: m.clauses as unknown as Clause[],
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function getModelesDefaut(): Promise<ModeleBailData[]> {
  return [
    { id: "default-vide", nom: "Bail habitation vide (loi du 6 juillet 1989)", type: "HABITATION_VIDE", clauses: CLAUSES_VIDE, createdAt: new Date().toISOString() },
    { id: "default-meuble", nom: "Bail meublé (décret du 31 juillet 2015)", type: "HABITATION_MEUBLE", clauses: CLAUSES_MEUBLE, createdAt: new Date().toISOString() },
    { id: "default-mobilite", nom: "Bail mobilité (loi ELAN 2018)", type: "MOBILITE", clauses: CLAUSES_MOBILITE, createdAt: new Date().toISOString() },
  ];
}

export async function saveModeleBail(data: {
  nom: string;
  type: string;
  clauses: Clause[];
}): Promise<ModeleBailData> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Non authentifié");

  const modele = await prisma.modeleBail.create({
    data: {
      userId: session.user.id,
      nom: data.nom,
      type: data.type,
      clauses: data.clauses as any,
    },
  });

  return {
    id: modele.id,
    nom: modele.nom,
    type: modele.type,
    clauses: modele.clauses as unknown as Clause[],
    createdAt: modele.createdAt.toISOString(),
  };
}

export async function deleteModeleBail(id: string): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Non authentifié");

  await prisma.modeleBail.deleteMany({
    where: { id, userId: session.user.id },
  });
}
