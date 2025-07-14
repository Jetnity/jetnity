"use client";

import { useState } from "react";

type Props = {
  content: string;
  type?: string;
  createdAt: string;
};

const SmartSnippetItem = ({ content, type = "text", createdAt }: Props) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border p-4 bg-white shadow-sm space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md uppercase tracking-wide">
          {type}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleDateString("de-DE")}
        </span>
      </div>

      <p className="text-sm text-foreground whitespace-pre-wrap">
        {expanded || content.length < 140
          ? content
          : content.slice(0, 140) + " …"}
      </p>

      {content.length > 140 && (
        <button
          className="text-xs text-primary hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
        </button>
      )}
    </div>
  );
};

export default SmartSnippetItem;
