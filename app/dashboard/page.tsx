import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import TasksClient from "./tasks-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  let userTasks = [];
  try {
    userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    // Se c'è un errore con il database, continua con array vuoto
    userTasks = [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">TaskFlow V2</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.email}</span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}>
              <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <TasksClient initialTasks={userTasks} userId={session.user.id} />
        </div>
      </main>
    </div>
  );
}