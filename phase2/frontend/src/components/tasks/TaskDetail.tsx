"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tasksApi, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskDetailProps {
  userId: string;
  taskId: number;
}

export function TaskDetail({ userId, taskId }: TaskDetailProps) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setError(null);
      const fetchedTask = await tasksApi.get(userId, taskId);
      setTask(fetchedTask);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 404) {
        setError("Task not found");
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Failed to load task"
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleToggleComplete = async () => {
    if (!task) return;
    setIsToggling(true);
    try {
      const updatedTask = await tasksApi.toggleComplete(userId, taskId);
      setTask(updatedTask);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to update task"
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      await tasksApi.delete(userId, taskId);
      router.push("/tasks");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to delete task"
      );
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 skeleton rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-28 skeleton rounded-xl" />
            <div className="h-9 w-20 skeleton rounded-xl" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 skeleton rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-3/4 skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-4 w-48 skeleton rounded" />
            <div className="h-4 w-48 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to tasks
        </Link>
        <div
          className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 text-center animate-fade-in"
          role="alert"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
            <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-destructive font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to tasks
        </Link>
        <div className="flex gap-2">
          <Button
            variant={task.completed ? "outline" : "success"}
            size="sm"
            onClick={handleToggleComplete}
            disabled={isToggling || isDeleting}
            isLoading={isToggling}
          >
            {isToggling
              ? "Updating..."
              : task.completed
              ? "Mark Incomplete"
              : "Mark Complete"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || isToggling}
            isLoading={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Task card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex items-start gap-4">
          {/* Status indicator */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              task.completed
                ? "bg-success"
                : "border-2 border-border bg-card"
            )}
          >
            {task.completed && (
              <svg
                className="w-4 h-4 text-success-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className={cn(
                "font-display text-xl font-semibold transition-colors",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h1>
            {task.description && (
              <p className="mt-2 text-muted-foreground leading-relaxed">{task.description}</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t border-border pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    task.completed ? "bg-success" : "bg-accent"
                  )}
                />
                <span className="font-semibold text-sm">{task.completed ? "Completed" : "In Progress"}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Created</p>
              <p className="font-semibold text-sm">{formatDate(task.created_at)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Updated</p>
              <p className="font-semibold text-sm">{formatDate(task.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
