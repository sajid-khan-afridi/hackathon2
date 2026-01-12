/**
 * TypeScript interfaces for Todo Full-Stack Web Application.
 */

/**
 * Task entity from the API.
 */
export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

/**
 * Request body for creating a new task.
 */
export interface TaskCreate {
  title: string;
  description?: string;
}

/**
 * Request body for updating a task.
 */
export interface TaskUpdate {
  title?: string;
  description?: string;
}

/**
 * User entity from Better Auth.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

/**
 * Session from Better Auth.
 */
export interface Session {
  user: User;
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
}

/**
 * API success response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * API error response.
 */
export interface ApiError {
  detail: string;
  status_code: number;
  request_id: string;
  code?: string;
}

/**
 * Task list response from API.
 */
export type TaskListResponse = ApiResponse<Task[]>;

/**
 * Single task response from API.
 */
export type TaskResponse = ApiResponse<Task>;

/**
 * Delete operation response.
 */
export interface DeleteResponse {
  success: boolean;
  message: string;
}
