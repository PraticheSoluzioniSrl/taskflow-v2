"use client";

import { useEffect, useState, useCallback } from "react";
import { Task } from "@/lib/db/schema";

interface TasksClientProps {
  initialTasks: Task[];
  userId: string;
}

export default function TasksClient({ initialTasks, userId }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    dueTime: "",
    important: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setFormError(null);
    setIsSubmitting(true);
    try {
      const dueDateValue = formData.dueDate 
        ? new Date(`${formData.dueDate}T${formData.dueTime || "00:00"}`).toISOString()
        : undefined;

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          dueDate: dueDateValue,
          important: formData.important,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Errore sconosciuto" }));
        const errorMessage = errorData.details || errorData.error || "Impossibile creare il task";
        
        // Se l'errore indica che il database non è inizializzato, mostra un messaggio più chiaro
        if (errorMessage.includes('init-db') || errorMessage.includes('schema')) {
          alert(`⚠️ Database non inizializzato!\n\nApri questo link per inizializzare il database:\nhttps://taskflow-v2-nu.vercel.app/api/init-db\n\nPoi ricarica la pagina e riprova.`);
        } else {
          alert(`Errore: ${errorMessage}`);
        }
        setIsSubmitting(false); // Assicurati di resettare isSubmitting anche in caso di errore
        return;
      }

      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      setShowModal(false);
      setFormData({ 
        title: "", 
        description: "", 
        status: "todo", 
        priority: "medium",
        dueDate: "",
        dueTime: "",
        important: false,
      });
      await fetchTasks();
    } catch (error: any) {
      console.error("Error creating task:", error);
      setFormError(error?.message || "Errore durante la creazione del task. Riprova.");
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo task?")) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        await fetchTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Errore durante l'eliminazione del task.");
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCompleted: !task.isCompleted,
          status: !task.isCompleted ? "done" : "todo",
        }),
      });

      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, isCompleted: !t.isCompleted, status: !t.isCompleted ? "done" : "todo" }
              : t
          )
        );
        await fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  useEffect(() => {
    // Polling ogni 5 secondi per sincronizzazione tra dispositivi
    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Rimuoviamo fetchTasks dalle dipendenze per evitare loop infiniti

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">I Miei Task</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingTask(null);
              setFormData({ 
                title: "", 
                description: "", 
                status: "todo", 
                priority: "medium",
                dueDate: "",
                dueTime: "",
                important: false,
              });
              setShowModal(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Nuovo Task
          </button>
          {isLoading && (
            <span className="text-sm text-gray-500">Aggiornamento...</span>
          )}
          <button
            onClick={() => fetchTasks()}
            className="text-sm text-blue-500 hover:text-blue-700"
            disabled={isLoading}
          >
            Aggiorna
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Nessun task ancora!</p>
          <p className="text-sm mb-4">Crea il tuo primo task 🚀</p>
          <button
            onClick={() => {
              setFormData({ 
                title: "", 
                description: "", 
                status: "todo", 
                priority: "medium",
                dueDate: "",
                dueTime: "",
                important: false,
              });
              setShowModal(true);
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Crea Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                task.isCompleted ? "opacity-60 bg-gray-50" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.isCompleted || false}
                      onChange={() => handleToggleComplete(task)}
                      className="mt-1 w-5 h-5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          task.isCompleted ? "line-through text-gray-500" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          📅 Scadenza: {formatDate(task.dueDate)}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {task.status && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {task.status}
                          </span>
                        )}
                        {task.priority && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                        {task.isImportant && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            ⭐ Importante
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Elimina"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdate && (
        <p className="text-xs text-gray-400 mt-4 text-center">
          Ultimo aggiornamento: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {/* Modal per creare/modificare task */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingTask ? "Modifica Task" : "Nuovo Task"}
            </h3>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stato
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={isSubmitting}
                  >
                    <option value="todo">Da Fare</option>
                    <option value="in-progress">In Corso</option>
                    <option value="done">Completato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Priorità
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={isSubmitting}
                  >
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data Scadenza
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ora Scadenza
                  </label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dueTime: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.important}
                    onChange={(e) =>
                      setFormData({ ...formData, important: e.target.checked })
                    }
                    className="w-4 h-4"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm font-medium">Task Importante</span>
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvataggio..." : editingTask ? "Salva" : "Crea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
