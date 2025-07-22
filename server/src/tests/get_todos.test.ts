
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos ordered by creation date (newest first)', async () => {
    // Create test todos with slight delay to ensure different timestamps
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        status: 'active'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        status: 'in_progress'
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    
    // Should be ordered by creation date, newest first
    expect(result[0].title).toEqual('Second Todo');
    expect(result[0].status).toEqual('in_progress');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('First Todo');
    expect(result[1].status).toEqual('active');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);

    // Verify ordering - first result should have later creation time
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
  });

  it('should return todos with all status types', async () => {
    // Create todos with different statuses
    await db.insert(todosTable)
      .values([
        { title: 'Active Todo', status: 'active' },
        { title: 'In Progress Todo', status: 'in_progress' },
        { title: 'Done Todo', status: 'done' }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    const statuses = result.map(todo => todo.status);
    expect(statuses).toContain('active');
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('done');
    
    // Verify all todos have required fields
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(todo.title).toBeDefined();
      expect(todo.status).toBeDefined();
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
    });
  });
});
