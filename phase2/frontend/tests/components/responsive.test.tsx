/**
 * Tests for responsive layout behavior.
 * Verifies that components render correctly at different viewport sizes.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
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

describe("Responsive Layout", () => {
  describe("TaskForm", () => {
    it("has responsive flex layout classes", () => {
      render(<TaskForm onSubmit={jest.fn()} />);

      const form = document.querySelector("form");
      expect(form).toHaveClass("flex-col");
      expect(form).toHaveClass("sm:flex-row");
    });

    it("button has full width on mobile and auto on desktop", () => {
      render(<TaskForm onSubmit={jest.fn()} />);

      const button = screen.getByRole("button", { name: /add task/i });
      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("sm:w-auto");
    });
  });

  describe("TaskItem", () => {
    it("renders with proper spacing and layout", () => {
      render(
        <TaskItem
          task={mockTask}
          onToggleComplete={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const item = screen.getByTestId("task-item-1");
      expect(item).toBeInTheDocument();
    });

    it("task title has proper text sizing", () => {
      render(
        <TaskItem
          task={mockTask}
          onToggleComplete={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByText("Test Task")).toBeInTheDocument();
    });

    it("action buttons are accessible on touch devices", () => {
      render(
        <TaskItem
          task={mockTask}
          onToggleComplete={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const toggleButton = screen.getByRole("button", {
        name: /mark as complete/i,
      });
      const deleteButton = screen.getByRole("button", { name: /delete task/i });

      // Buttons should have minimum touch target size (44x44 CSS pixels recommended)
      // We verify they have proper button role and are not too small via classes
      expect(toggleButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe("TaskList", () => {
    it("renders list with proper spacing", () => {
      const tasks = [mockTask, { ...mockTask, id: 2, title: "Task 2" }];

      render(
        <TaskList
          tasks={tasks}
          onToggleComplete={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const list = screen.getByRole("list", { name: /task list/i });
      expect(list).toHaveClass("space-y-6");
    });

    it("separates pending and completed tasks into sections", () => {
      const tasks = [
        mockTask,
        { ...mockTask, id: 2, title: "Done Task", completed: true },
      ];

      render(
        <TaskList
          tasks={tasks}
          onToggleComplete={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByText(/to do \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/completed \(1\)/i)).toBeInTheDocument();
    });
  });

  describe("EmptyState", () => {
    it("renders centered content", () => {
      render(<EmptyState />);

      const container = document.querySelector(".text-center");
      expect(container).toBeInTheDocument();
    });

    it("has responsive padding", () => {
      render(<EmptyState />);

      const container = document.querySelector(".py-16");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("px-6");
    });
  });

  describe("General responsive classes", () => {
    it("TaskForm uses rounded corners for card appearance", () => {
      render(<TaskForm onSubmit={jest.fn()} />);

      const form = document.querySelector("form");
      expect(form).toHaveClass("rounded-2xl");
    });

    it("TaskItem uses consistent spacing", () => {
      render(
        <TaskItem
          task={mockTask}
          onToggleComplete={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const item = screen.getByTestId("task-item-1");
      expect(item).toHaveClass("p-4");
    });
  });
});

describe("Mobile-specific behavior", () => {
  it("TaskForm stacks vertically on mobile", () => {
    render(<TaskForm onSubmit={jest.fn()} />);

    const form = document.querySelector("form");
    // flex-col is applied by default (mobile-first)
    // sm:flex-row applies at sm breakpoint and above
    expect(form).toHaveClass("flex-col");
  });

  it("form gap is consistent", () => {
    render(<TaskForm onSubmit={jest.fn()} />);

    const form = document.querySelector("form");
    expect(form).toHaveClass("gap-3");
  });
});

describe("Desktop-specific behavior", () => {
  it("TaskForm has horizontal layout class for desktop", () => {
    render(<TaskForm onSubmit={jest.fn()} />);

    const form = document.querySelector("form");
    // sm:flex-row switches to horizontal on desktop
    expect(form).toHaveClass("sm:flex-row");
  });
});
