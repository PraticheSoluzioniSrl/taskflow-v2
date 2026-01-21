'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Task, Project, Tag } from '@/lib/db/schema';
import { PendingChange, SyncConflict } from '@/types';

export function useDatabaseSync() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const syncInProgress = useRef(false);
  const lastSyncTimestamp = useRef<number>(0);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !hasLoadedOnce) {
      loadFromDatabase(true);
    }
  }, [status, session?.user?.email]);

  const mergeItems = <T extends Task | Project | Tag>(
    localItems: T[],
    remoteItems: T[],
    itemType: 'task' | 'project' | 'tag'
  ): { merged: T[]; conflicts: SyncConflict[] } => {
    const mergedMap = new Map<string, T>();
    const detectedConflicts: SyncConflict[] = [];

    localItems.forEach(item => {
      mergedMap.set(item.id, item);
    });

    remoteItems.forEach(remoteItem => {
      const localItem = mergedMap.get(remoteItem.id);

      if (!localItem) {
        mergedMap.set(remoteItem.id, remoteItem);
      } else {
        const localVersion = (localItem as any).version || 0;
        const remoteVersion = (remoteItem as any).version || 0;
        const localModified = (localItem as any).lastModified || 0;
        const remoteModified = (remoteItem as any).lastModified || 0;

        if (localVersion > remoteVersion) {
          // Mantieni locale
        } else if (localVersion < remoteVersion) {
          mergedMap.set(remoteItem.id, remoteItem);
        } else {
          if (localModified > remoteModified) {
            // Mantieni locale
          } else if (localModified < remoteModified) {
            mergedMap.set(remoteItem.id, remoteItem);
          } else {
            detectedConflicts.push({
              itemType,
              itemId: remoteItem.id,
              localVersion: localItem,
              remoteVersion: remoteItem,
              timestamp: Date.now(),
            });
            mergedMap.set(remoteItem.id, remoteItem);
          }
        }
      }
    });

    return {
      merged: Array.from(mergedMap.values()),
      conflicts: detectedConflicts,
    };
  };

  const loadFromDatabase = async (isInitialLoad = false) => {
    if (!session?.user?.email || syncInProgress.current) return;
    
    syncInProgress.current = true;

    if (isInitialLoad) {
      setIsLoading(true);
      setIsSyncing(true);
    }
    setError(null);

    try {
      if (pendingChanges.length > 0 && !isInitialLoad) {
        await syncPendingChanges();
      }

      const fetchWithTimeout = (url: string, timeout: number) => {
        return Promise.race([
          fetch(url),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ]);
      };

      const timeout = isInitialLoad ? 15000 : 30000;
      const [tasksRes, projectsRes, tagsRes] = await Promise.all([
        fetchWithTimeout('/api/tasks', timeout),
        fetchWithTimeout('/api/projects', timeout).catch(() => ({ ok: true, json: async () => [] })),
        fetchWithTimeout('/api/tags', timeout).catch(() => ({ ok: true, json: async () => [] })),
      ]);

      if (!tasksRes.ok) {
        throw new Error('Failed to load tasks from database');
      }

      const [tasksData, projectsData, tagsData] = await Promise.all([
        tasksRes.json(),
        projectsRes.ok ? projectsRes.json() : [],
        tagsRes.ok ? tagsRes.json() : [],
      ]);

      const tasksMerge = mergeItems(tasks, tasksData || [], 'task');
      const projectsMerge = mergeItems(projects, projectsData || [], 'project');
      const tagsMerge = mergeItems(tags, tagsData || [], 'tag');

      setTasks(tasksMerge.merged);
      setProjects(projectsMerge.merged);
      setTags(tagsMerge.merged);

      const allConflicts = [
        ...tasksMerge.conflicts,
        ...projectsMerge.conflicts,
        ...tagsMerge.conflicts,
      ];
      
      if (allConflicts.length > 0) {
        setConflicts(prev => [...prev, ...allConflicts]);
      }

      setHasLoadedOnce(true);
      lastSyncTimestamp.current = Date.now();
    } catch (err) {
      console.error('Error loading from database:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      if (isInitialLoad) {
        setHasLoadedOnce(true);
      }
    } finally {
      syncInProgress.current = false;
      if (isInitialLoad) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  };

  const syncPendingChanges = async () => {
    if (pendingChanges.length === 0) return;

    const changesToSync = [...pendingChanges];
    const successfulChanges: string[] = [];

    for (const change of changesToSync) {
      try {
        let endpoint = '';
        let method = '';
        let body: any = null;

        switch (change.type) {
          case 'task':
            endpoint = change.action === 'delete' 
              ? `/api/tasks/${change.id}` 
              : change.action === 'create'
              ? '/api/tasks'
              : `/api/tasks/${change.id}`;
            method = change.action === 'delete' ? 'DELETE' : change.action === 'create' ? 'POST' : 'PATCH';
            body = change.action !== 'delete' ? change.data : null;
            break;
          case 'project':
            endpoint = change.action === 'delete'
              ? `/api/projects/${change.id}`
              : change.action === 'create'
              ? '/api/projects'
              : `/api/projects/${change.id}`;
            method = change.action === 'delete' ? 'DELETE' : change.action === 'create' ? 'POST' : 'PATCH';
            body = change.action !== 'delete' ? change.data : null;
            break;
          case 'tag':
            endpoint = change.action === 'delete'
              ? `/api/tags/${change.id}`
              : change.action === 'create'
              ? '/api/tags'
              : `/api/tags/${change.id}`;
            method = change.action === 'delete' ? 'DELETE' : change.action === 'create' ? 'POST' : 'PATCH';
            body = change.action !== 'delete' ? change.data : null;
            break;
        }

        const response = await fetch(endpoint, {
          method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
          successfulChanges.push(change.id + change.timestamp);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        const updatedChange = { ...change, retryCount: change.retryCount + 1 };
        
        if (updatedChange.retryCount < 3) {
          setPendingChanges(prev => 
            prev.map(c => 
              c.id === change.id && c.timestamp === change.timestamp 
                ? updatedChange 
                : c
            )
          );
        }
      }
    }

    if (successfulChanges.length > 0) {
      setPendingChanges(prev =>
        prev.filter(c => !successfulChanges.includes(c.id + c.timestamp))
      );
    }
  };

  const addPendingChange = useCallback((change: Omit<PendingChange, 'timestamp' | 'retryCount'>) => {
    setPendingChanges(prev => [
      ...prev,
      {
        ...change,
        timestamp: Date.now(),
        retryCount: 0,
      },
    ]);
  }, []);

  const addTask = useCallback(async (taskData: Partial<Task>) => {
    const now = Date.now();
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...taskData,
        version: 1,
        lastModified: now,
        syncStatus: 'pending',
      }),
    });

    if (response.ok) {
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      return newTask;
    }
    throw new Error('Failed to create task');
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        lastModified: Date.now(),
        syncStatus: 'pending',
      }),
    });

    if (response.ok) {
      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    }
    throw new Error('Failed to update task');
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else {
      throw new Error('Failed to delete task');
    }
  }, []);

  const resolveConflict = useCallback((
    conflictId: string,
    resolution: 'local' | 'remote'
  ) => {
    setConflicts(prev => {
      const conflict = prev.find(c => c.itemId === conflictId);
      if (!conflict) return prev;

      const chosenVersion = resolution === 'local' 
        ? conflict.localVersion 
        : conflict.remoteVersion;

      if (conflict.itemType === 'task') {
        updateTask(conflictId, chosenVersion as Partial<Task>);
      }

      return prev.filter(c => c.itemId !== conflictId);
    });
  }, [updateTask]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && hasLoadedOnce) {
      const interval = setInterval(() => {
        if (pendingChanges.length === 0) {
          loadFromDatabase(false);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [status, session?.user?.email, hasLoadedOnce, pendingChanges.length]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && pendingChanges.length > 0) {
      const timeout = setTimeout(() => {
        syncPendingChanges();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [status, session?.user?.email, pendingChanges.length]);

  return {
    tasks,
    projects,
    tags,
    isLoading,
    isSyncing,
    error,
    conflicts,
    pendingChanges: pendingChanges.length,
    loadFromDatabase,
    resolveConflict,
    addTask,
    updateTask,
    deleteTask,
  };
}
