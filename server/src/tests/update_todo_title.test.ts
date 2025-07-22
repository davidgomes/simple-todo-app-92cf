
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoTitleInput } from '../schema';
import { updateTodoTitle } from '../handlers/update_todo_title';
import { eq } from 'drizzle-orm';

describe('updateTodoTitle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title and updated_at timestamp', async () => {
    // Create a todo directly in the database
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        status: 'active'
      })
      .returning()
      .execute();
    
    const createdTodo = insertResult[0];
    
    // Wait a moment to ensure updated_at will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the title
    const updateInput: UpdateTodoTitleInput = {
      id: createdTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodoTitle(updateInput);

    // Verify the updated todo
    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.status).toEqual(createdTodo.status);
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should save updated title to database', async () => {
    // Create a todo directly in the database
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        status: 'active'
      })
      .returning()
      .execute();
    
    const createdTodo = insertResult[0];

    // Update the title
    const updateInput: UpdateTodoTitleInput = {
      id: createdTodo.id,
      title: 'Database Updated Title'
    };

    await updateTodoTitle(updateInput);

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Title');
    expect(todos[0].id).toEqual(createdTodo.id);
    expect(todos[0].status).toEqual(createdTodo.status);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoTitleInput = {
      id: 999,
      title: 'Non-existent Todo'
    };

    expect(updateTodoTitle(updateInput)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should update title with maximum length', async () => {
    // Create a todo directly in the database
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        status: 'active'
      })
      .returning()
      .execute();
    
    const createdTodo = insertResult[0];

    // Update with maximum allowed length (255 characters)
    const longTitle = 'A'.repeat(255);
    const updateInput: UpdateTodoTitleInput = {
      id: createdTodo.id,
      title: longTitle
    };

    const result = await updateTodoTitle(updateInput);

    expect(result.title).toEqual(longTitle);
    expect(result.title.length).toEqual(255);
  });
});
