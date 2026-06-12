import { useCallback, useEffect, useState } from "react";
import {
  AgentEventBus,
  AgentEvent,
} from "../../application/agents/AgentEventBus";

export type AnalysisStepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";

/** Étape affichée à l'écran : id = stepId émis sur l'EventBus, label = texte UI. */
export type AnalysisStep = { id: string; label: string };

function buildInitialStepStates(
  steps: readonly AnalysisStep[]
): Map<string, AnalysisStepStatus> {
  const next = new Map<string, AnalysisStepStatus>();
  for (const step of steps) {
    next.set(step.id, "pending");
  }
  return next;
}

export function useAnalysisProgress(
  eventBus: AgentEventBus | undefined,
  steps: readonly AnalysisStep[]
): {
  stepStates: Map<string, AnalysisStepStatus>;
  thinkingByStep: Map<string, string>;
  reset: () => void;
  isAllCompleted: boolean;
  hasAnyFailed: boolean;
} {
  const [stepStates, setStepStates] = useState<Map<string, AnalysisStepStatus>>(
    () => buildInitialStepStates(steps)
  );
  const [thinkingByStep, setThinkingByStep] = useState<Map<string, string>>(
    () => new Map()
  );

  const reset = useCallback(() => {
    setStepStates(buildInitialStepStates(steps));
    setThinkingByStep(new Map());
  }, [steps]);

  useEffect(() => {
    if (!eventBus) {
      return;
    }

    const idSet = new Set(steps.map((s) => s.id));

    const setStatus = (stepId: string, status: AnalysisStepStatus) => {
      if (!idSet.has(stepId)) return;
      setStepStates((prev) => {
        const next = new Map(prev);
        next.set(stepId, status);
        return next;
      });
    };

    const applyEvent = (event: AgentEvent) => {
      switch (event.type) {
        case "step.started":
          setStatus(event.stepId, "in_progress");
          break;
        case "step.completed":
          setStatus(event.stepId, "completed");
          break;
        case "step.failed":
          setStatus(event.stepId, "failed");
          break;
        case "step.thinking":
          if (!idSet.has(event.stepId)) return;
          setThinkingByStep((prev) => {
            const next = new Map(prev);
            next.set(event.stepId, (prev.get(event.stepId) ?? "") + event.delta);
            return next;
          });
          break;
      }
    };

    const unsubscribe = eventBus.on(applyEvent);
    return () => {
      unsubscribe();
    };
  }, [eventBus, steps]);

  const isAllCompleted = steps.every(
    (step) => stepStates.get(step.id) === "completed"
  );

  const hasAnyFailed = steps.some(
    (step) => stepStates.get(step.id) === "failed"
  );

  return { stepStates, thinkingByStep, reset, isAllCompleted, hasAnyFailed };
}
