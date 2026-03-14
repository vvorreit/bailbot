import { createWorker } from "tesseract.js";

// ── Image → texte via Tesseract ───────────────────────────────────────────────

export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await createWorker("fra+eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const imageUrl = URL.createObjectURL(file);
  const { data } = await worker.recognize(imageUrl);
  await worker.terminate();
  URL.revokeObjectURL(imageUrl);

  return data.text;
}

// ── PDF → texte natif (extraction directe, sans OCR) ─────────────────────────
// Beaucoup plus rapide et précis pour les PDF numériques (non scannés)

async function extractTextFromPDFNative(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // 1. On récupère les items avec leur position
    const items = content.items.filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item).map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5], // Attention: Y est souvent inversé (0 en bas) dans les PDF
      w: item.width || 0
    }));

    // 2. On trie les items : D'abord par Y (descendant = haut vers bas), puis par X (ascendant = gauche vers droite)
    // On utilise une tolérance (epsilon) pour Y car les items d'une même ligne ne sont pas toujours au pixel près
    const Y_TOLERANCE = 4;
    
    items.sort((a, b) => {
      const diffY = Math.abs(a.y - b.y);
      if (diffY < Y_TOLERANCE) {
        return a.x - b.x; // Même ligne (à peu près) -> ordre gauche-droite
      }
      return b.y - a.y; // Lignes différentes -> ordre haut-bas
    });

    // 3. Reconstruction du texte
    let currentY: number | null = null;
    let currentX: number | null = null;
    let line = "";

    for (const item of items) {
      if (currentY === null) {
        currentY = item.y;
        currentX = item.x + item.w;
        line = item.str;
        continue;
      }

      // Changement de ligne
      if (Math.abs(item.y - currentY) > Y_TOLERANCE) {
        texts.push(line);
        line = item.str;
        currentY = item.y;
        currentX = item.x + item.w;
      } else {
        // Même ligne : gestion de l'espacement
        // Si l'écart horizontal est grand, on ajoute des espaces visuels
        const gap = item.x - (currentX || 0);
        if (gap > 10) {
          line += "   " + item.str; // Grand espace (changement de colonne)
        } else if (gap > 2) {
          line += " " + item.str;   // Espace mot normal
        } else {
          line += item.str;         // Collé (partie de mot)
        }
        currentX = item.x + item.w;
      }
    }
    if (line) texts.push(line);
    texts.push(""); // Séparateur de page
  }

  return texts.join("\n");
}

// ── PDF → texte via OCR (fallback pour PDF scannés) ──────────────────────────

async function extractTextFromPDFOCR(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const canvas = document.createElement("canvas");
    const viewport = page.getViewport({ scale: 2.5 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d")!;
    await page.render({
      canvasContext: ctx as Parameters<typeof page.render>[0]["canvasContext"],
      canvas,
      viewport,
    }).promise;

    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/png")
    );
    const imageFile = new File([blob], `page-${i}.png`, { type: "image/png" });
    const pageText = await extractTextFromImage(imageFile, (p) => {
      if (onProgress) onProgress(Math.round(((i - 1 + p / 100) / pdf.numPages) * 100));
    });
    texts.push(pageText);
  }

  return texts.join("\n");
}

// ── Point d'entrée principal ──────────────────────────────────────────────────

export async function processDocument(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (file.type === "application/pdf") {
    // Essaie d'abord l'extraction native (PDF numérique)
    const nativeText = await extractTextFromPDFNative(file);
    // Si le texte natif est substantiel (> 100 chars), on l'utilise directement
    if (nativeText.replace(/\s/g, "").length > 100) {
      onProgress?.(100);
      return nativeText;
    }
    // Sinon : PDF scanné → OCR
    return extractTextFromPDFOCR(file, onProgress);
  }

  return extractTextFromImage(file, onProgress);
}
