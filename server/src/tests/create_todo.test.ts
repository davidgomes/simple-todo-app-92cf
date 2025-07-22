
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

const testInput: CreateTodoInput = {
  title: 'Test Todo'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with active status', async () => {
    const result = await createTodo(testInput);

    expect(result.title).toEqual('Test Todo');
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].status).toEqual('active');
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different todo titles', async () => {
    const longTitle = 'A'.repeat(255); // Max length allowed
    const longTitleInput: CreateTodoInput = {
      title: longTitle
    };

    const result = await createTodo(longTitleInput);

    expect(result.title).toEqual(longTitle);
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
  });
});
