"use client";

import { TaskItem } from "./TaskItem";
import { EmptyState } from "./EmptyState";
import type { Task, TaskUpdate } from "@/types";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onUpdate?: (taskId: number, updates: TaskUpdate) => Promise<void>;
  togglingTaskId?: number | null;
  deletingTaskId?: number | null;
  updatingTaskId?: number | null;
}

export function TaskList({
  tasks,
  onToggleComplete,
  onDelete,
  onUpdate,
  togglingTaskId,
  deletingTaskId,
  updatingTaskId,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  // Separate completed and pending tasks
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6" role="list" aria-label="Task list">
      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            To Do ({pendingTasks.length})
          </h3>
          <div className="space-y-2">
            {pendingTasks.map((task, index) => (
              <div
                key={task.id}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TaskItem
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  isToggling={togglingTaskId === task.id}
                  isDeleting={deletingTaskId === task.id}
                  isUpdating={updatingTaskId === task.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2 opacity-75">
            {completedTasks.map((task, index) => (
              <div
                key={task.id}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${(pendingTasks.length + index) * 0.05}s` }}
              >
                <TaskItem
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  isToggling={togglingTaskId === task.id}
                  isDeleting={deletingTaskId === task.id}
                  isUpdating={updatingTaskId === task.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
