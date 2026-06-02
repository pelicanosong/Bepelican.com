import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { FORM_STEPS } from "./types";

interface StepProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function StepProgress({ currentStep, completedSteps, onStepClick }: StepProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop horizontal */}
      <div className="hidden md:flex items-center justify-between mb-8">
        {FORM_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                currentStep === step.id && "bg-primary/10 text-primary ring-1 ring-primary/30",
                completedSteps.includes(step.id) && currentStep !== step.id && "text-primary",
                !completedSteps.includes(step.id) && currentStep !== step.id && "text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                currentStep === step.id && "bg-primary text-primary-foreground",
                completedSteps.includes(step.id) && currentStep !== step.id && "bg-primary/20 text-primary",
                !completedSteps.includes(step.id) && currentStep !== step.id && "bg-muted text-muted-foreground"
              )}>
                {completedSteps.includes(step.id) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : step.id}
              </div>
              <span className="hidden lg:inline">{step.title}</span>
            </button>
            {index < FORM_STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-px mx-2",
                completedSteps.includes(step.id) ? "bg-primary/40" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: compact */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Paso {currentStep} de {FORM_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {FORM_STEPS[currentStep - 1]?.title}
          </span>
        </div>
        <div className="flex gap-1">
          {FORM_STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                currentStep === step.id && "bg-primary",
                completedSteps.includes(step.id) && currentStep !== step.id && "bg-primary/40",
                !completedSteps.includes(step.id) && currentStep !== step.id && "bg-border"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
