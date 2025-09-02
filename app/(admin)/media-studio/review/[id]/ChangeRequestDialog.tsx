'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, MessageSquareWarning } from 'lucide-react';

type Props = {
  sessionId: string;
  onSubmitAction: (fd: FormData) => Promise<void>;
};

export default function ChangeRequestDialog({ sessionId, onSubmitAction }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // WICHTIG: action erwartet (formData: FormData) => void
  const action = (formData: FormData) => {
    formData.set('session_id', sessionId);
    setError(null);
    startTransition(async () => {
      try {
        await onSubmitAction(formData);
        setOpen(false);
      } catch (e) {
        setError((e as Error).message || 'Fehler beim Senden');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="warning" size="sm" leftIcon={<MessageSquareWarning className="h-4 w-4" /> as any}>
          Change Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Request erstellen</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="severity">Priorität</Label>
              <select id="severity" name="severity" className="h-10 w-full rounded-md border px-3">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="blocker">Blocker</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Fällig bis (optional)</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Kurzbegründung (optional)</Label>
            <Input id="reason" name="reason" placeholder="z. B. Titel & Thumbnail inkonsistent" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="details">Details</Label>
            <Textarea id="details" name="details" placeholder="Konkrete Punkte, gewünschte Änderungen, Beispiele…" rows={6} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Senden…</> : 'Senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
