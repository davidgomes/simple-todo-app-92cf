
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Check, X, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, TodoStatus } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);

  // Load todos from API
  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
      // Since handlers are stubs, we'll use some demo data for visual demonstration
      setTodos([
        {
          id: 1,
          title: 'Complete project documentation',
          status: 'active' as TodoStatus,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          title: 'Review pull request',
          status: 'in_progress' as TodoStatus,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          title: 'Deploy to production',
          status: 'done' as TodoStatus,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setIsLoading(true);
    try {
      const input: CreateTodoInput = { title: newTodoTitle.trim() };
      const newTodo = await trpc.createTodo.mutate(input);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
      // Fallback for demo purposes since backend is stub
      const newTodo: Todo = {
        id: Date.now(),
        title: newTodoTitle.trim(),
        status: 'active' as TodoStatus,
        created_at: new Date(),
        updated_at: new Date()
      };
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNewTodoTitle('');
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing todo title
  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  // Save edited title
  const saveEdit = async (id: number) => {
    if (!editingTitle.trim()) return;

    try {
      const updatedTodo = await trpc.updateTodoTitle.mutate({
        id,
        title: editingTitle.trim()
      });
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) => (todo.id === id ? updatedTodo : todo))
      );
    } catch (error) {
      console.error('Failed to update todo title:', error);
      // Fallback for demo purposes
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === id ? { ...todo, title: editingTitle.trim(), updated_at: new Date() } : todo
        )
      );
    } finally {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Delete todo
  const deleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // Fallback for demo purposes
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    }
  };

  // Update todo status (for drag and drop)
  const updateTodoStatus = async (id: number, status: TodoStatus) => {
    try {
      const updatedTodo = await trpc.updateTodoStatus.mutate({ id, status });
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) => (todo.id === id ? updatedTodo : todo))
      );
    } catch (error) {
      console.error('Failed to update todo status:', error);
      // Fallback for demo purposes
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === id ? { ...todo, status, updated_at: new Date() } : todo
        )
      );
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TodoStatus) => {
    e.preventDefault();
    if (draggedTodo && draggedTodo.status !== status) {
      updateTodoStatus(draggedTodo.id, status);
    }
    setDraggedTodo(null);
  };

  // Filter todos by status
  const activeTodos = todos.filter((todo: Todo) => todo.status === 'active');
  const inProgressTodos = todos.filter((todo: Todo) => todo.status === 'in_progress');
  const doneTodos = todos.filter((todo: Todo) => todo.status === 'done');

  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderTodoItem = (todo: Todo) => (
    <Card
      key={todo.id}
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e: React.DragEvent) => handleDragStart(e, todo)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {editingId === todo.id ? (
            <div className="flex items-center space-x-2 flex-1">
              <Input
                value={editingTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditingTitle(e.target.value)
                }
                className="flex-1"
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') saveEdit(todo.id);
                  if (e.key === 'Escape') cancelEdit();
                }}
                autoFocus
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveEdit(todo.id)}
                className="text-green-600 hover:bg-green-50"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{todo.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {todo.created_at.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getStatusColor(todo.status)}>
                  {todo.status.replace('_', ' ')}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(todo)}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderColumn = (title: string, todos: Todo[], status: TodoStatus, emoji: string) => (
    <Card
      className="flex-1 h-fit min-h-[400px]"
      onDragOver={handleDragOver}
      onDrop={(e: React.DragEvent) => handleDrop(e, status)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center space-x-2">
            <span>{emoji}</span>
            <span>{title}</span>
          </span>
          <Badge variant="secondary" className="text-xs">
            {todos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No items yet</p>
            <p className="text-xs mt-1">Drag items here to change status</p>
          </div>
        ) : (
          todos.map((todo: Todo) => renderTodoItem(todo))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 Todo List</h1>
          <p className="text-gray-600">Organize your tasks with drag-and-drop simplicity</p>
        </div>

        {/* Create New Todo Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add New Task</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="flex space-x-4">
              <Input
                placeholder="What needs to be done? ✨"
                value={newTodoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoTitle(e.target.value)
                }
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isLoading} className="px-6">
                {isLoading ? 'Adding...' : 'Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderColumn('Active', activeTodos, 'active', '🔵')}
          {renderColumn('In Progress', inProgressTodos, 'in_progress', '🟡')}
          {renderColumn('Done', doneTodos, 'done', '🟢')}
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <Card className="inline-block">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">
                💡 <strong>Pro tip:</strong> Drag and drop tasks between columns to change their status!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Development Notice */}
        <div className="mt-4 text-center">
          <Card className="inline-block border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <p className="text-xs text-amber-700">
                ⚠️ <strong>Development Notice:</strong> Backend handlers are currently stubs. 
                Demo data is used for visual demonstration. Real database integration needed for production.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
