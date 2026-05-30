/**
 * Utility functions for document integrity verification
 */

/**
 * Calculate SHA-256 hash of a file
 */
export async function calculateFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Download file from URL and calculate its hash
 */
export async function calculateUrlHash(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return calculateFileHash(blob);
}

/**
 * Generate timestamp authority (TSA) - simplified version
 * In production, this should call a real TSA service
 */
export function generateTimestampAuthority(): string {
  const now = new Date();
  const timestamp = now.toISOString();
  // In production, this would be a cryptographic signature from a TSA
  return `TSA-${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Verify document integrity by comparing hashes
 */
export function verifyDocumentIntegrity(
  originalHash: string,
  currentHash: string
): boolean {
  return originalHash === currentHash;
}

/**
 * Format hash for display (truncate with ellipsis)
 */
export function formatHash(hash: string, length: number = 16): string {
  if (!hash) return 'N/A';
  if (hash.length <= length) return hash;
  return `${hash.substring(0, length)}...${hash.substring(hash.length - 8)}`;
}
