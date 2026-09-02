"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { AuthImage } from "@/components/AuthImage";

/**
 * Campo de imagem por-usuário: envia do dispositivo para /api/me/media (qualquer jogador,
 * fora de campanha) OU aceita uma URL externa colada. Serve para o retrato da ficha. O
 * valor final é sempre uma string (URL /api/media/... ou link externo). Preview via
 * AuthImage, que busca a mídia protegida com o token e exibe URL externa direto.
 */
export function UserImageField({
  value, onChange, onError, testid = "user-image",
}: {
  value: string;
  onChange: (url: string) => void;
  onError?: (msg: string | null) => void;
  testid?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onError?.(null);
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      const saved = await uploadFile<{ id: string; url: string }>("/me/media", compressed);
      onChange(saved.url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "erro ao enviar a imagem");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="img-field">
      <div className="img-field-actions">
        <input ref={fileRef} type="file" accept="image/*" onChange={pick}
          data-testid={`${testid}-file`} style={{ display: "none" }} />
        <button type="button" className="secondary" disabled={busy}
          onClick={() => fileRef.current?.click()} data-testid={`${testid}-pick`}>
          {busy ? <><span className="spinner" /> Enviando…</> : "📷 Enviar foto"}
        </button>
        {!showUrl && !value && (
          <button type="button" className="ghost" onClick={() => setShowUrl(true)}>ou colar URL</button>
        )}
        {value && (
          <button type="button" className="ghost" onClick={() => { onChange(""); setShowUrl(false); }}
            data-testid={`${testid}-clear`} style={{ color: "var(--err)" }}>Remover</button>
        )}
      </div>

      {(showUrl || (value && !value.startsWith("/api/"))) && (
        <input data-testid={testid} value={value} placeholder="URL de imagem"
          onChange={(e) => onChange(e.target.value)} />
      )}

      {value.trim() && (
        <AuthImage src={value} alt="retrato" className="img-field-preview" />
      )}
    </div>
  );
}
