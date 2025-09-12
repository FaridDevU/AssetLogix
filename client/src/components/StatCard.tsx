import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline";
  };
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  badge,
  icon,
  footer,
  children
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium text-secondary-900">{title}</CardTitle>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-semibold">{value}</span>
          {change && (
            <span 
              className={`ml-2 text-sm flex items-center ${
                change.type === "increase" ? "text-success-500" : "text-error-500"
              }`}
            >
              <i className={`${
                change.type === "increase" ? "ri-arrow-up-line" : "ri-arrow-down-line"
              } mr-1`}></i>
              {change.value}%
            </span>
          )}
        </div>
        
        {children}
        
        {footer && (
          <div className="mt-4">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
