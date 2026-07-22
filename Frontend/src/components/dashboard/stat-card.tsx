import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    danger: 'border-red-200 bg-red-50/50',
    warning: 'border-orange-200 bg-orange-50/50',
    success: 'border-green-200 bg-green-50/50',
  };

  return (
    <Card className={cn(variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={cn(
            'rounded-lg p-2.5',
            variant === 'danger' && 'bg-red-100 text-red-600',
            variant === 'warning' && 'bg-orange-100 text-orange-600',
            variant === 'success' && 'bg-green-100 text-green-600',
            variant === 'default' && 'bg-primary/10 text-primary',
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className={trend.positive ? 'text-green-600' : 'text-red-600'}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
