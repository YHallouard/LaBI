import { AnalysisProgressAdapter } from "../AnalysisProgressAdapter";
import { ProcessingStepCallback } from "../../../ports/services/ProgressProcessor";

describe("AnalysisProgressAdapter", () => {
  let onStepStartedMock: jest.Mock<ProcessingStepCallback>;
  let onStepCompletedMock: jest.Mock<ProcessingStepCallback>;
  let adapter: AnalysisProgressAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    onStepStartedMock = jest.fn();
    onStepCompletedMock = jest.fn();
    adapter = new AnalysisProgressAdapter(
      onStepStartedMock,
      onStepCompletedMock
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("should call onStepStarted callback when step started", () => {
    const stepName = "test-step";

    adapter.onStepStarted(stepName);

    // Fast-forward time to trigger the setTimeout
    jest.advanceTimersByTime(500);

    expect(onStepStartedMock).toHaveBeenCalledWith(stepName);
    expect(onStepStartedMock).toHaveBeenCalledTimes(1);
    expect(onStepCompletedMock).not.toHaveBeenCalled();
  });

  test("should call onStepCompleted callback when step completed", () => {
    const stepName = "test-step";

    adapter.onStepCompleted(stepName);

    // Fast-forward time to trigger the setTimeout
    jest.advanceTimersByTime(500);

    expect(onStepCompletedMock).toHaveBeenCalledWith(stepName);
    expect(onStepCompletedMock).toHaveBeenCalledTimes(1);
    expect(onStepStartedMock).not.toHaveBeenCalled();
  });

  test("should handle multiple step events correctly", () => {
    const step1 = "step-1";
    const step2 = "step-2";

    adapter.onStepStarted(step1);
    adapter.onStepCompleted(step1);
    adapter.onStepStarted(step2);
    adapter.onStepCompleted(step2);

    // Fast-forward time to trigger all setTimeout calls
    jest.advanceTimersByTime(500);

    expect(onStepStartedMock).toHaveBeenCalledTimes(2);
    expect(onStepStartedMock).toHaveBeenCalledWith(step1);
    expect(onStepStartedMock).toHaveBeenCalledWith(step2);

    expect(onStepCompletedMock).toHaveBeenCalledTimes(2);
    expect(onStepCompletedMock).toHaveBeenCalledWith(step1);
    expect(onStepCompletedMock).toHaveBeenCalledWith(step2);
  });
});
