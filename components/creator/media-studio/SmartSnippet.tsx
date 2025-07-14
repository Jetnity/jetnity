"use client";

import { useState } from "react";

export default function SmartSnippet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li className="bg-gray-50 p-3 rounded-lg border text-sm flex items-center justify-between">
      <span>{text}</span>
      <button
        onClick={handleCopy}
        className="text-blue-600 text-xs ml-4 hover:underline"
      >
        {copied ? "Kopiert!" : "Einfügen"}
      </button>
    </li>
  );
}
