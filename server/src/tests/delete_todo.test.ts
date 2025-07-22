
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo to delete
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo to Delete'
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;
    const input: DeleteTodoInput = { id: todoId };

    // Delete the todo
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify the todo was actually deleted from the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false for non-existent todo', async () => {
    const input: DeleteTodoInput = { id: 999 }; // Non-existent ID

    const result = await deleteTodo(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const createResults = await db.insert(todosTable)
      .values([
        { title: 'First Todo' },
        { title: 'Second Todo' },
        { title: 'Third Todo' }
      ])
      .returning()
      .execute();

    const todoToDelete = createResults[1]; // Delete the middle one
    const input: DeleteTodoInput = { id: todoToDelete.id };

    // Delete one todo
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(t => t.id === todoToDelete.id)).toBeUndefined();
    expect(remainingTodos.find(t => t.title === 'First Todo')).toBeDefined();
    expect(remainingTodos.find(t => t.title === 'Third Todo')).toBeDefined();
  });

  it('should handle deletion of todo with different statuses', async () => {
    // Create todos with different statuses
    const createResults = await db.insert(todosTable)
      .values([
        { title: 'Active Todo', status: 'active' },
        { title: 'In Progress Todo', status: 'in_progress' },
        { title: 'Done Todo', status: 'done' }
      ])
      .returning()
      .execute();

    // Delete each todo regardless of status
    for (const todo of createResults) {
      const input: DeleteTodoInput = { id: todo.id };
      const result = await deleteTodo(input);
      
      expect(result.success).toBe(true);
    }

    // Verify all todos were deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(0);
  });
});
