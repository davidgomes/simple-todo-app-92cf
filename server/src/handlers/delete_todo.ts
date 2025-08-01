
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTodo(input: DeleteTodoInput): Promise<{ success: boolean }> {
  try {
    // Delete the todo by ID
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Check if any rows were affected (todo existed and was deleted)
    // Handle case where rowCount might be null
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
}
