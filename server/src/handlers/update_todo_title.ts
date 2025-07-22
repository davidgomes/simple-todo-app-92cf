
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoTitleInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodoTitle = async (input: UpdateTodoTitleInput): Promise<Todo> => {
  try {
    // Update the todo title and updated_at timestamp
    const result = await db.update(todosTable)
      .set({
        title: input.title,
        updated_at: new Date()
      })
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Check if todo was found and updated
    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Todo title update failed:', error);
    throw error;
  }
};
