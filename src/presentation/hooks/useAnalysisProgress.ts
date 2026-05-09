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

function buildInitialStepStates(
  orderedStepLabels: readonly string[]
): Map<string, AnalysisStepStatus> {
  const next = new Map<string, AnalysisStepStatus>();
  for (const label of orderedStepLabels) {
    next.set(label, "pending");
  }
  return next;
}

export function useAnalysisProgress(
  eventBus: AgentEventBus | undefined,
  orderedStepLabels: readonly string[]
): {
  stepStates: Map<string, AnalysisStepStatus>;
  reset: () => void;
  isAllCompleted: boolean;
  hasAnyFailed: boolean;
} {
  const [stepStates, setStepStates] = useState<Map<string, AnalysisStepStatus>>(
    () => buildInitialStepStates(orderedStepLabels)
  );

  const reset = useCallback(() => {
    setStepStates(buildInitialStepStates(orderedStepLabels));
  }, [orderedStepLabels]);

  useEffect(() => {
    if (!eventBus) {
      return;
    }

    const labelSet = new Set(orderedStepLabels);

    const applyEvent = (event: AgentEvent) => {
      if (event.type === "step.started") {
        if (!labelSet.has(event.label)) {
          return;
        }
        setStepStates((prev) => {
          const next = new Map(prev);
          next.set(event.label, "in_progress");
          return next;
        });
        return;
      }
      if (event.type === "step.completed") {
        if (!labelSet.has(event.label)) {
          return;
        }
        setStepStates((prev) => {
          const next = new Map(prev);
          next.set(event.label, "completed");
          return next;
        });
        return;
      }
      if (event.type === "step.failed") {
        if (!labelSet.has(event.label)) {
          return;
        }
        setStepStates((prev) => {
          const next = new Map(prev);
          next.set(event.label, "failed");
          return next;
        });
      }
    };

    const unsubscribe = eventBus.on(applyEvent);
    return () => {
      unsubscribe();
    };
  }, [eventBus, orderedStepLabels]);

  const isAllCompleted = orderedStepLabels.every(
    (label) => stepStates.get(label) === "completed"
  );

  const hasAnyFailed = orderedStepLabels.some(
    (label) => stepStates.get(label) === "failed"
  );

  return { stepStates, reset, isAllCompleted, hasAnyFailed };
}
