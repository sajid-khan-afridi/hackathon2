/**
 * Tests for TaskDetail component.
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import type { Task } from "@/types";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

// Mock API client
const mockTask: Task = {
  id: 1,
  title: "Test Task",
  description: "Test description for the task",
  completed: false,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T12:00:00Z",
};

const mockCompletedTask: Task = {
  ...mockTask,
  id: 2,
  title: "Completed Task",
  completed: true,
};

const mockGetTask = jest.fn();
const mockToggleComplete = jest.fn();
const mockDeleteTask = jest.fn();

jest.mock("@/lib/api", () => ({
  tasksApi: {
    get: (...args: unknown[]) => mockGetTask(...args),
    toggleComplete: (...args: unknown[]) => mockToggleComplete(...args),
    delete: (...args: unknown[]) => mockDeleteTask(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

describe("TaskDetail", () => {
  const userId = "test-user-123";
  const taskId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockGetTask.mockResolvedValue(mockTask);
    mockToggleComplete.mockResolvedValue({ ...mockTask, completed: true });
    mockDeleteTask.mockResolvedValue(undefined);
  });

  describe("Loading state", () => {
    it("shows loading skeleton initially", () => {
      mockGetTask.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<TaskDetail userId={userId} taskId={taskId} />);

      // Should show skeleton elements
      expect(document.querySelector(".skeleton")).toBeInTheDocument();
    });
  });

  describe("Task display", () => {
    it("renders task title and description", async () => {
      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Test Task")).toBeInTheDocument();
      });
      expect(
        screen.getByText("Test description for the task")
      ).toBeInTheDocument();
    });

    it("shows completed status for completed task", async () => {
      mockGetTask.mockResolvedValue(mockCompletedTask);

      render(<TaskDetail userId={userId} taskId={2} />);

      await waitFor(() => {
        expect(screen.getByText("Completed Task")).toBeInTheDocument();
      });
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("shows In Progress status for incomplete task", async () => {
      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("In Progress")).toBeInTheDocument();
      });
    });

    it("displays created and updated timestamps", async () => {
      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Created")).toBeInTheDocument();
      });
      expect(screen.getByText("Updated")).toBeInTheDocument();
    });

    it("shows back to tasks link", async () => {
      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Back to tasks")).toBeInTheDocument();
      });
    });
  });

  describe("Toggle completion", () => {
    it("calls toggleComplete when Mark Complete button is clicked", async () => {
      const user = userEvent.setup();
      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Mark Complete")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Mark Complete"));

      await waitFor(() => {
        expect(mockToggleComplete).toHaveBeenCalledWith(userId, taskId);
      });
    });

    it("shows Mark Incomplete for completed tasks", async () => {
      mockGetTask.mockResolvedValue(mockCompletedTask);

      render(<TaskDetail userId={userId} taskId={2} />);

      await waitFor(() => {
        expect(screen.getByText("Mark Incomplete")).toBeInTheDocument();
      });
    });
  });

  describe("Delete task", () => {
    it("calls delete and redirects when confirmed", async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      jest.spyOn(window, "confirm").mockReturnValue(true);

      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalledWith(userId, taskId);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/tasks");
      });
    });

    it("does not delete when confirmation is cancelled", async () => {
      const user = userEvent.setup();
      jest.spyOn(window, "confirm").mockReturnValue(false);

      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Delete"));

      expect(mockDeleteTask).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("shows error message when task not found", async () => {
      const { ApiClientError } = await import("@/lib/api");
      mockGetTask.mockRejectedValue(new ApiClientError("Not found", 404));

      render(<TaskDetail userId={userId} taskId={99999} />);

      await waitFor(() => {
        expect(screen.getByText("Task not found")).toBeInTheDocument();
      });
    });

    it("shows error message on API failure", async () => {
      mockGetTask.mockRejectedValue(new Error("Network error"));

      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load task")).toBeInTheDocument();
      });
    });

    it("shows back link on error page", async () => {
      mockGetTask.mockRejectedValue(new Error("Network error"));

      render(<TaskDetail userId={userId} taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText("Back to tasks")).toBeInTheDocument();
      });
    });
  });
});
