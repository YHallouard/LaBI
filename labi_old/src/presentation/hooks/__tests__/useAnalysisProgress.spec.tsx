import { renderHook, act } from "@testing-library/react-native";
import { AgentEventBus } from "../../../application/agents/AgentEventBus";
import { useAnalysisProgress } from "../useAnalysisProgress";

const STEP_LABELS = ["Alpha", "Beta"] as const;

describe("useAnalysisProgress", () => {
  it("marks several steps in_progress when started in parallel", () => {
    const bus = new AgentEventBus();
    const { result } = renderHook(() =>
      useAnalysisProgress(bus, [...STEP_LABELS])
    );

    act(() => {
      bus.emit({ type: "step.started", stepId: "a", label: "Alpha" });
      bus.emit({ type: "step.started", stepId: "b", label: "Beta" });
    });

    expect(result.current.stepStates.get("Alpha")).toBe("in_progress");
    expect(result.current.stepStates.get("Beta")).toBe("in_progress");
  });

  it("marks completed and failed independently", () => {
    const bus = new AgentEventBus();
    const { result } = renderHook(() =>
      useAnalysisProgress(bus, [...STEP_LABELS])
    );

    act(() => {
      bus.emit({ type: "step.started", stepId: "a", label: "Alpha" });
      bus.emit({
        type: "step.completed",
        stepId: "a",
        label: "Alpha",
        durationMs: 1,
      });
      bus.emit({ type: "step.started", stepId: "b", label: "Beta" });
      bus.emit({
        type: "step.failed",
        stepId: "b",
        label: "Beta",
        error: "x",
        finalAttempt: true,
      });
    });

    expect(result.current.stepStates.get("Alpha")).toBe("completed");
    expect(result.current.stepStates.get("Beta")).toBe("failed");
    expect(result.current.isAllCompleted).toBe(false);
    expect(result.current.hasAnyFailed).toBe(true);
  });

  it("reset restores all steps to pending", () => {
    const bus = new AgentEventBus();
    const { result } = renderHook(() =>
      useAnalysisProgress(bus, [...STEP_LABELS])
    );

    act(() => {
      bus.emit({ type: "step.started", stepId: "a", label: "Alpha" });
    });
    expect(result.current.stepStates.get("Alpha")).toBe("in_progress");

    act(() => {
      result.current.reset();
    });

    expect(result.current.stepStates.get("Alpha")).toBe("pending");
    expect(result.current.stepStates.get("Beta")).toBe("pending");
  });

  it("ignores events for labels not in ordered list", () => {
    const bus = new AgentEventBus();
    const { result } = renderHook(() =>
      useAnalysisProgress(bus, [...STEP_LABELS])
    );

    act(() => {
      bus.emit({ type: "step.started", stepId: "x", label: "Unknown" });
    });

    expect(result.current.stepStates.get("Alpha")).toBe("pending");
    expect(result.current.stepStates.get("Beta")).toBe("pending");
  });

  it("reports isAllCompleted when every step completed", () => {
    const bus = new AgentEventBus();
    const { result } = renderHook(() =>
      useAnalysisProgress(bus, [...STEP_LABELS])
    );

    act(() => {
      bus.emit({ type: "step.started", stepId: "a", label: "Alpha" });
      bus.emit({
        type: "step.completed",
        stepId: "a",
        label: "Alpha",
        durationMs: 1,
      });
      bus.emit({ type: "step.started", stepId: "b", label: "Beta" });
      bus.emit({
        type: "step.completed",
        stepId: "b",
        label: "Beta",
        durationMs: 1,
      });
    });

    expect(result.current.isAllCompleted).toBe(true);
    expect(result.current.hasAnyFailed).toBe(false);
  });
});
