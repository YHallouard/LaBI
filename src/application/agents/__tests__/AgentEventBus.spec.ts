import { AgentEventBus, AgentEvent } from "../AgentEventBus";

describe("AgentEventBus", () => {
  it("emits events to all subscribed listeners", () => {
    const bus = new AgentEventBus();
    const events1: AgentEvent[] = [];
    const events2: AgentEvent[] = [];

    bus.on((e) => events1.push(e));
    bus.on((e) => events2.push(e));

    bus.emit({ type: "step.started", stepId: "s1", label: "Step 1" });

    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);
  });

  it("returns an unsubscribe function from on()", () => {
    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    const unsubscribe = bus.on((e) => events.push(e));

    bus.emit({ type: "step.started", stepId: "s1", label: "Step 1" });
    unsubscribe();
    bus.emit({ type: "step.started", stepId: "s2", label: "Step 2" });

    expect(events).toHaveLength(1);
  });

  it("isolates listener errors from other listeners", () => {
    const bus = new AgentEventBus();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const goodListener = jest.fn();

    bus.on(() => {
      throw new Error("boom");
    });
    bus.on(goodListener);

    bus.emit({ type: "step.started", stepId: "s1", label: "Step 1" });

    expect(goodListener).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("clear() removes all listeners", () => {
    const bus = new AgentEventBus();
    const listener = jest.fn();
    bus.on(listener);
    bus.clear();
    bus.emit({ type: "analysis.completed", biomarkerCount: 0 });
    expect(listener).not.toHaveBeenCalled();
  });
});
