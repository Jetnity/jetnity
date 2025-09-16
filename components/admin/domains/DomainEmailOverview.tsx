// components/admin/domains/DomainEmailOverview.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Summary = {
  domain: string;
  apexA: { ok: boolean; wanted?: string | null };
  wwwCname: { ok: boolean; wanted?: string | null };
  mx: { ok: boolean; wantedHost?: string; wantedPrio?: number };
  spf: { ok: boolean; wantedInclude?: string };
  dkim: { ok: boolean; info: string };
  dmarc: { ok: boolean; wantedPolicy?: string; rua?: string };
};

export default function DomainEmailOverview() {
  const [domain, setDomain] = React.useState('jetnity.ch');
  const [loading, setLoading] = React.useState(false);
  const [fixing, setFixing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const toast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  };

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/infomaniak/dns?domain=${encodeURIComponent(domain)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Fehler beim Abruf');
      setSummary(json.summary);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function autoFix(opts?: { apex?: boolean; www?: boolean }) {
    setFixing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/infomaniak/dns/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          apply: {
            spf: true,
            dmarc: true,
            mx: true,
            apexA: !!opts?.apex,
            wwwCname: !!opts?.www,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Auto-Fix fehlgeschlagen');
      toast('Auto-Fix ausgeführt');
      setSummary(json.after?.summary || json.after);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setFixing(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  const StatusRow = ({ label, ok, hint }: { label: string; ok: boolean; hint?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0 border-border">
      <div className="flex items-center gap-3">
        <Badge className={cn('rounded-full', ok ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white')}>
          {ok ? 'OK' : 'fehlt/ungenau'}
        </Badge>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium mb-1">Domain</label>
            <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="deinedomain.tld" />
          </div>
          <Button onClick={load} disabled={loading}>
            {loading ? 'Prüfe…' : 'Prüfen'}
          </Button>
          <Button onClick={() => autoFix()} disabled={fixing} variant="secondary">
            {fixing ? 'Fixe…' : 'Auto-Fix (SPF/DMARC/MX)'}
          </Button>
          <Button onClick={() => autoFix({ apex: true, www: true })} disabled={fixing} variant="outline">
            {fixing ? 'Fixe…' : 'Optional: Apex/CNAME'}
          </Button>
        </div>
        {message && <div className="mt-3 text-sm text-emerald-600">{message}</div>}
        {error && <div className="mt-3 text-sm text-red-600">Fehler: {error}</div>}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        {!summary ? (
          <div className="text-sm text-muted-foreground">Noch kein Ergebnis.</div>
        ) : (
          <div>
            <StatusRow
              label="Apex A (@)"
              ok={summary.apexA.ok}
              hint={summary.apexA.wanted ? <>Soll: <code>{summary.apexA.wanted}</code></> : 'kein Ziel konfiguriert'}
            />
            <StatusRow
              label="WWW → CNAME"
              ok={summary.wwwCname.ok}
              hint={summary.wwwCname.wanted ? <>Soll: <code>{summary.wwwCname.wanted}</code></> : 'kein Ziel konfiguriert'}
            />
            <StatusRow
              label="MX (E-Mail Empfang)"
              ok={summary.mx.ok}
              hint={<>Soll: <code>{summary.mx.wantedHost}</code> (prio {summary.mx.wantedPrio})</>}
            />
            <StatusRow
              label="SPF (TXT @)"
              ok={summary.spf.ok}
              hint={<>Erwartet Include: <code>{summary.spf.wantedInclude}</code></>}
            />
            <StatusRow
              label="DKIM (TXT selector._domainkey)"
              ok={summary.dkim.ok}
              hint={summary.dkim.info}
            />
            <StatusRow
              label="DMARC (TXT _dmarc)"
              ok={summary.dmarc.ok}
              hint={<>Policy: <code>{summary.dmarc.wantedPolicy}</code>, RUA: <code>{summary.dmarc.rua}</code></>}
            />
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">DKIM – Wizard</h3>
        <ol className="list-decimal pl-4 space-y-1 text-sm text-muted-foreground">
          <li>Im Infomaniak Manager den DKIM-Schlüssel erzeugen/anzeigen (Selector + Public Key).</li>
          <li>TXT anlegen: <code>selector._domainkey</code> → <code>v=DKIM1; k=rsa; p=…</code>.</li>
          <li>Oben erneut „Prüfen“ – vorhanden wenn ein <code>TXT</code> mit <code>v=DKIM1</code> gefunden wird.</li>
        </ol>
      </Card>
    </div>
  );
}
