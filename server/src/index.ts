
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  createTodoInputSchema, 
  updateTodoTitleInputSchema, 
  updateTodoStatusInputSchema,
  deleteTodoInputSchema 
} from './schema';
import { createTodo } from './handlers/create_todo';
import { getTodos } from './handlers/get_todos';
import { updateTodoTitle } from './handlers/update_todo_title';
import { updateTodoStatus } from './handlers/update_todo_status';
import { deleteTodo } from './handlers/delete_todo';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new todo item
  createTodo: publicProcedure
    .input(createTodoInputSchema)
    .mutation(({ input }) => createTodo(input)),
    
  // Get all todo items
  getTodos: publicProcedure
    .query(() => getTodos()),
    
  // Update todo title
  updateTodoTitle: publicProcedure
    .input(updateTodoTitleInputSchema)
    .mutation(({ input }) => updateTodoTitle(input)),
    
  // Update todo status (for drag-and-drop between columns)
  updateTodoStatus: publicProcedure
    .input(updateTodoStatusInputSchema)
    .mutation(({ input }) => updateTodoStatus(input)),
    
  // Delete todo item
  deleteTodo: publicProcedure
    .input(deleteTodoInputSchema)
    .mutation(({ input }) => deleteTodo(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
