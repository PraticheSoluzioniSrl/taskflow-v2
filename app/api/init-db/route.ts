import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Permetti l'inizializzazione senza autenticazione per facilitare il setup iniziale
    // In produzione, considera di aggiungere un token segreto per sicurezza
    const session = await auth().catch(() => null);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
    }

    const database = neon(process.env.DATABASE_URL);

    // Crea le tabelle se non esistono
    await database`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await database`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        version INTEGER DEFAULT 1,
        last_modified BIGINT DEFAULT 0,
        sync_status TEXT DEFAULT 'synced',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await database`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        version INTEGER DEFAULT 1,
        last_modified BIGINT DEFAULT 0,
        sync_status TEXT DEFAULT 'synced',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await database`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        due_date TIMESTAMP,
        due_time TEXT,
        is_important BOOLEAN DEFAULT false,
        is_completed BOOLEAN DEFAULT false,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        google_event_id TEXT,
        google_calendar_id TEXT,
        calendar_event_id TEXT,
        "order" INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        last_modified BIGINT DEFAULT 0,
        sync_status TEXT DEFAULT 'synced',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await database`
      CREATE TABLE IF NOT EXISTS subtasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        due_date TIMESTAMP,
        due_time TEXT,
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        google_event_id TEXT,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await database`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, tag_id)
      );
    `;

    // Aggiungi colonne mancanti alle tabelle esistenti (se non esistono già)
    // PostgreSQL non supporta IF NOT EXISTS per ALTER TABLE, quindi usiamo un approccio diverso
    const addColumnIfNotExists = async (tableName: string, columnName: string, columnDef: string) => {
      try {
        // Verifica se la colonna esiste già
        const checkResult = await database`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName} 
          AND column_name = ${columnName}
        `;
        
        if (checkResult.length === 0) {
          // La colonna non esiste, aggiungila
          await database.unsafe(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
          console.log(`Added column ${columnName} to ${tableName}`);
        } else {
          console.log(`Column ${columnName} already exists in ${tableName}`);
        }
      } catch (error: any) {
        console.log(`Error adding column ${columnName} to ${tableName}:`, error.message);
      }
    };

    // Aggiungi tutte le colonne necessarie per tasks
    await addColumnIfNotExists('tasks', 'priority', "TEXT DEFAULT 'medium'");
    await addColumnIfNotExists('tasks', 'due_date', 'TIMESTAMP');
    await addColumnIfNotExists('tasks', 'due_time', 'TEXT');
    await addColumnIfNotExists('tasks', 'is_important', 'BOOLEAN DEFAULT false');
    await addColumnIfNotExists('tasks', 'is_completed', 'BOOLEAN DEFAULT false');
    await addColumnIfNotExists('tasks', 'version', 'INTEGER DEFAULT 1');
    await addColumnIfNotExists('tasks', 'last_modified', 'BIGINT DEFAULT 0');
    await addColumnIfNotExists('tasks', 'sync_status', "TEXT DEFAULT 'synced'");
    await addColumnIfNotExists('tasks', 'calendar_event_id', 'TEXT');
    
    // Aggiungi colonne per projects
    await addColumnIfNotExists('projects', 'version', 'INTEGER DEFAULT 1');
    await addColumnIfNotExists('projects', 'last_modified', 'BIGINT DEFAULT 0');
    await addColumnIfNotExists('projects', 'sync_status', "TEXT DEFAULT 'synced'");
    
    // Aggiungi colonne per tags
    await addColumnIfNotExists('tags', 'version', 'INTEGER DEFAULT 1');
    await addColumnIfNotExists('tags', 'last_modified', 'BIGINT DEFAULT 0');
    await addColumnIfNotExists('tags', 'sync_status', "TEXT DEFAULT 'synced'");

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      tables: ['users', 'projects', 'tags', 'tasks', 'subtasks', 'task_tags']
    });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error.message },
      { status: 500 }
    );
  }
}
