"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCopilotSuggestions } from "@/lib/intelligence/copilot-pro";

export default function CreatorDashboardWelcome() {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const result = await getCopilotSuggestions(user.id);
      setSuggestions(result);
    };

    fetchSuggestions();
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl shadow mb-6">
      <h2 className="text-2xl font-bold mb-2">Willkommen zurück, Creator ✨</h2>
      <p className="mb-4 text-gray-600">Hier sind deine intelligenten Vorschläge von CoPilot Pro:</p>
      {suggestions.length > 0 ? (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="bg-white rounded-xl p-4 shadow border">
              <p className="font-semibold">{s.title}</p>
              {s.subtitle && <p className="text-sm text-gray-500">{s.subtitle}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Noch keine Vorschläge verfügbar.</p>
      )}
    </div>
  );
}
