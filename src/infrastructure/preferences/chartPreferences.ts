import Storage from 'expo-sqlite/kv-store';

const CHART_TIME_RANGE_KEY = 'chartTimeRange';

/**
 * Persisted UI preference: the time range selected on the charts screen.
 * Stored in expo-sqlite's key-value store so the user's last choice
 * (e.g. "Tout") becomes the new default across app launches.
 */
export async function loadChartTimeRange(): Promise<string | null> {
  try {
    return await Storage.getItem(CHART_TIME_RANGE_KEY);
  } catch {
    return null;
  }
}

export async function saveChartTimeRange(range: string): Promise<void> {
  try {
    await Storage.setItem(CHART_TIME_RANGE_KEY, range);
  } catch {
    // best-effort: a failed save only loses the preference
  }
}
