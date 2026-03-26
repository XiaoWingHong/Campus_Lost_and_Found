import { Clock, Check, X, UserCheck, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/types";

interface StatusBadgeProps {
  status: PostStatus;
}

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  published: {
    label: "Published",
    icon: Check,
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  claimed: {
    label: "Claimed",
    icon: UserCheck,
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
