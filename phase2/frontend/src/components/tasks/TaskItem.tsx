"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Task, TaskUpdate } from "@/types";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onUpdate?: (taskId: number, updates: TaskUpdate) => Promise<void>;
  isToggling?: boolean;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function TaskItem({
  task,
  onToggleComplete,
  onDelete,
  onUpdate,
  isToggling = false,
  isDeleting = false,
  isUpdating = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editError, setEditError] = useState<string | null>(null);

  const isLoading = isToggling || isDeleting || isUpdating;

  const handleEdit = () => {
    setEditTitle(task.title);
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditError(null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError("Title is required");
      return;
    }

    if (trimmedTitle.length > 200) {
      setEditError("Title must be 200 characters or less");
      return;
    }

    if (trimmedTitle === task.title) {
      setIsEditing(false);
      return;
    }

    if (onUpdate) {
      try {
        await onUpdate(task.id, { title: trimmedTitle });
        setIsEditing(false);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Failed to update");
      }
    }
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          "p-4 rounded-lg border bg-card",
          isUpdating && "opacity-50"
        )}
        data-testid={`task-item-${task.id}`}
      >
        <form onSubmit={handleSave} className="space-y-2">
          <Input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            disabled={isUpdating}
            aria-label="Edit task title"
            aria-invalid={!!editError}
            autoFocus
          />
          {editError && (
            <p className="text-sm text-destructive">{editError}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-2xl border bg-card",
        "shadow-soft transition-all duration-200",
        "hover:shadow-soft-lg hover:border-primary/30 hover:-translate-y-0.5",
        isLoading && "opacity-50"
      )}
      data-testid={`task-item-${task.id}`}
    >
      {/* Custom checkbox */}
      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        disabled={isLoading}
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "flex items-center justify-center",
          task.completed
            ? "bg-success border-success"
            : "border-border hover:border-primary hover:bg-primary/5"
        )}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && (
          <svg
            className="w-3.5 h-3.5 text-success-foreground"
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
      </button>

      {/* Task content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onUpdate ? handleEdit : undefined}
        role={onUpdate ? "button" : undefined}
        tabIndex={onUpdate ? 0 : undefined}
        onKeyDown={
          onUpdate
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleEdit();
                }
              }
            : undefined
        }
      >
        <p
          className={cn(
            "text-sm font-semibold truncate transition-colors",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {task.description}
          </p>
        )}
      </div>

      {/* Action buttons - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Link
          href={`/tasks/${task.id}`}
          className={cn(
            "flex-shrink-0 text-muted-foreground hover:text-primary",
            "inline-flex items-center justify-center rounded-lg h-8 w-8",
            "hover:bg-primary/10 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isLoading && "pointer-events-none opacity-50"
          )}
          aria-label="View task details"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </Link>

        {onUpdate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            disabled={isLoading}
            aria-label="Edit task"
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-secondary hover:bg-secondary/10"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          disabled={isLoading}
          aria-label="Delete task"
          className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
