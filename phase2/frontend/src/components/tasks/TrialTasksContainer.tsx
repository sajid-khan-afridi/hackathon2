"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import type { Task, TaskUpdate } from "@/types";

const STORAGE_KEY = "trial_tasks";
const MAX_TASKS = 5;

interface TrialTask extends Task {
  id: number;
}

function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function loadTasksFromStorage(): TrialTask[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTasksToStorage(tasks: TrialTask[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function TrialTasksContainer() {
  const [tasks, setTasks] = useState<TrialTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const storedTasks = loadTasksFromStorage();
    setTasks(storedTasks);
    setIsLoading(false);
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveTasksToStorage(tasks);
    }
  }, [tasks, isLoading]);

  const handleCreateTask = useCallback(async (title: string) => {
    if (tasks.length >= MAX_TASKS) {
      setError(`Trial mode is limited to ${MAX_TASKS} tasks. Sign up for unlimited tasks!`);
      throw new Error(`Trial mode is limited to ${MAX_TASKS} tasks`);
    }

    setIsCreating(true);
    setError(null);

    // Simulate network delay for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newTask: TrialTask = {
      id: generateId(),
      title,
      description: null,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setIsCreating(false);
  }, [tasks.length]);

  const handleToggleComplete = useCallback(async (taskId: number) => {
    setTogglingTaskId(taskId);
    setError(null);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, updated_at: new Date().toISOString() }
          : task
      )
    );
    setTogglingTaskId(null);
  }, []);

  const handleDelete = useCallback(async (taskId: number) => {
    setDeletingTaskId(taskId);
    setError(null);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setDeletingTaskId(null);
  }, []);

  const handleUpdate = useCallback(async (taskId: number, updates: TaskUpdate) => {
    setUpdatingTaskId(taskId);
    setError(null);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      )
    );
    setUpdatingTaskId(null);
  }, []);

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
      {/* Trial mode banner - Enhanced styling */}
      <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-warning/15 via-warning/10 to-accent/10 border border-warning/30 shadow-soft animate-fade-in">
        {/* Decorative element */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-warning/10 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/20 border border-warning/30">
              <svg
                className="w-5 h-5 text-warning"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Trial Mode
              </span>
              <span className="text-xs text-muted-foreground">
                Data stored locally in your browser
              </span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-muted-foreground">Tasks Used</span>
              <span className="text-lg font-bold text-warning">{tasks.length}<span className="text-muted-foreground font-normal">/{MAX_TASKS}</span></span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: MAX_TASKS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-6 rounded-full transition-colors duration-300 ${
                    i < tasks.length
                      ? "bg-warning"
                      : "bg-warning/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

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
