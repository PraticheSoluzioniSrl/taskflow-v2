import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const userTasks = await db.select().from(tasks).where(eq(tasks.userId, session.user.id!));

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
          <h2 className="text-xl font-semibold mb-6">I Miei Task</h2>
          {userTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Nessun task ancora!</p>
              <p className="text-sm">Crea il tuo primo task 🚀</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}