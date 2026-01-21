import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { users, tasks, Task } from './schema';

function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

// Lazy initialization per evitare errori durante il build
export const db = new Proxy({} as ReturnType<typeof getDatabase>, {
  get(target, prop) {
    const dbInstance = getDatabase();
    return (dbInstance as any)[prop];
  }
});

export async function createOrUpdateUser(
  userId: string,
  email: string,
  name?: string,
  image?: string
) {
  try {
    const dbInstance = getDatabase();
    const existing = await dbInstance
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length === 0) {
      await dbInstance.insert(users).values({
        id: userId,
        email,
        name: name || null,
        image: image || null,
      });
    } else {
      await dbInstance
        .update(users)
        .set({
          name: name || existing[0].name,
          image: image || existing[0].image,
        })
        .where(eq(users.id, userId));
    }
  } catch (error) {
    console.error("Error in createOrUpdateUser:", error);
    // Non bloccare il login se c'è un errore con il database
    // L'utente può comunque accedere
  }
}

export async function getTasksByUserId(userId: string): Promise<Task[]> {
  try {
    const dbInstance = getDatabase();
    const userTasks = await dbInstance
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));
    return userTasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function createTask(taskData: {
  userId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: Date | string;
  projectId?: string;
  important?: boolean;
  completed?: boolean;
  tags?: any[];
  subtasks?: any[];
}): Promise<Task> {
  try {
    const dbInstance = getDatabase();
    
    // Prepara i valori per l'inserimento
    const now = Date.now();
    const insertValues: any = {
      userId: taskData.userId,
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      projectId: taskData.projectId || null,
      isImportant: taskData.important || false,
      isCompleted: taskData.completed || false,
      version: 1,
      lastModified: now,
      syncStatus: 'synced',
    };

    // Gestisci la data di scadenza
    if (taskData.dueDate) {
      try {
        const dateValue = typeof taskData.dueDate === 'string' 
          ? new Date(taskData.dueDate) 
          : taskData.dueDate;
        if (!isNaN(dateValue.getTime())) {
          insertValues.dueDate = dateValue;
        }
      } catch (e) {
        console.error("Error parsing dueDate:", e);
      }
    }

    const result = await dbInstance
      .insert(tasks)
      .values(insertValues)
      .returning();
    
    if (!result || result.length === 0) {
      throw new Error("Failed to create task: no result returned");
    }
    
    return result[0];
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function updateTask(
  taskId: string,
  updateData: Partial<Task>,
  userId: string
): Promise<void> {
  try {
    const dbInstance = getDatabase();
    const updateValues: any = {};

    if (updateData.title !== undefined) updateValues.title = updateData.title;
    if (updateData.description !== undefined) updateValues.description = updateData.description;
    if (updateData.status !== undefined) updateValues.status = updateData.status;
    if (updateData.priority !== undefined) updateValues.priority = updateData.priority;
    if (updateData.dueDate !== undefined) updateValues.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    if (updateData.isImportant !== undefined) updateValues.isImportant = updateData.isImportant;
    if (updateData.isCompleted !== undefined) updateValues.isCompleted = updateData.isCompleted;
    if (updateData.projectId !== undefined) updateValues.projectId = updateData.projectId;
    if (updateData.calendarEventId !== undefined) updateValues.calendarEventId = updateData.calendarEventId;

    // Aggiorna version e lastModified per sincronizzazione
    const currentTask = await dbInstance.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (currentTask.length > 0) {
      updateValues.version = (currentTask[0].version || 1) + 1;
    }
    updateValues.lastModified = Date.now();
    updateValues.updatedAt = new Date();

    await dbInstance
      .update(tasks)
      .set(updateValues)
      .where(eq(tasks.id, taskId));
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  try {
    const dbInstance = getDatabase();
    await dbInstance
      .delete(tasks)
      .where(eq(tasks.id, taskId));
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}
