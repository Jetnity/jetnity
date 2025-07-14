"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

type Upload = {
  id: string;
  title: string;
  image_url: string;
  region: string;
  mood: string;
};

export default function DynamicInspirationGrid() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("creator_uploads")
        .select("id, title, image_url, region, mood")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        setUploads(
          data.map((item) => ({
            id: item.id,
            title: item.title,
            image_url: item.image_url ?? "",
            region: item.region,
            mood: item.mood ?? "",
          }))
        );
      }
      
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p className="text-center py-10">Inhalte werden geladen…</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {uploads.map((upload) => (
        <div key={upload.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition">
          <Image
            src={upload.image_url}
            alt={upload.title}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold">{upload.title}</h3>
            <p className="text-sm text-gray-500">{upload.region} – {upload.mood}</p>
            <Link href={`/creator-dashboard?id=${upload.id}`} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Zum Inhalt
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
