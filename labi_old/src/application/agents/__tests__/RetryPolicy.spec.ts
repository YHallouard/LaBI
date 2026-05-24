import { runWithRetry, RetryPolicy } from "../RetryPolicy";

describe("runWithRetry", () => {
  const noDelayPolicy: RetryPolicy = {
    maxAttempts: 3,
    baseDelayMs: 0,
    maxDelayMs: 0,
  };

  it("returns immediately on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const onRetry = jest.fn();
    const result = await runWithRetry(fn, noDelayPolicy, onRetry);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("retries on failure and succeeds on attempt 2", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail-1"))
      .mockResolvedValueOnce("ok");
    const onRetry = jest.fn();

    const result = await runWithRetry(fn, noDelayPolicy, onRetry);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it("throws the last error after all attempts fail", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("permanent"));
    const onRetry = jest.fn();

    await expect(runWithRetry(fn, noDelayPolicy, onRetry)).rejects.toThrow(
      "permanent"
    );
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("respects shouldRetry guard and stops early", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("non-retryable"));
    const onRetry = jest.fn();
    const policy: RetryPolicy = {
      ...noDelayPolicy,
      shouldRetry: () => false,
    };

    await expect(runWithRetry(fn, policy, onRetry)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("waits with exponential backoff between attempts", async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail-1"))
      .mockRejectedValueOnce(new Error("fail-2"))
      .mockResolvedValueOnce("ok");
    const onRetry = jest.fn();
    const policy: RetryPolicy = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 8000,
    };

    const promise = runWithRetry(fn, policy, onRetry);
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });
});
