import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Sparkles, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { ProductGuideStep } from "../lib/product-guide";
import { Button } from "@/components/ui/button";

type Rect = { top: number; left: number; width: number; height: number };

function readRect(selector: string): Rect | null {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) return null;
  const rect = node.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function buildCardStyle(rect: Rect | null) {
  const padding = 16;
  const cardWidth = Math.min(360, Math.max(280, window.innerWidth - padding * 2));

  if (!rect) {
    return {
      top: Math.max(24, window.innerHeight / 2 - 120),
      left: Math.max(padding, window.innerWidth / 2 - cardWidth / 2),
      width: cardWidth,
    };
  }

  const prefersRight = rect.left + rect.width + cardWidth + 32 < window.innerWidth;
  const prefersLeft = rect.left - cardWidth - 24 > padding;
  const top = Math.max(
    padding,
    Math.min(window.innerHeight - 220, rect.top + rect.height / 2 - 110),
  );

  if (prefersRight) {
    return {
      top,
      left: rect.left + rect.width + 16,
      width: cardWidth,
    };
  }

  if (prefersLeft) {
    return {
      top,
      left: rect.left - cardWidth - 16,
      width: cardWidth,
    };
  }

  return {
    top: Math.min(window.innerHeight - 220, rect.top + rect.height + 16),
    left: Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, rect.left)),
    width: cardWidth,
  };
}

export function ProductGuideOverlay({
  step,
  stepIndex,
  totalSteps,
  onBack,
  onNext,
  onClose,
}: {
  step: ProductGuideStep;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  useEffect(() => {
    function update() {
      setTargetRect(readRect(step.selector));
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const id = window.setInterval(update, 400);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(id);
    };
  }, [step.selector]);

  const cardStyle = useMemo(
    () => (typeof window === "undefined" ? { top: 24, left: 24, width: 320 } : buildCardStyle(targetRect)),
    [targetRect],
  );

  return (
    <div className="fixed inset-0 z-[220]">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />
      {targetRect && (
        <div
          className="pointer-events-none absolute rounded-xl border border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)] transition-all duration-200"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}
      <div
        className="absolute rounded-2xl border border-border bg-background/98 p-5 shadow-2xl"
        style={cardStyle}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Guided tour
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close guide</span>
              </button>
            </div>
            <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            {!targetRect && (
              <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                This target is currently off-screen. Open the sidebar or stay on the main workspace view to continue the tour smoothly.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index <= stepIndex ? "bg-foreground" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} disabled={stepIndex === 0}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
            <Button size="sm" onClick={onNext}>
              {stepIndex === totalSteps - 1 ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
