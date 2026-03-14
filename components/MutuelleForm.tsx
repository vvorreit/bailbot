"use client";

import { MutuelleData, Personne } from "@/lib/parsers";

interface Props {
  data: MutuelleData;
  onChange: (data: MutuelleData) => void;
}

const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  placeholder:text-gray-300 transition-all`;

const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

function Field({ label, value, onChange, placeholder, colSpan }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "sm:col-span-2" : ""}>
      <label className={labelCls}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className={inputCls}
      />
    </div>
  );
}

function selectPersonne(data: MutuelleData, p: Personne): MutuelleData {
  return { ...data, nom: p.nom, prenom: p.prenom, numeroSecuriteSociale: p.numeroSecuriteSociale, dateNaissance: p.dateNaissance };
}

function isSelected(data: MutuelleData, p: Personne): boolean {
  return data.nom === p.nom && data.prenom === p.prenom;
}

export default function MutuelleForm({ data, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span className="text-2xl">💳</span> Carte Mutuelle
      </h2>

      {/* Infos organisme */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Organisme</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Organisme" value={data.organisme}
            onChange={(v) => onChange({ ...data, organisme: v })}
            placeholder="MALAKOFF HUMANIS..." colSpan />
          <Field label="N° AMC" value={data.numeroAMC}
            onChange={(v) => onChange({ ...data, numeroAMC: v })} placeholder="75949776" />
          <Field label="N° Adhérent" value={data.numeroAdherent}
            onChange={(v) => onChange({ ...data, numeroAdherent: v })} placeholder="13486638" />
          <Field label="N° Télétransmission" value={data.numeroTeletransmission}
            onChange={(v) => onChange({ ...data, numeroTeletransmission: v })} placeholder="75990010" />
          <Field label="Type convention" value={data.typeConv}
            onChange={(v) => onChange({ ...data, typeConv: v })} placeholder="VM / ROC : OC" />
          <Field label="Validité du" value={data.dateDebutValidite}
            onChange={(v) => onChange({ ...data, dateDebutValidite: v })} placeholder="01/01/2026" />
          <Field label="Validité au" value={data.dateFinValidite}
            onChange={(v) => onChange({ ...data, dateFinValidite: v })} placeholder="31/12/2026" />
        </div>
      </div>

      {/* Sélecteur de personne */}
      {data.personnes.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Choisir la personne ({data.personnes.length} détectée{data.personnes.length > 1 ? "s" : ""})
          </p>
          <div className="flex flex-col gap-2">
            {data.personnes.map((p, i) => {
              const selected = isSelected(data, p);
              return (
                <button
                  key={i}
                  onClick={() => onChange(selectPersonne(data, p))}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all
                    ${selected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"
                    }`}
                >
                  <div>
                    <span className={`text-sm font-bold ${selected ? "text-blue-700" : "text-gray-700"}`}>
                      {p.prenom} {p.nom}
                    </span>
                    <span className="ml-3 text-xs text-gray-400 font-mono">{p.numeroSecuriteSociale}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">né(e) le {p.dateNaissance}</span>
                    {selected && (
                      <span className="text-blue-500 text-sm">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Personne sélectionnée */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Assuré sélectionné</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nom" value={data.nom}
            onChange={(v) => onChange({ ...data, nom: v })} placeholder="NOM" />
          <Field label="Prénom" value={data.prenom}
            onChange={(v) => onChange({ ...data, prenom: v })} placeholder="Prénom" />
          <Field label="N° Sécurité Sociale" value={data.numeroSecuriteSociale}
            onChange={(v) => onChange({ ...data, numeroSecuriteSociale: v })} placeholder="13 chiffres" colSpan />
          <Field label="Date de naissance" value={data.dateNaissance}
            onChange={(v) => onChange({ ...data, dateNaissance: v })} placeholder="JJ/MM/AAAA" />
        </div>
      </div>
    </div>
  );
}
