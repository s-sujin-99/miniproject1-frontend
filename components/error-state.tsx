import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({ icon, title, description, actionLabel, onAction }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      {icon}
      <p className="text-destructive text-sm font-medium">{title}</p>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
