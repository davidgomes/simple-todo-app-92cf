
import { z } from 'zod';

// Todo status enum
export const todoStatusSchema = z.enum(['active', 'in_progress', 'done']);
export type TodoStatus = z.infer<typeof todoStatusSchema>;

// Todo schema
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: todoStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todos
export const createTodoInputSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(255, "Title too long")
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todo title
export const updateTodoTitleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title cannot be empty").max(255, "Title too long")
});

export type UpdateTodoTitleInput = z.infer<typeof updateTodoTitleInputSchema>;

// Input schema for updating todo status
export const updateTodoStatusInputSchema = z.object({
  id: z.number(),
  status: todoStatusSchema
});

export type UpdateTodoStatusInput = z.infer<typeof updateTodoStatusInputSchema>;

// Input schema for deleting todo
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;
