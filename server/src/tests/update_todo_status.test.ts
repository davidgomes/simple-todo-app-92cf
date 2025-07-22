
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoStatusInput } from '../schema';
import { updateTodoStatus } from '../handlers/update_todo_status';
import { eq } from 'drizzle-orm';

describe('updateTodoStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo status', async () => {
    // First create a todo directly in the database
    const createdTodos = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        status: 'active'
      })
      .returning()
      .execute();

    const createdTodo = createdTodos[0];

    // Update the status
    const updateInput: UpdateTodoStatusInput = {
      id: createdTodo.id,
      status: 'in_progress'
    };

    const result = await updateTodoStatus(updateInput);

    // Verify the update
    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.status).toEqual('in_progress');
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).not.toEqual(createdTodo.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save status update to database', async () => {
    // Create a todo directly in the database
    const createdTodos = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        status: 'active'
      })
      .returning()
      .execute();

    const createdTodo = createdTodos[0];

    // Update status
    const updateInput: UpdateTodoStatusInput = {
      id: createdTodo.id,
      status: 'done'
    };

    await updateTodoStatus(updateInput);

    // Query database directly to verify the update
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].status).toEqual('done');
    expect(todos[0].title).toEqual('Database Test Todo');
    expect(todos[0].updated_at).not.toEqual(createdTodo.updated_at);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoStatusInput = {
      id: 999,
      status: 'done'
    };

    await expect(updateTodoStatus(updateInput)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should update status from active to done', async () => {
    // Create active todo directly in database
    const createdTodos = await db.insert(todosTable)
      .values({
        title: 'Active Todo',
        status: 'active'
      })
      .returning()
      .execute();

    const createdTodo = createdTodos[0];

    expect(createdTodo.status).toEqual('active');

    // Update to done
    const updateInput: UpdateTodoStatusInput = {
      id: createdTodo.id,
      status: 'done'
    };

    const result = await updateTodoStatus(updateInput);

    expect(result.status).toEqual('done');
    expect(result.title).toEqual('Active Todo');
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });
});
