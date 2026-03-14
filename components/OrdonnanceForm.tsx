"use client";

import { OrdonnanceData, CorrectionOeil, CorrectionLentille } from "@/lib/parsers";

interface Props {
  data: OrdonnanceData;
  onChange: (data: OrdonnanceData) => void;
}

const inputCls = `w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  placeholder:text-gray-300 transition-all text-center`;

const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

function Field({ label, value, onChange, placeholder, full }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; full?: boolean;
}) {
  return (
    <div className={full ? "col-span-full" : ""}>
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

function OeilRow({ label, data, onChange }: {
  label: string;
  data: CorrectionOeil;
  onChange: (d: CorrectionOeil) => void;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-3 text-xs font-bold text-gray-600 whitespace-nowrap">{label}</td>
      {(["sphere", "cylindre", "axe", "addition"] as const).map((field) => (
        <td key={field} className="py-2 px-1">
          <input
            type="text"
            value={data[field]}
            onChange={(e) => onChange({ ...data, [field]: e.target.value })}
            placeholder="—"
            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-300 transition-all"
          />
        </td>
      ))}
    </tr>
  );
}

function LentilleRow({ label, data, onChange }: {
  label: string;
  data: CorrectionLentille;
  onChange: (d: CorrectionLentille) => void;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-3 text-xs font-bold text-gray-600 whitespace-nowrap">{label}</td>
      {(["sphere", "cylindre", "axe", "addition", "rayonCourbure", "diametre"] as const).map((field) => (
        <td key={field} className="py-2 px-1">
          <input
            type="text"
            value={data[field]}
            onChange={(e) => onChange({ ...data, [field]: e.target.value })}
            placeholder="—"
            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-300 transition-all"
          />
        </td>
      ))}
    </tr>
  );
}

export default function OrdonnanceForm({ data, onChange }: Props) {
  const showLunettes = data.typePrescription !== "lentilles";
  const showLentilles = data.typePrescription === "lentilles" || data.typePrescription === "les deux";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span className="text-2xl">👁️</span> Ordonnance opticien
      </h2>

      {/* Prescripteur + patient */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Prescripteur & Patient</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ophtalmologue" value={data.nomOphtalmologue}
            onChange={(v) => onChange({ ...data, nomOphtalmologue: v })} placeholder="Dr. Nom" full />
          <Field label="Nom patient" value={data.nomPatient}
            onChange={(v) => onChange({ ...data, nomPatient: v })} placeholder="Nom" />
          <Field label="Prénom patient" value={data.prenomPatient}
            onChange={(v) => onChange({ ...data, prenomPatient: v })} placeholder="Prénom" />
          <Field label="Date de naissance" value={data.dateNaissancePatient}
            onChange={(v) => onChange({ ...data, dateNaissancePatient: v })} placeholder="JJ/MM/AAAA" />
          <Field label="Date ordonnance" value={data.dateOrdonnance}
            onChange={(v) => onChange({ ...data, dateOrdonnance: v })} placeholder="JJ/MM/AAAA" />
          <Field label="Valable jusqu'au" value={data.dateValidite}
            onChange={(v) => onChange({ ...data, dateValidite: v })} placeholder="JJ/MM/AAAA" />
          <Field label="Distance pupillaire" value={data.distancePupillaire ?? ""}
            onChange={(v) => onChange({ ...data, distancePupillaire: v })} placeholder="ex : 67 mm" />
        </div>
      </div>

      {/* Type de prescription */}
      <div>
        <p className={labelCls}>Type de prescription</p>
        <div className="flex gap-2 flex-wrap">
          {(["lunettes", "lentilles", "les deux"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...data, typePrescription: t })}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize
                ${data.typePrescription === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-blue-400"}`}
            >
              {t === "lunettes" ? "🕶️ Lunettes" : t === "lentilles" ? "🔵 Lentilles" : "🕶️+🔵 Les deux"}
            </button>
          ))}
        </div>
      </div>

      {/* Correction lunettes */}
      {showLunettes && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Correction Lunettes</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="py-2 text-left text-gray-400 font-semibold w-10"></th>
                  {["Sphère", "Cylindre", "Axe", "Addition"].map((h) => (
                    <th key={h} className="py-2 px-1 text-center text-gray-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <OeilRow label="OD" data={data.lunettesOD}
                  onChange={(d) => onChange({ ...data, lunettesOD: d })} />
                <OeilRow label="OG" data={data.lunettesOG}
                  onChange={(d) => onChange({ ...data, lunettesOG: d })} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correction lentilles */}
      {showLentilles && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Correction Lentilles</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="py-2 text-left text-gray-400 font-semibold w-10"></th>
                  {["Sphère", "Cylindre", "Axe", "Addition", "BC", "DIA"].map((h) => (
                    <th key={h} className="py-2 px-1 text-center text-gray-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <LentilleRow label="OD" data={data.lentillesOD}
                  onChange={(d) => onChange({ ...data, lentillesOD: d })} />
                <LentilleRow label="OG" data={data.lentillesOG}
                  onChange={(d) => onChange({ ...data, lentillesOG: d })} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remarques */}
      <div>
        <label className={labelCls}>Remarques</label>
        <textarea
          value={data.remarques}
          onChange={(e) => onChange({ ...data, remarques: e.target.value })}
          placeholder="Observations, port permanent, VL seule..."
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-gray-300 transition-all resize-none"
        />
      </div>
    </div>
  );
}
