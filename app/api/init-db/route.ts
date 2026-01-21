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
    try {
      // Per tasks
      await database`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';`;
      await database`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TEXT;`;
      await database`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;`;
      await database`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;`;
      await database`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_modified BIGINT DEFAULT 0;`;
      await database`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';`;
      await database`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;`;
      
      // Per projects
      await database`ALTER TABLE projects ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;`;
      await database`ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_modified BIGINT DEFAULT 0;`;
      await database`ALTER TABLE projects ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';`;
      
      // Per tags
      await database`ALTER TABLE tags ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;`;
      await database`ALTER TABLE tags ADD COLUMN IF NOT EXISTS last_modified BIGINT DEFAULT 0;`;
      await database`ALTER TABLE tags ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';`;
    } catch (alterError: any) {
      // Se IF NOT EXISTS non è supportato, prova senza
      console.log('Note: IF NOT EXISTS not supported, trying without...');
      try {
        await database`ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';`;
      } catch (e: any) {
        if (!e.message?.includes('already exists')) {
          console.log('Error adding priority column:', e.message);
        }
      }
      try {
        await database`ALTER TABLE tasks ADD COLUMN due_time TEXT;`;
      } catch (e: any) {
        if (!e.message?.includes('already exists')) {
          console.log('Error adding due_time column:', e.message);
        }
      }
      try {
        await database`ALTER TABLE tasks ADD COLUMN is_important BOOLEAN DEFAULT false;`;
      } catch (e: any) {
        if (!e.message?.includes('already exists')) {
          console.log('Error adding is_important column:', e.message);
        }
      }
    }

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
