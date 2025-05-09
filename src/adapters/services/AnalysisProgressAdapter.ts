import {
  ProgressProcessor,
  ProcessingStepCallback,
} from "../../ports/services/ProgressProcessor";

export class AnalysisProgressAdapter implements ProgressProcessor {
  constructor(
    private readonly onStepStartedCallback: ProcessingStepCallback,
    private readonly onStepCompletedCallback: ProcessingStepCallback
  ) {}

  onStepStarted(step: string): void {
    this.onStepStartedCallback(step);
  }

  onStepCompleted(step: string): void {
    this.onStepCompletedCallback(step);
  }
}
