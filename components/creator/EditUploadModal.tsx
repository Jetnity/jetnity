"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/types/supabase";

type Upload = Tables<"creator_uploads">;

type Props = {
  upload: Upload;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Upload) => void; // optimistisches Update in der Liste
};

const EditUploadModal = ({ upload, isOpen, onClose, onUpdate }: Props) => {
  const [title, setTitle] = useState(upload.title || "");
  const [description, setDescription] = useState(upload.description || "");
  const [saving, setSaving] = useState(false);

  // Falls Modal mit einem anderen Upload geöffnet wird → Felder synchronisieren
  useEffect(() => {
    setTitle(upload.title || "");
    setDescription(upload.description || "");
  }, [upload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple Validation
    if (!title.trim()) {
      toast.error("Titel darf nicht leer sein.");
      return;
    }
    if (description.length > 1000) {
      toast.error("Beschreibung ist zu lang (max. 1000 Zeichen).");
      return;
    }

    setSaving(true);
    try {
      // Auth check
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Nicht authentifiziert.");
        setSaving(false);
        return;
      }

      // DB-Update (nur erlauben, wenn Owner)
      const { data, error } = await supabase
        .from("creator_uploads")
        .update({
          title: title.trim(),
          description: description.trim(),
        })
        .eq("id", upload.id)
        .eq("user_id", user.id)
        .select("*")
        .single<Upload>();

      if (error || !data) {
        toast.error("Speichern fehlgeschlagen.");
        setSaving(false);
        return;
      }

      // Optimistisches Update an Parent
      onUpdate(data);
      toast.success("Upload aktualisiert.");
      onClose();
    } catch {
      toast.error("Unerwarteter Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={() => (!saving ? onClose() : null)} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold">✏️ Upload bearbeiten</Dialog.Title>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1" htmlFor="title">
                    Titel
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    maxLength={120}
                    placeholder="Titel eingeben"
                    disabled={saving}
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">{title.length}/120</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1" htmlFor="description">
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={4}
                    maxLength={1000}
                    placeholder="Kurze Beschreibung…"
                    disabled={saving}
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">{description.length}/1000</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-md border hover:bg-neutral-50 transition disabled:opacity-60"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {saving ? "Speichern…" : "Speichern"}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditUploadModal;
