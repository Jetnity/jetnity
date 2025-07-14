"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function TextToVideoMock() {
  const [script, setScript] = useState("");
  const [storyboard, setStoryboard] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!script.trim()) return;

    setLoading(true);
    setStoryboard([]);

    try {
      const res = await fetch("/api/storyboard", {
        method: "POST",
        body: JSON.stringify({ script }),
      });

      const { scenes } = await res.json();
      if (!scenes || !Array.isArray(scenes)) throw new Error("Fehlerhafte Antwort");

      setStoryboard(scenes);
      toast.success("Storyboard erstellt!");
    } catch (err) {
      toast.error("Storyboard-Generierung fehlgeschlagen.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow space-y-4 mt-12">
      <h3 className="text-lg font-semibold">🎬 Video-Storyboard mit KI erstellen</h3>
      <textarea
        placeholder="Thema oder Skript eingeben – z. B. 'Städtetrip nach Lissabon'"
        value={script}
        onChange={(e) => setScript(e.target.value)}
        className="w-full border px-4 py-2 rounded-lg min-h-[100px]"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? "Generiere…" : "Storyboard generieren"}
      </button>

      {storyboard.length > 0 && (
        <div className="space-y-3 pt-4">
          <h4 className="text-sm font-bold text-gray-700">🎞 Szenenübersicht</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {storyboard.map((scene, i) => (
              <li key={i}>{scene}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
