"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import type { Tables } from "@/types/supabase";

type Upload = Tables<'creator_uploads'>;

type Props = {
  upload: Upload;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Upload) => void;
};

const EditUploadModal = ({ upload, isOpen, onClose, onUpdate }: Props) => {
  const [title, setTitle] = useState(upload.title || "");
  const [description, setDescription] = useState(upload.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUpload: Upload = {
      ...upload,
      title,
      description,
    };

    onUpdate(updatedUpload);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
          <Dialog.Title className="text-lg font-semibold">
            ✏️ Upload bearbeiten
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-input p-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-input p-2 text-sm"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/70 transition"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90 transition"
              >
                Speichern
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditUploadModal;

