'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
} from 'lucide-react';
import type { ResultatComparaison, ComparaisonPiece, ComparaisonElement } from '@/app/actions/comparaison-edl';
import jsPDF from 'jspdf';

const VERDICT_CONFIG = {
  restitution_integrale: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  retenue_partielle: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: AlertTriangle,
  },
  retenue_totale: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: AlertTriangle,
  },
};

interface Props {
  resultat: ResultatComparaison;
  bailleurNom?: string;
  bailleurAdresse?: string;
}

export default function ComparaisonEDL({ resultat, bailleurNom, bailleurAdresse }: Props) {
  const [expandedPiece, setExpandedPiece] = useState<number>(0);
  const cfg = VERDICT_CONFIG[resultat.verdict];
  const Icon = cfg.icon;

  const handleExportPDF = () => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageW = 210;
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;
    let y = 20;

    const checkPage = (needed: number = 15) => {
      if (y + needed > 270) {
        doc.addPage();
        y = 20;
      }
    };

    /* Header */
    doc.setFillColor(16, 185, 129);
    doc.rect(marginL, y, contentW, 12, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('COMPARAISON DES ÉTATS DES LIEUX', pageW / 2, y + 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 18;

    /* Infos */
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse :', marginL, y);
    doc.setFont('helvetica', 'normal');
    doc.text(resultat.adresse, marginL + 30, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Entrée :', marginL, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(resultat.dateEntree).toLocaleDateString('fr-FR'), marginL + 30, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Sortie :', marginL, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(resultat.dateSortie).toLocaleDateString('fr-FR'), marginL + 30, y);
    y += 10;

    /* Tableau comparatif */
    for (const piece of resultat.pieces) {
      checkPage(20);
      doc.setFillColor(240, 253, 244);
      doc.rect(marginL, y, contentW, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 120, 85);
      doc.text(piece.nom.toUpperCase(), marginL + 3, y + 5);
      doc.setTextColor(0, 0, 0);
      y += 10;

      /* En-tête colonnes */
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Élément', marginL + 3, y);
      doc.text('Entrée', marginL + 55, y);
      doc.text('Sortie', marginL + 80, y);
      doc.text('Delta', marginL + 105, y);
      doc.text('Imputable', marginL + 120, y);
      doc.text('Retenue', marginL + 145, y);
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(marginL, y, pageW - marginR, y);
      y += 3;

      for (const elem of piece.elements) {
        checkPage(8);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(elem.nom.substring(0, 25), marginL + 3, y);
        doc.text(elem.etatEntree, marginL + 55, y);
        doc.text(elem.etatSortie, marginL + 80, y);
        doc.text(String(elem.delta), marginL + 108, y);
        doc.text(elem.imputable ? 'OUI' : 'Non', marginL + 123, y);
        if (elem.estimationRetenue > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${elem.estimationRetenue} €`, marginL + 148, y);
          doc.setFont('helvetica', 'normal');
        } else {
          doc.text('—', marginL + 148, y);
        }
        y += 4.5;
      }

      if (piece.totalRetenue > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Sous-total : ${piece.totalRetenue} €`, marginL + 130, y);
        y += 3;
      }
      y += 3;
    }

    /* Total */
    checkPage(20);
    y += 5;
    doc.setDrawColor(0, 0, 0);
    doc.line(marginL, y, pageW - marginR, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL RETENUE : ${resultat.totalRetenue.toLocaleString('fr-FR')} €`, marginL, y);
    if (resultat.depotGarantie) {
      y += 6;
      doc.setFontSize(9);
      doc.text(`Dépôt de garantie : ${resultat.depotGarantie.toLocaleString('fr-FR')} €`, marginL, y);
      y += 5;
      const restitution = Math.max(0, resultat.depotGarantie - resultat.totalRetenue);
      doc.text(`À restituer : ${restitution.toLocaleString('fr-FR')} €`, marginL, y);
    }
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Verdict : ${resultat.verdictLabel}`, marginL, y);

    /* Footer */
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('Généré par BailBot — Comparaison EDL', pageW / 2, 287, { align: 'center' });
    }

    doc.save(`Comparaison_EDL_${resultat.adresse.substring(0, 20)}.pdf`);
  };

  const handleLettreRetenue = () => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const marginL = 25;
    let y = 30;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    /* Expéditeur */
    doc.text(bailleurNom || '[Nom du bailleur]', marginL, y);
    y += 5;
    if (bailleurAdresse) {
      doc.text(bailleurAdresse, marginL, y);
      y += 5;
    }

    y += 10;
    doc.text(resultat.nomLocataire || '[Nom du locataire]', 120, y);
    y += 15;

    /* Date et objet */
    doc.text(`Le ${new Date().toLocaleDateString('fr-FR')}`, marginL, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Objet : Restitution du dépôt de garantie — Retenue pour dégradations', marginL, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.text('Madame, Monsieur,', marginL, y);
    y += 8;

    const intro = `Suite à votre départ du logement situé ${resultat.adresse}, et conformément à l'état des lieux de sortie réalisé le ${new Date(resultat.dateSortie).toLocaleDateString('fr-FR')}, je vous informe que des dégradations imputables ont été constatées.`;
    const lines = doc.splitTextToSize(intro, 160);
    doc.text(lines, marginL, y);
    y += lines.length * 4.5 + 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Détail des retenues :', marginL, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    for (const piece of resultat.pieces) {
      if (!piece.hasDegradation) continue;
      for (const elem of piece.elements) {
        if (!elem.imputable) continue;
        const line = `• ${piece.nom} — ${elem.nom} : ${elem.etatEntree} → ${elem.etatSortie} — ${elem.estimationRetenue} €`;
        doc.text(line, marginL + 5, y);
        y += 5;
        if (y > 260) { doc.addPage(); y = 25; }
      }
    }

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total des retenues : ${resultat.totalRetenue.toLocaleString('fr-FR')} €`, marginL, y);
    y += 5;

    if (resultat.depotGarantie) {
      doc.text(`Dépôt de garantie versé : ${resultat.depotGarantie.toLocaleString('fr-FR')} €`, marginL, y);
      y += 5;
      const aRestituer = Math.max(0, resultat.depotGarantie - resultat.totalRetenue);
      doc.text(`Montant à restituer : ${aRestituer.toLocaleString('fr-FR')} €`, marginL, y);
      y += 8;
    }

    doc.setFont('helvetica', 'normal');
    const closing = 'Conformément à l\'article 22 de la loi du 6 juillet 1989, la restitution du solde vous sera adressée dans un délai maximum de deux mois à compter de la remise des clés, déduction faite des sommes dues.';
    const closingLines = doc.splitTextToSize(closing, 160);
    doc.text(closingLines, marginL, y);
    y += closingLines.length * 4.5 + 8;

    doc.text('Veuillez agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.', marginL, y);
    y += 15;

    doc.text(bailleurNom || '[Signature]', marginL, y);

    /* Footer */
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Généré par BailBot · contact@optibot.fr', 105, 287, { align: 'center' });

    doc.save(`Lettre_retenue_${resultat.adresse.substring(0, 20)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Verdict */}
      <div className={`border rounded-2xl p-5 ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <Icon className={`w-6 h-6 ${cfg.text}`} />
          <div>
            <p className={`text-lg font-black ${cfg.text}`}>{resultat.verdictLabel}</p>
            {resultat.depotGarantie && (
              <p className="text-sm text-slate-600 mt-1">
                Dépôt de garantie : {resultat.depotGarantie.toLocaleString('fr-FR')} € —
                À restituer : {Math.max(0, resultat.depotGarantie - resultat.totalRetenue).toLocaleString('fr-FR')} €
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          PDF comparaison
        </button>
        {resultat.totalRetenue > 0 && (
          <button
            onClick={handleLettreRetenue}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Lettre de retenue
          </button>
        )}
      </div>

      {/* Infos */}
      <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Adresse</span>
          <p className="font-bold text-slate-900">{resultat.adresse}</p>
        </div>
        <div>
          <span className="text-slate-500">Total retenue</span>
          <p className="font-bold text-slate-900">{resultat.totalRetenue.toLocaleString('fr-FR')} €</p>
        </div>
        <div>
          <span className="text-slate-500">EDL entrée</span>
          <p className="font-bold text-slate-900">{new Date(resultat.dateEntree).toLocaleDateString('fr-FR')}</p>
        </div>
        <div>
          <span className="text-slate-500">EDL sortie</span>
          <p className="font-bold text-slate-900">{new Date(resultat.dateSortie).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Comparaison pièce par pièce */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Détail par pièce
        </h3>

        {resultat.pieces.map((piece, pi) => (
          <div key={pi} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedPiece(expandedPiece === pi ? -1 : pi)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">{piece.nom}</span>
                {piece.hasDegradation && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                    Dégradation
                  </span>
                )}
                {piece.totalRetenue > 0 && (
                  <span className="text-xs font-bold text-amber-600">
                    {piece.totalRetenue} €
                  </span>
                )}
              </div>
              {expandedPiece === pi ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {expandedPiece === pi && (
              <div className="p-4">
                {/* En-tête tableau */}
                <div className="hidden sm:grid grid-cols-6 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                  <span>Élément</span>
                  <span>Entrée</span>
                  <span>Sortie</span>
                  <span>Delta</span>
                  <span>Imputable</span>
                  <span>Retenue</span>
                </div>

                <div className="space-y-2">
                  {piece.elements.map((elem, ei) => (
                    <ElementRow key={ei} elem={elem} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ElementRow({ elem }: { elem: ComparaisonElement }) {
  const deltaColor = elem.delta <= 0 ? 'text-emerald-600' : elem.delta <= 1 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-6 gap-2 p-2 rounded-lg text-sm ${
      elem.imputable ? 'bg-red-50' : 'bg-white'
    }`}>
      <span className="font-semibold text-slate-800 col-span-2 sm:col-span-1">{elem.nom}</span>
      <span className="text-slate-600">{elem.etatEntree}</span>
      <span className="text-slate-600">{elem.etatSortie}</span>
      <span className={`font-bold ${deltaColor}`}>{elem.delta > 0 ? `−${elem.delta}` : elem.delta === 0 ? '=' : `+${Math.abs(elem.delta)}`}</span>
      <span className={`font-bold ${elem.imputable ? 'text-red-600' : 'text-slate-400'}`}>
        {elem.imputable ? 'OUI' : 'Non'}
      </span>
      <span className="font-bold text-slate-900">
        {elem.estimationRetenue > 0 ? `${elem.estimationRetenue} €` : '—'}
      </span>

      {/* Photos side by side on mobile */}
      {(elem.photosEntree.length > 0 || elem.photosSortie.length > 0) && (
        <div className="col-span-2 sm:col-span-6 flex gap-4 mt-1">
          {elem.photosEntree.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">Entrée</p>
              <div className="flex gap-1">
                {elem.photosEntree.slice(0, 3).map((p, i) => (
                  <img key={i} src={p} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" loading="lazy" />
                ))}
              </div>
            </div>
          )}
          {elem.photosSortie.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">Sortie</p>
              <div className="flex gap-1">
                {elem.photosSortie.slice(0, 3).map((p, i) => (
                  <img key={i} src={p} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" loading="lazy" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
