"use client";

import { useDropzone } from "react-dropzone";
import { useCallback } from "react";

interface DropZoneProps {
  label: string;
  icon: string;
  onFile: (file: File) => void;
  isLoading: boolean;
  progress: number;
  fileName?: string;
}

export default function DropZone({ label, icon, onFile, isLoading, progress, fileName }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [] },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      aria-label={`Zone de dépôt : ${label}`}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed
        cursor-pointer transition-all duration-200 min-h-[180px] select-none
        ${isDragActive ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"}
        ${isLoading ? "cursor-not-allowed opacity-80" : ""}
      `}
    >
      <input {...getInputProps()} />

      {isLoading ? (
        <>
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-blue-600">Analyse en cours... {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <span className="text-5xl" aria-hidden="true">{icon}</span>
          <p className="text-base font-semibold text-gray-700 text-center">{label}</p>
          {fileName ? (
            <p className="text-xs text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
              ✓ {fileName}
            </p>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              {isDragActive ? "Déposez ici !" : "Glissez un fichier ou cliquez pour choisir"}
              <br />JPG, PNG ou PDF
            </p>
          )}
        </>
      )}
    </div>
  );
}
