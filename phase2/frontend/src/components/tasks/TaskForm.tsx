"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TaskFormProps {
  onSubmit: (title: string) => Promise<void>;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title is required");
      return;
    }

    if (trimmedTitle.length > 200) {
      setError("Task title must be 200 characters or less");
      return;
    }

    try {
      await onSubmit(trimmedTitle);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-card border border-border shadow-soft"
    >
      <div className="flex-1 relative">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          disabled={isLoading}
          aria-label="New task title"
          aria-invalid={!!error}
          aria-describedby={error ? "task-form-error" : undefined}
          error={!!error}
          className="pr-10"
        />
        {title && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {title.length}/200
          </span>
        )}
      </div>
      <Button
        type="submit"
        disabled={isLoading || !title.trim()}
        isLoading={isLoading}
        className="sm:w-auto w-full"
      >
        {isLoading ? "Adding..." : "Add Task"}
      </Button>
      {error && (
        <p
          id="task-form-error"
          className="absolute -bottom-6 left-4 text-sm text-destructive animate-fade-in"
        >
          {error}
        </p>
      )}
    </form>
  );
}
