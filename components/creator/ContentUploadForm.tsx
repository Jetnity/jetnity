"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import type { TablesInsert } from "@/types/supabase"; // <-- automatisch generierter Typ

export default function ContentUploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState("");
  const [region, setRegion] = useState("");
  const [format, setFormat] = useState("Foto");
  const [tags, setTags] = useState(""); // Eingabe als String
  const [language, setLanguage] = useState("de");
  const [mood, setMood] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError("");

    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;

    if (!user_id || !file) {
      setError("Fehlende Datei oder Benutzer nicht eingeloggt.");
      setUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("creator-media")
      .upload(filePath, file);

    if (uploadError) {
      setError("Upload fehlgeschlagen.");
      setUploading(false);
      return;
    }

    const image_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/creator-media/${filePath}`;

    // ✅ Typsicheres Objekt für Insert
    const newUpload: TablesInsert<"creator_uploads"> = {
  title,
  description,
  format,
  destination,
  region,
  tags: tags.split(",").map((tag) => tag.trim()) as string[], // ✅ Fix
  language,
  mood,
  image_url,
  user_id,
  created_at: new Date().toISOString(),
  file_url: image_url,
};


    const { error: insertError } = await supabase
      .from("creator_uploads")
      .insert([newUpload]);

    if (insertError) {
      setError("Fehler beim Speichern in der Datenbank.");
      setUploading(false);
      return;
    }

    setUploading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4 max-w-xl mx-auto">
      <input
        type="text"
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        placeholder="Beschreibung"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="text"
        placeholder="Reiseziel (destination)"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="text"
        placeholder="Region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option>Foto</option>
        <option>Video</option>
        <option>Reel</option>
        <option>Story</option>
      </select>
      <input
        type="text"
        placeholder="Tags (Komma getrennt)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="de">Deutsch</option>
        <option value="en">Englisch</option>
      </select>
      <input
        type="text"
        placeholder="Mood (z. B. entspannt, abenteuerlich)"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full border p-2 rounded"
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {uploading ? "Hochladen..." : "Upload starten"}
      </button>
    </form>
  );
}
