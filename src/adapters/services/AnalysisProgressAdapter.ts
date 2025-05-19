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
    setTimeout(() => {
      this.onStepStartedCallback(step);
    }, 500);
  }

  onStepCompleted(step: string): void {
    setTimeout(() => {
      this.onStepCompletedCallback(step);
    }, 500);
  }
}
