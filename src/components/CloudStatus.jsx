import { useEffect, useState } from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import { checkHealth, isCloudEnabled } from '@/lib/api/client';
import { Card } from '@/components/ui/primitives';

export default function CloudStatus() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (!isCloudEnabled()) return undefined;
    let cancelled = false;
    checkHealth()
      .then((result) => {
        if (!cancelled) setHealth(result);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isCloudEnabled()) {
    return (
      <Card className="p-4 flex items-center gap-3 border-yellow-500/20">
        <CloudOff className="w-5 h-5 text-yellow-400 shrink-0" />
        <p className="text-xs text-muted">Mod local — deploy pe Vercel pentru cloud complet.</p>
      </Card>
    );
  }

  const ok = health?.status === 'ok';

  return (
    <Card className="p-4 flex items-center gap-3">
      <Cloud className={`w-5 h-5 shrink-0 ${ok ? 'text-emerald-400' : 'text-muted'}`} />
      <div>
        <p className="text-sm font-semibold">{ok ? 'Cloud activ' : 'Verificare cloud…'}</p>
        <p className="text-[10px] text-muted">
          {ok
            ? `DB ${health.cloud ? '✓' : '✗'} · AI ${health.openai ? '✓' : '✗'}`
            : 'Conectare la server…'}
        </p>
      </div>
    </Card>
  );
}
