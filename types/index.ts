import { Task, Project, Tag } from '@/lib/db/schema';

// Estendi i tipi esistenti con i campi di sincronizzazione
export interface TaskWithSync extends Task {
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
  calendarEventId?: string;
}

export interface ProjectWithSync extends Project {
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export interface TagWithSync extends Tag {
  version: number;
  lastModified: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
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
