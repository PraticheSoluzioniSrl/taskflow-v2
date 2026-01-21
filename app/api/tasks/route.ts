import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }

    const database = neon(process.env.DATABASE_URL);
    const tasks = await database`
      SELECT * FROM tasks 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, dueTime, important } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const database = neon(process.env.DATABASE_URL);
    
    // Verifica che l'utente esista nel database, altrimenti crealo
    const userCheck = await database`
      SELECT id FROM users WHERE id = ${session.user.id} OR email = ${session.user.email || ''}
    `;
    
    if (userCheck.length === 0) {
      // Se l'utente non esiste, crealo usando l'ID dalla sessione
      try {
        await database`
          INSERT INTO users (id, email, name, image)
          VALUES (${session.user.id}, ${session.user.email || ''}, ${session.user.name || null}, ${session.user.image || null})
        `;
        console.log('User created:', session.user.id);
      } catch (userError: any) {
        console.error('Error creating user:', userError);
        // Se fallisce con l'ID, prova con l'email come ID
        if (session.user.email) {
          try {
            await database`
              INSERT INTO users (id, email, name, image)
              VALUES (${session.user.email}, ${session.user.email}, ${session.user.name || null}, ${session.user.image || null})
            `;
            console.log('User created with email as ID:', session.user.email);
            // Aggiorna session.user.id per usare l'email come ID
            (session.user as any).id = session.user.email;
          } catch (emailError: any) {
            console.error('Error creating user with email:', emailError);
            return NextResponse.json(
              { 
                error: "User not found and could not be created", 
                details: emailError.message 
              },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { 
              error: "User not found and no email available", 
              details: userError.message 
            },
            { status: 500 }
          );
        }
      }
    } else {
      // Usa l'ID trovato nel database
      const userId = userCheck[0].id;
      if (userId !== session.user.id) {
        console.log('Using database user ID:', userId, 'instead of session ID:', session.user.id);
        (session.user as any).id = userId;
      }
    }
    
    // Inserisci direttamente con SQL - generiamo l'ID esplicitamente con gen_random_uuid()
    const result = await database`
      INSERT INTO tasks (
        id,
        title, 
        description, 
        status, 
        priority, 
        due_date, 
        due_time, 
        is_important, 
        user_id,
        is_completed,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${title.trim()},
        ${description?.trim() || null},
        ${status || 'todo'},
        ${priority || 'medium'},
        ${dueDate ? new Date(dueDate) : null},
        ${dueTime || null},
        ${important || false},
        ${session.user.id},
        false,
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      );
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
