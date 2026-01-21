import { Task, Project, Tag } from '@/lib/db/schema';

// Estendi i tipi esistenti con i campi di sincronizzazione
// Usa Omit per rimuovere le proprietà che verranno ridefinite
export interface TaskWithSync extends Omit<Task, 'syncStatus' | 'version' | 'lastModified' | 'calendarEventId'> {
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict' | null;
  calendarEventId?: string | null;
}

export interface ProjectWithSync extends Omit<Project, 'syncStatus' | 'version' | 'lastModified'> {
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict' | null;
}

export interface TagWithSync extends Omit<Tag, 'syncStatus' | 'version' | 'lastModified'> {
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict' | null;
}

export interface PendingChange {
  type: 'task' | 'project' | 'tag';
  action: 'create' | 'update' | 'delete';
  id: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncConflict {
  itemType: 'task' | 'project' | 'tag';
  itemId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
}

// Re-export dei tipi base per compatibilità
export type { Task, Project, Tag } from '@/lib/db/schema';
