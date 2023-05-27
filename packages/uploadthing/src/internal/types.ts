/** Synced up with types from infra */
export interface FileData {
  id: string;
  createdAt: string;

  fileKey: string | null;
  fileName: string;
  metadata: string | null;

  callbackUrl: string;
  callbackSlug: string;
}
