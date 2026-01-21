"use client";

import { useEffect, useState } from "react";
import { Task } from "@/lib/db/schema";

interface TasksClientProps {
  initialTasks: Task[];
  userId: string;
}

export default function TasksClient({ initialTasks, userId }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchTasks = async () => {
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
  };

  useEffect(() => {
    // Polling ogni 5 secondi per sincronizzazione tra dispositivi
    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);

    // Cleanup interval quando il componente viene smontato
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">I Miei Task</h2>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-sm text-gray-500">Aggiornamento...</span>
          )}
          <button
            onClick={fetchTasks}
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
          <p className="text-sm">Crea il tuo primo task 🚀</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {task.status && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {task.status}
                      </span>
                    )}
                    {task.priority && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                        {task.priority}
                      </span>
                    )}
                  </div>
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
    </div>
  );
}
