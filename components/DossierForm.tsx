"use client";

import { useState } from "react";
import { DossierLocataire, Garant } from "@/lib/parsers";

interface Props {
  data: Partial<DossierLocataire>;
  onChange: (data: Partial<DossierLocataire>) => void;
}

const inputCls = `w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800
  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
  placeholder:text-gray-300 transition-all`;

const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

function Field({ label, value, onChange, placeholder, colSpan, type }: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  colSpan?: boolean;
  type?: string;
}) {
  return (
    <div className={colSpan ? "sm:col-span-2" : ""}>
      <label className={labelCls}>{label}</label>
      <input
        type={type ?? "text"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className={inputCls}
      />
    </div>
  );
}

const EMPTY_GARANT: Garant = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  lienParente: "",
  salaireNetMensuel: 0,
  typeContrat: "",
  revenusN1: 0,
  iban: "",
  adresse: "",
};

export default function DossierForm({ data, onChange }: Props) {
  const d = data ?? {};
  const [showGarant, setShowGarant] = useState(Boolean(d.garant));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span className="text-2xl">🏠</span> Dossier Locataire
      </h2>

      {/* Identité — CNI */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Identité (CNI)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nom" value={d.nom ?? ""} onChange={(v) => onChange({ ...d, nom: v })} placeholder="NOM" />
          <Field label="Prénom" value={d.prenom ?? ""} onChange={(v) => onChange({ ...d, prenom: v })} placeholder="Prénom" />
          <Field label="Date de naissance" value={d.dateNaissance ?? ""} onChange={(v) => onChange({ ...d, dateNaissance: v })} placeholder="JJ/MM/AAAA" />
          <Field label="Nationalité" value={d.nationalite ?? ""} onChange={(v) => onChange({ ...d, nationalite: v })} placeholder="Française" />
          <Field label="N° CNI" value={d.numeroCNI ?? ""} onChange={(v) => onChange({ ...d, numeroCNI: v })} placeholder="12 chiffres" colSpan />
          <Field label="Adresse (CNI)" value={d.adresseActuelle ?? ""} onChange={(v) => onChange({ ...d, adresseActuelle: v })} placeholder="Adresse sur la pièce d'identité" colSpan />
        </div>
      </div>

      {/* Emploi — Bulletin de paie */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Emploi (Bulletins de paie)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Employeur" value={d.employeur ?? ""} onChange={(v) => onChange({ ...d, employeur: v })} placeholder="Nom de l'entreprise" colSpan />
          <Field label="Salaire net mensuel (€)" value={d.salaireNetMensuel ?? ""} onChange={(v) => onChange({ ...d, salaireNetMensuel: parseFloat(v) || 0 })} placeholder="ex: 2 500" type="number" />
          <Field label="Type de contrat" value={d.typeContrat ?? ""} onChange={(v) => onChange({ ...d, typeContrat: v })} placeholder="CDI / CDD / Intérim" />
          <Field label="Ancienneté" value={d.anciennete ?? ""} onChange={(v) => onChange({ ...d, anciennete: v })} placeholder="ex: 3 ans" colSpan />
        </div>
      </div>

      {/* Fiscal — Avis d'imposition */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Situation fiscale (Avis d'imposition)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Revenus N-1 (€)" value={d.revenusN1 ?? ""} onChange={(v) => onChange({ ...d, revenusN1: parseFloat(v) || 0 })} placeholder="Revenus année N-1" type="number" />
          <Field label="Revenus N-2 (€)" value={d.revenusN2 ?? ""} onChange={(v) => onChange({ ...d, revenusN2: parseFloat(v) || 0 })} placeholder="Revenus année N-2" type="number" />
          <Field label="Nombre de parts" value={d.nombreParts ?? ""} onChange={(v) => onChange({ ...d, nombreParts: parseFloat(v) || 1 })} placeholder="ex: 1 ou 2,5" type="number" />
          <Field label="Situation fiscale" value={d.situationFiscale ?? ""} onChange={(v) => onChange({ ...d, situationFiscale: v })} placeholder="Célibataire / Marié / Pacsé" />
        </div>
      </div>

      {/* RIB */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Coordonnées bancaires (RIB)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Titulaire du compte" value={d.titulaireCompte ?? ""} onChange={(v) => onChange({ ...d, titulaireCompte: v })} placeholder="Nom du titulaire" colSpan />
          <Field label="IBAN" value={d.iban ?? ""} onChange={(v) => onChange({ ...d, iban: v })} placeholder="FR76 1234 5678 9012 3456 7890 123" colSpan />
          <Field label="BIC / SWIFT" value={d.bic ?? ""} onChange={(v) => onChange({ ...d, bic: v })} placeholder="ex: BNPAFRPPXXX" />
          <Field label="Banque" value={d.banque ?? ""} onChange={(v) => onChange({ ...d, banque: v })} placeholder="Nom de la banque" />
        </div>
      </div>

      {/* Justificatif de domicile */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Justificatif de domicile</p>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Adresse actuelle" value={d.adresseDomicile ?? ""} onChange={(v) => onChange({ ...d, adresseDomicile: v })} placeholder="12 rue de la Paix, 75001 Paris" colSpan />
        </div>
      </div>

      {/* Garant extérieur */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Garant extérieur</p>
          <button
            type="button"
            onClick={() => {
              const next = !showGarant;
              setShowGarant(next);
              if (!next) {
                onChange({ ...d, garant: undefined });
              } else {
                onChange({ ...d, garant: d.garant ?? EMPTY_GARANT });
              }
            }}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none
              ${showGarant ? "bg-emerald-500 border-emerald-500" : "bg-gray-200 border-gray-200"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out
                ${showGarant ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        {showGarant && (
          <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Renseignez les informations du garant. Le BailScore tiendra compte de ses revenus.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Nom garant"
                value={d.garant?.nom ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), nom: v } })}
                placeholder="NOM"
              />
              <Field
                label="Prénom garant"
                value={d.garant?.prenom ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), prenom: v } })}
                placeholder="Prénom"
              />
              <Field
                label="Date de naissance"
                value={d.garant?.dateNaissance ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), dateNaissance: v } })}
                placeholder="JJ/MM/AAAA"
              />
              <Field
                label="Lien de parenté"
                value={d.garant?.lienParente ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), lienParente: v } })}
                placeholder="parent, ami, employeur..."
              />
              <Field
                label="Salaire net mensuel (€)"
                value={d.garant?.salaireNetMensuel ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), salaireNetMensuel: parseFloat(v) || 0 } })}
                placeholder="ex: 3 000"
                type="number"
              />
              <Field
                label="Type de contrat"
                value={d.garant?.typeContrat ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), typeContrat: v } })}
                placeholder="CDI / CDD"
              />
              <Field
                label="Revenus N-1 (€)"
                value={d.garant?.revenusN1 ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), revenusN1: parseFloat(v) || 0 } })}
                placeholder="Revenus fiscaux"
                type="number"
              />
              <Field
                label="IBAN garant"
                value={d.garant?.iban ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), iban: v } })}
                placeholder="FR76..."
              />
              <Field
                label="Adresse garant"
                value={d.garant?.adresse ?? ""}
                onChange={(v) => onChange({ ...d, garant: { ...(d.garant ?? EMPTY_GARANT), adresse: v } })}
                placeholder="Adresse complète"
                colSpan
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
