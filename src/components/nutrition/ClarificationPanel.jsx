import { Card, Button } from '@/components/ui/primitives';
import { HelpCircle } from 'lucide-react';

export default function ClarificationPanel({ clarification, onSelect, onDismiss }) {
  if (!clarification) return null;

  return (
    <Card className="p-4 border-amber-500/30 bg-amber-500/10 space-y-3">
      <div className="flex items-start gap-2">
        <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-100">{clarification.question}</p>
          <p className="text-xs text-muted mt-1">
            StilMacros won&apos;t guess — pick the closest match for &quot;{clarification.originalQuery}&quot;
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        {clarification.options?.map((opt) => (
          <Button
            key={opt.ingredientId || opt.query || opt.label}
            variant="secondary"
            size="sm"
            className="w-full justify-start text-left h-auto py-2.5"
            onClick={() => onSelect(opt)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-xs text-muted w-full text-center">
          Skip for now
        </button>
      )}
    </Card>
  );
}
