import { auth } from "@/lib/auth";
import { getTasksByUserId, createTask } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTasks = await getTasksByUserId(session.user.id);

    return NextResponse.json(userTasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
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

    const body = await request.json();
    const { title, description, status, priority, dueDate, projectId, important, tags, subtasks } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newTask = await createTask({
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || undefined,
      status: status || "todo",
      priority: priority || "medium",
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
      important: important || false,
      completed: false,
      tags: tags || [],
      subtasks: subtasks || [],
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    
    // Fornisci dettagli più specifici sull'errore
    const errorMessage = error?.message || String(error);
    const isDatabaseError = errorMessage.includes('column') || errorMessage.includes('does not exist');
    
    if (isDatabaseError) {
      return NextResponse.json(
        { 
          error: "Database schema needs to be updated. Please call /api/init-db first",
          details: errorMessage 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
