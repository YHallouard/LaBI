export type ProcessingStepCallback = (step: string) => void;

export interface ProgressProcessor {
  onStepStarted: (step: string) => void;
  onStepCompleted: (step: string) => void;
}
