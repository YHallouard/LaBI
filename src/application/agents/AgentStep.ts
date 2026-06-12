import { AgentEventBus } from "./AgentEventBus";
import {
  DEFAULT_LLM_RETRY,
  RetryPolicy,
  runWithRetry,
} from "./RetryPolicy";

export abstract class AgentStep<TOut> {
  constructor(
    protected readonly stepId: string,
    protected readonly label: string,
    protected readonly bus: AgentEventBus,
    protected readonly retryPolicy: RetryPolicy = DEFAULT_LLM_RETRY
  ) {}

  async run(): Promise<TOut> {
    const start = Date.now();
    this.bus.emit({
      type: "step.started",
      stepId: this.stepId,
      label: this.label,
    });
    try {
      const result = await runWithRetry(
        (attempt) => this.execute(attempt),
        this.retryPolicy,
        (attempt, err) =>
          this.bus.emit({
            type: "step.retry",
            stepId: this.stepId,
            attempt,
            maxAttempts: this.retryPolicy.maxAttempts,
            error: this.formatError(err),
          })
      );
      this.bus.emit({
        type: "step.completed",
        stepId: this.stepId,
        label: this.label,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (err) {
      this.bus.emit({
        type: "step.failed",
        stepId: this.stepId,
        label: this.label,
        error: this.formatError(err),
        finalAttempt: true,
      });
      throw err;
    }
  }

  protected abstract execute(attempt: number): Promise<TOut>;

  protected emitThinking(delta: string): void {
    this.bus.emit({
      type: "step.thinking",
      stepId: this.stepId,
      label: this.label,
      delta,
    });
  }

  protected formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
}
