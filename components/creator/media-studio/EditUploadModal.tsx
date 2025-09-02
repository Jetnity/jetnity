"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Link as LinkIcon, ExternalLink, X, Wand2, Loader2, Check, Copy } from "lucide-react";

type RemixVariant =
  | "travel-style"
  | "cinematic"
  | "bright-retouch"
  | "ad-banner";

type Props = {
  upload: {
    id: string;
    image_url: string;
    title: string;
  };
  onClose: () => void;
  /** Wird nach erfolgreichem Speichern/Übernehmen gerufen. */
  onUpdate?: (updated: { id: string; image_url: string }) => void;
};

type RemixResponse = {
  imageUrl?: string;       // bevorzugt: absolute oder signierte URL
  bucket?: string;         // optional: falls als "bucket/path" zurückkommt
  path?: string;
  mime?: string;
  error?: string;
};

export default function EditUploadModal({ upload, onClose, onUpdate }: Props) {
  // ---- State
  const [variant, setVariant] = useState<RemixVariant>("travel-style");
  const [prompt, setPrompt] = useState("");             // optionaler Zusatzprompt
  const [strength, setStrength] = useState(0.65);       // 0..1
  const [ratio, setRatio] = useState<"1:1" | "3:2" | "4:5" | "16:9">("3:2");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [newImage, setNewImage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const firstFocusable = useRef<HTMLButtonElement | null>(null);
  const lastFocusable = useRef<HTMLButtonElement | null>(null);

  // ---- Derived
  const canGenerate = useMemo(() => !loading, [loading]);
  const title = upload.title || "Bild";

  // ---- Cleanup object URLs (falls jemals gesetzt würden)
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ---- Keyboard shortcuts: ESC schließt, Cmd/Ctrl+Enter generiert
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
      e.preventDefault();
      if (canGenerate) void generateRemix();
    }
    // sehr simple Fokussperre (Focus Trap Light):
    if (e.key === "Tab") {
      const active = document.activeElement;
      if (e.shiftKey && active === firstFocusable.current) {
        e.preventDefault();
        lastFocusable.current?.focus();
      } else if (!e.shiftKey && active === lastFocusable.current) {
        e.preventDefault();
        firstFocusable.current?.focus();
      }
    }
  }

  // ---- Network helpers
  async function fetchJSON(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    }
    return data as RemixResponse;
  }

  async function generateRemix() {
    if (!upload?.image_url) return;

    setLoading(true);
    setNewImage("");
    setProgress(0);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const payload = {
      imageUrl: upload.image_url,
      variant,
      prompt: prompt.trim() || undefined,
      strength,
      ratio,
    };

    // Simulierter Fortschritt-Loop (falls Backend keins streamt)
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(95, (p + 7));
      setProgress(p);
    }, 250);

    try {
      const body = JSON.stringify(payload);
      const data = await fetchJSON("/api/remix-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: abortRef.current.signal,
      });

      const url = resolveOutputUrl(data);
      if (!url) throw new Error("Keine Ausgabe-URL erhalten.");

      clearInterval(tick);
      setProgress(100);
      setNewImage(url);
      toast.success("Remix erfolgreich!", { description: variantLabel(variant) });
    } catch (e: any) {
      clearInterval(tick);
      setProgress(null);
      if (e?.name === "AbortError") {
        toast.message("Abgebrochen");
      } else {
        toast.error("Fehler beim Remixen", { description: String(e?.message || e) });
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }

  function cancelRemix() {
    abortRef.current?.abort();
    setLoading(false);
    setProgress(null);
  }

  function resolveOutputUrl(r: RemixResponse): string | null {
    if (r?.imageUrl) return r.imageUrl;
    if (r?.bucket && r?.path) {
      // Falls Backend Bucket/Path liefert, mit öffentlicher Delivery-Domain ersetzen
      // (Hier neutral: als relative URL; deine fetch-Logik kann signierte Links erzeugen.)
      return `${r.bucket}/${r.path}`;
    }
    return null;
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast.success("Link kopiert");
    } catch {
      toast.error("Konnte Link nicht kopieren");
    }
  }

  async function downloadImage(url: string) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = toSafeFilename(`${title}-${variant}.png`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error("Download fehlgeschlagen");
      console.error(e);
    }
  }

  function applyAsUpdate() {
    if (!newImage) return;
    onUpdate?.({ id: upload.id, image_url: newImage });
    toast.success("Übernommen");
    onClose();
  }

  // ---- UI helpers
  function variantLabel(v: RemixVariant) {
    switch (v) {
      case "travel-style": return "Reisestil (Postkarte)";
      case "cinematic": return "Cinematisch";
      case "bright-retouch": return "Helle Retusche";
      case "ad-banner": return "Werbeformat";
      default: return v;
    }
  }

  function toSafeFilename(name: string) {
    return name.replace(/[^\w\-_.]+/g, "_");
  }

  // ---- Render
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3"
      role="dialog"
      aria-modal="true"
      aria-label="Bild bearbeiten"
      onKeyDown={onKeyDown}
    >
      <div className="w-full max-w-3xl rounded-2xl border bg-white p-0 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">🖼 Bild bearbeiten: {title}</h3>
            <p className="text-xs text-gray-500">ESC schließen · ⌘/Ctrl+Enter generieren</p>
          </div>
          <button
            ref={firstFocusable}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-gray-50"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 p-5">
          {/* Left: Controls */}
          <div className="md:col-span-2 space-y-4">
            {/* Variant */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Stil</label>
              <div className="grid grid-cols-2 gap-2">
                {(["travel-style","cinematic","bright-retouch","ad-banner"] as RemixVariant[]).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${variant===v ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    {variantLabel(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Zusatz-Prompt (optional)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="z. B. warmes Abendlicht, goldene Stunde, feine Körnung"
              />
            </div>

            {/* Strength */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label className="font-medium text-gray-600">Stärke</label>
                <span className="tabular-nums text-gray-500">{Math.round(strength * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.01}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Ratio */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Seitenverhältnis</label>
              <div className="flex flex-wrap gap-2">
                {(["1:1","3:2","4:5","16:9"] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRatio(r)}
                    className={`rounded-md border px-2 py-1 text-xs ${ratio===r ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {!loading ? (
                <button
                  type="button"
                  onClick={generateRemix}
                  disabled={!canGenerate}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Remix erstellen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cancelRemix}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-300"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird generiert… (Abbrechen)
                </button>
              )}
            </div>

            {typeof progress === "number" && (
              <div aria-label="Fortschritt" className="rounded-md bg-gray-100">
                <div
                  className="h-2 rounded-md bg-blue-600 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
            )}
          </div>

          {/* Right: Preview (Before/After) */}
          <div className="md:col-span-3 space-y-3">
            <div className="relative overflow-hidden rounded-xl border">
              <BeforeAfter original={upload.image_url} remixed={newImage} />
            </div>

            {newImage && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => downloadImage(newImage)}
                >
                  <Download className="mr-2 h-4 w-4" /> Download
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => copyLink(newImage)}
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Kopiert" : "Link kopieren"}
                </button>
                <a
                  href={newImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> In neuem Tab öffnen
                </a>

                <div className="ml-auto" />
                <button
                  ref={lastFocusable}
                  type="button"
                  onClick={applyAsUpdate}
                  className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  disabled={!newImage}
                >
                  Übernehmen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Very lightweight Before/After Slider (keine externen Libs). */
function BeforeAfter({ original, remixed }: { original: string; remixed?: string }) {
  const container = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(50);

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    const el = container.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }

  return (
    <div
      ref={container}
      className="relative aspect-[3/2] w-full select-none"
      onMouseMove={(e) => e.buttons === 1 && onMove(e)}
      onTouchMove={(e) => onMove(e)}
    >
      <img src={original} alt="Original" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
      {remixed && (
        <>
          <img
            src={remixed}
            alt="Remix"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            loading="lazy"
            decoding="async"
          />
          <div
            className="absolute inset-y-0 bg-white/70"
            style={{ left: `calc(${pos}% - 1px)`, width: 2 }}
          />
          <div
            className="absolute inset-y-0 flex items-center"
            style={{ left: `calc(${pos}% - 12px)` }}
          >
            <div className="h-6 w-6 cursor-ew-resize rounded-full border bg-white shadow" />
          </div>
        </>
      )}
    </div>
  );
}
