"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = {
  upload: {
    id: string;
    image_url: string;
    title: string;
  };
  onClose: () => void;
  onUpdate?: (updated: any) => void; // nur falls gebraucht
};

export default function EditUploadModal({ upload, onClose, onUpdate }: Props) {
  const [variant, setVariant] = useState("travel-style");
  const [loading, setLoading] = useState(false);
  const [newImage, setNewImage] = useState("");

  const generateRemix = async () => {
    setLoading(true);
    setNewImage("");

    try {
      const res = await fetch("/api/remix-image", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: upload.image_url,
          variant,
        }),
      });

      const { imageUrl } = await res.json();
      if (!imageUrl) throw new Error("Keine Antwort");

      setNewImage(imageUrl);
      toast.success("Remix erfolgreich!");
    } catch (e) {
      toast.error("Fehler beim Remixen");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-xl shadow space-y-4">
        <h3 className="text-lg font-semibold">🖼 Bild bearbeiten: {upload.title}</h3>
        <img src={upload.image_url} alt="Original" className="w-full rounded-lg" />

        <select
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
          className="w-full border px-4 py-2 rounded-lg"
        >
          <option value="travel-style">Reisestil (Postkarte)</option>
          <option value="cinematic">Cinematisch</option>
          <option value="bright-retouch">Helle Retusche</option>
          <option value="ad-banner">Werbeformat</option>
        </select>

        <button
          onClick={generateRemix}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 transition"
        >
          {loading ? "Wird generiert…" : "Remix erstellen"}
        </button>

        {newImage && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Neue Vorschau:</p>
            <img src={newImage} alt="Remixed" className="w-full rounded-lg" />
          </div>
        )}

        <button
          onClick={onClose}
          className="text-sm text-gray-500 underline w-full mt-2"
        >
          Fenster schließen
        </button>
      </div>
    </div>
  );
}
