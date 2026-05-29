import * as FileSystem from 'expo-file-system/legacy';

const FILE_NAME = 'profile_image.jpg';

/**
 * Copies a temporary ImagePicker URI to the app's Documents directory and returns
 * the filename (not the full path). Store only this filename in the DB — the full
 * path is reconstructed at render time via resolveProfileImageUri().
 */
export async function persistProfileImage(tmpUri: string): Promise<string> {
  const dest = FileSystem.documentDirectory + FILE_NAME;
  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  } catch {
    // ignore
  }
  await FileSystem.copyAsync({ from: tmpUri, to: dest });
  return FILE_NAME;
}

/**
 * Converts the stored filename back to a full URI at render time.
 * Returns undefined for legacy absolute URIs (file:// / /var/...) that are no
 * longer valid — the caller will fall back to the initials avatar.
 */
export function resolveProfileImageUri(stored?: string): string | undefined {
  if (!stored) return undefined;
  if (stored.startsWith('file://') || stored.startsWith('/')) return undefined;
  return FileSystem.documentDirectory + stored;
}
