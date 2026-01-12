/**
 * Tests for task components.
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskList } from "@/components/tasks/TaskList";
import { EmptyState } from "@/components/tasks/EmptyState";
import type { Task } from "@/types";

const mockTask: Task = {
  id: 1,
  title: "Test Task",
  description: "Test description",
  completed: false,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const mockCompletedTask: Task = {
  ...mockTask,
  id: 2,
  title: "Completed Task",
  completed: true,
};

describe("TaskForm", () => {
  it("renders input and submit button", () => {
    render(<TaskForm onSubmit={jest.fn()} />);

    expect(screen.getByPlaceholderText("What needs to be done?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add task/i })).toBeInTheDocument();
  });

  it("submits the form with valid title", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "New task");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("New task");
    });
  });

  it("shows error for empty title", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    // Type something then clear it
    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "a");
    await user.clear(input);

    // Try to submit empty form by clicking elsewhere and then submitting
    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Task title is required")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows error for title over 200 characters", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "x".repeat(201));
    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText("Task title must be 200 characters or less")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears input after successful submission", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("What needs to be done?") as HTMLInputElement;
    await user.type(input, "New task");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("disables form when loading", () => {
    render(<TaskForm onSubmit={jest.fn()} isLoading />);

    expect(screen.getByPlaceholderText("What needs to be done?")).toBeDisabled();
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
  });
});

describe("TaskItem", () => {
  it("renders task title and description", () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("shows checkmark for completed tasks", () => {
    render(
      <TaskItem
        task={mockCompletedTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    // Completed task should have line-through style
    const title = screen.getByText("Completed Task");
    expect(title).toHaveClass("line-through");
  });

  it("calls onToggleComplete when checkbox clicked", async () => {
    const user = userEvent.setup();
    const onToggleComplete = jest.fn().mockResolvedValue(undefined);
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onDelete={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /mark as complete/i }));
    expect(onToggleComplete).toHaveBeenCalledWith(1);
  });

  it("calls onDelete when delete button clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: /delete task/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("shows loading state when toggling", () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
        isToggling
      />
    );

    expect(screen.getByTestId("task-item-1")).toHaveClass("opacity-50");
  });

  it("shows edit button when onUpdate is provided", () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /edit task/i })).toBeInTheDocument();
  });

  it("does not show edit button when onUpdate is not provided", () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /edit task/i })).not.toBeInTheDocument();
  });

  it("enters edit mode when edit button clicked", async () => {
    const user = userEvent.setup();
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /edit task/i }));

    expect(screen.getByLabelText("Edit task title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("cancels edit mode", async () => {
    const user = userEvent.setup();
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /edit task/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.queryByLabelText("Edit task title")).not.toBeInTheDocument();
  });

  it("calls onUpdate when saving edited title", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
        onUpdate={onUpdate}
      />
    );

    await user.click(screen.getByRole("button", { name: /edit task/i }));
    const input = screen.getByLabelText("Edit task title");
    await user.clear(input);
    await user.type(input, "Updated Title");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(1, { title: "Updated Title" });
    });
  });

  it("shows error for empty title in edit mode", async () => {
    const user = userEvent.setup();
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /edit task/i }));
    const input = screen.getByLabelText("Edit task title");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });
});

describe("TaskList", () => {
  it("renders list of tasks", () => {
    render(
      <TaskList
        tasks={[mockTask, mockCompletedTask]}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Completed Task")).toBeInTheDocument();
  });

  it("renders EmptyState when no tasks", () => {
    render(
      <TaskList tasks={[]} onToggleComplete={jest.fn()} onDelete={jest.fn()} />
    );

    expect(screen.getByText("Your task list is empty")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders empty state message", () => {
    render(<EmptyState />);

    expect(screen.getByText("Your task list is empty")).toBeInTheDocument();
    expect(screen.getByText(/adding your first task/i)).toBeInTheDocument();
  });
});
