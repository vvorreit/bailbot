"use client";

import { useState, useEffect, useRef } from "react";
import { PenTool, Check, Loader2, Trash2 } from "lucide-react";
import { getSignatureRequest, submitSignature } from "@/app/actions/signature";

export default function SignPageClient({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    getSignatureRequest(token)
      .then((d) => {
        setData(d);
        if (d?.signedAt) setSigned(true);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [data]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL("image/png");
    setSubmitting(true);
    try {
      await submitSignature(token, signatureData);
      setSigned(true);
    } catch {}
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 mb-2">Lien invalide ou expire</p>
          <p className="text-sm text-slate-500">Ce lien de signature n'est plus valide.</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mb-2">Document signe</p>
          <p className="text-sm text-slate-500">Merci, votre signature a ete enregistree.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <PenTool className="w-6 h-6 text-emerald-600" />
          <h1 className="text-lg font-black text-slate-900">Signature electronique</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-sm text-slate-600 mb-1">Document : <span className="font-bold">{data.documentType}</span></p>
          <p className="text-sm text-slate-600">Signataire : <span className="font-bold">{data.signataire}</span></p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Dessinez votre signature</p>
            <button onClick={clearCanvas} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" /> Effacer
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full h-40 border-2 border-dashed border-slate-200 rounded-xl cursor-crosshair bg-white touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Signer le document
        </button>
      </div>
    </div>
  );
}
