import { apiClient } from './client';

/**
 * Free Note interfaces
 */
export interface FreeNote {
  id: string;
  cabinetId: string;
  category: 'NOTE_LIBRE';
  title: string;
  content: string;
  variables: Array<{ name: string; type: string; required: boolean }>;
  tags: string[];
  isMandatory: boolean;
  isSystemBlock: boolean;
  displayOrder: number;
  usageCount: number;
  metadata: {
    linkedCategory?: string;
    createdInFolder?: string;
    convertedFrom?: string;
    originalFolderId?: string;
  };
  folderId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  folder?: {
    id: string;
    name: string;
  };
}

export interface CreateFreeNoteInput {
  title?: string;
  content: string;
  linkedCategory?: string;
  position?: number;
}

export interface UpdateFreeNoteInput {
  title?: string;
  content?: string;
  linkedCategory?: string;
  position?: number;
}

export interface ConvertToBlockInput {
  title: string;
  category: string;
  tags?: string[];
}

/**
 * Get all free notes for the cabinet
 */
export async function getAllFreeNotes(search?: string): Promise<FreeNote[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);

  const response = await apiClient.get<{ success: boolean; data: FreeNote[] }>(
    `/free-notes?${params.toString()}`
  );
  return response.data.data;
}

/**
 * Get free notes for a specific folder
 */
export async function getFolderFreeNotes(
  folderId: string,
  filters?: { linkedCategory?: string; search?: string }
): Promise<FreeNote[]> {
  const params = new URLSearchParams();
  if (filters?.linkedCategory) params.append('linkedCategory', filters.linkedCategory);
  if (filters?.search) params.append('search', filters.search);

  const response = await apiClient.get<{ success: boolean; data: FreeNote[] }>(
    `/folders/${folderId}/free-notes?${params.toString()}`
  );
  return response.data.data;
}

/**
 * Get a single free note by ID
 */
export async function getFreeNote(noteId: string): Promise<FreeNote> {
  const response = await apiClient.get<{ success: boolean; data: FreeNote }>(
    `/free-notes/${noteId}`
  );
  return response.data.data;
}

/**
 * Create a new free note for a folder
 */
export async function createFreeNote(
  folderId: string,
  input: CreateFreeNoteInput
): Promise<FreeNote> {
  const response = await apiClient.post<{ success: boolean; data: FreeNote }>(
    `/folders/${folderId}/free-notes`,
    input
  );
  return response.data.data;
}

/**
 * Update a free note
 */
export async function updateFreeNote(
  noteId: string,
  input: UpdateFreeNoteInput
): Promise<FreeNote> {
  const response = await apiClient.put<{ success: boolean; data: FreeNote }>(
    `/free-notes/${noteId}`,
    input
  );
  return response.data.data;
}

/**
 * Delete a free note
 */
export async function deleteFreeNote(noteId: string): Promise<void> {
  await apiClient.delete(`/free-notes/${noteId}`);
}

/**
 * Convert a free note to a reusable block
 */
export async function convertToBlock(
  noteId: string,
  input: ConvertToBlockInput
): Promise<FreeNote> {
  const response = await apiClient.post<{ success: boolean; data: FreeNote }>(
    `/free-notes/${noteId}/convert-to-block`,
    input
  );
  return response.data.data;
}
