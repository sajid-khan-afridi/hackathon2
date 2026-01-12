"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import { tasksApi, ApiClientError } from "@/lib/api";
import type { Task, TaskUpdate } from "@/types";

interface TasksContainerProps {
  userId: string;
}

export function TasksContainer({ userId }: TasksContainerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const fetchedTasks = await tasksApi.list(userId);
      setTasks(fetchedTasks);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load tasks";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (title: string) => {
    setIsCreating(true);
    setError(null);
    try {
      const newTask = await tasksApi.create(userId, { title });
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to create task";
      setError(message);
      throw err; // Re-throw so TaskForm can handle it
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (taskId: number) => {
    setTogglingTaskId(taskId);
    setError(null);
    try {
      const updatedTask = await tasksApi.toggleComplete(userId, taskId);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to update task";
      setError(message);
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handleDelete = async (taskId: number) => {
    setDeletingTaskId(taskId);
    setError(null);
    try {
      await tasksApi.delete(userId, taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to delete task";
      setError(message);
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleUpdate = async (taskId: number, updates: TaskUpdate) => {
    setUpdatingTaskId(taskId);
    setError(null);
    try {
      const updatedTask = await tasksApi.update(userId, taskId, updates);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to update task";
      setError(message);
      throw err; // Re-throw so TaskItem can show error
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Form skeleton */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-soft">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 h-11 skeleton rounded-xl" />
            <div className="w-full sm:w-24 h-11 skeleton rounded-xl" />
          </div>
        </div>
        {/* Task list skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-20 skeleton rounded" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] skeleton rounded-2xl"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaskForm onSubmit={handleCreateTask} isLoading={isCreating} />

      {error && (
        <div
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-fade-in"
          role="alert"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <TaskList
        tasks={tasks}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        togglingTaskId={togglingTaskId}
        deletingTaskId={deletingTaskId}
        updatingTaskId={updatingTaskId}
      />
    </div>
  );
}
