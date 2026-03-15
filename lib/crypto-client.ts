'use client';

export async function genererCle(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exporterCle(cle: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', cle);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importerCle(cleBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(cleBase64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
}

export async function chiffrerFichier(
  fichier: File,
  cle: CryptoKey
): Promise<{ contenuChiffre: ArrayBuffer; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await fichier.arrayBuffer();
  const chiffre = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cle,
    buffer
  );
  return {
    contenuChiffre: chiffre,
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function dechiffrerFichier(
  contenuChiffre: ArrayBuffer,
  cle: CryptoKey,
  ivBase64: string
): Promise<ArrayBuffer> {
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cle, contenuChiffre);
}
