import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const userTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, session.user.id!));

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">I Miei Task</h2>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              + Nuovo Task
            </button>
          </div>

          {userTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Nessun task ancora!</p>
              <p className="text-sm">Crea il tuo primo task per iniziare 🚀</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className={px-2 py-1 rounded }>
                          {task.status === 'done' ? 'Completato' :
                           task.status === 'in_progress' ? 'In corso' : 'Da fare'}
                        </span>
                        {task.dueDate && (
                          <span>📅 {new Date(task.dueDate).toLocaleDateString('it-IT')}</span>
                        )}
                      </div>
                    </div>
                    {task.isImportant && <span className="text-yellow-500">⭐</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>✅ Sincronizzazione attiva - Salvato nel database</p>
          <p className="mt-1">📱 Accessibile da qualsiasi dispositivo</p>
        </div>
      </main>
    </div>
  );
}
