import { Check, Mail, Hourglass, Wallet, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FleetNoticeStatus } from "@/hooks/useFleetNotices";

const STEPS: { key: FleetNoticeStatus; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "new", label: "New", Icon: AlertCircle },
  { key: "in_progress", label: "In Progress", Icon: Hourglass },
  { key: "email_sent", label: "Email Sent", Icon: Mail },
  { key: "awaiting_payment", label: "Awaiting Payment", Icon: Wallet },
  { key: "finance_verified", label: "Finance Verified", Icon: ShieldCheck },
  { key: "closed", label: "Closed", Icon: Lock },
];

const STEP_INDEX: Record<string, number> = STEPS.reduce((acc, s, i) => {
  acc[s.key] = i;
  return acc;
}, {} as Record<string, number>);

// Map legacy/alternate statuses onto the canonical workflow position.
const LEGACY_MAP: Partial<Record<FleetNoticeStatus, FleetNoticeStatus>> = {
  needs_review: "in_progress",
  ready_to_assign: "in_progress",
  assigned: "email_sent",
  in_payment: "awaiting_payment",
  paid: "finance_verified",
};

export function FleetWorkflowStepper({ status }: { status: FleetNoticeStatus }) {
  const canonical = LEGACY_MAP[status] ?? status;
  const currentIdx = STEP_INDEX[canonical] ?? 0;

  return (
    <div className="w-full">
      <ol className="flex items-center w-full overflow-x-auto">
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.Icon;
          return (
            <li
              key={step.key}
              className={cn(
                "flex items-center flex-1 min-w-0",
                idx < STEPS.length - 1 && "after:content-[''] after:flex-1 after:h-0.5 after:mx-2",
                isComplete
                  ? "after:bg-primary"
                  : "after:bg-border",
              )}
            >
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full border-2 shrink-0 transition-colors",
                    isComplete && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "bg-primary/10 border-primary text-primary",
                    !isComplete && !isCurrent && "bg-muted border-border text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    "text-xs text-center whitespace-nowrap",
                    isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
