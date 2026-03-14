"use client";

import { DossierLocataire } from "@/lib/parsers";

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

export default function DossierForm({ data, onChange }: Props) {
  const d = data ?? {};

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
    </div>
  );
}
