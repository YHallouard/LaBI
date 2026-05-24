import type { LabValueDTO } from "../../domain/schemas/LabSchemas";

export type AgentEvent =
  | { type: "step.started"; stepId: string; label: string }
  | {
      type: "step.retry";
      stepId: string;
      attempt: number;
      maxAttempts: number;
      error: string;
    }
  | {
      type: "step.completed";
      stepId: string;
      label: string;
      durationMs: number;
    }
  | {
      type: "step.failed";
      stepId: string;
      label: string;
      error: string;
      finalAttempt: true;
    }
  | { type: "value.extracted"; labKey: string; value: LabValueDTO }
  | { type: "value.invalid"; labKey: string; reason: string }
  | { type: "analysis.partial"; missingCategories: string[] }
  | { type: "analysis.completed"; biomarkerCount: number };

export type AgentEventListener = (event: AgentEvent) => void;

export class AgentEventBus {
  private listeners: AgentEventListener[] = [];

  on(listener: AgentEventListener): () => void {
    this.listeners.push(listener);
    return () => this.off(listener);
  }

  off(listener: AgentEventListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  emit(event: AgentEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("AgentEventBus listener error", err);
      }
    }
  }

  clear(): void {
    this.listeners = [];
  }
}
