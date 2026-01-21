import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
    }

    const database = neon(process.env.DATABASE_URL);

    // Verifica quali tabelle esistono
    const tablesResult = await database`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    // Verifica le colonne della tabella tasks
    let tasksColumns: any[] = [];
    try {
      const columnsResult = await database`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
        ORDER BY ordinal_position;
      `;
      tasksColumns = columnsResult;
    } catch (e) {
      console.error('Error checking tasks columns:', e);
    }

    // Conta i task esistenti
    let taskCount = 0;
    try {
      const countResult = await database`SELECT COUNT(*) as count FROM tasks;`;
      taskCount = Number(countResult[0]?.count || 0);
    } catch (e) {
      console.error('Error counting tasks:', e);
    }

    return NextResponse.json({
      status: 'ok',
      tables: tablesResult.map((t: any) => t.table_name),
      tasksColumns: tasksColumns.map((c: any) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES'
      })),
      taskCount,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    });
  } catch (error: any) {
    console.error('Error checking database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check database', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
