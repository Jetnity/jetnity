"use client";

import Link from "next/link";

type Props = {
  session: {
    id: string;
    title: string;
    status?: string;
    role?: string;
  };
};

export default function SessionCard({ session }: Props) {
  return (
    <Link
      href={`/creator/media-studio/session/${session.id}`}
      className="block bg-white border p-4 rounded-xl shadow hover:shadow-lg transition space-y-1"
      aria-label={`Session ${session.title} öffnen`}
    >
      <h3 className="font-semibold text-lg">{session.title}</h3>
      <p className="text-sm text-gray-500">Rolle: {session.role || "Owner"}</p>
      <p className="text-xs text-gray-400">Status: {session.status || "Aktiv"}</p>
    </Link>
  );
}
