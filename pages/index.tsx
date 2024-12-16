import { useState, useEffect } from "react";
import { Todo } from "@/types";
import type { EventsChannel } from 'aws-amplify/data';
import { events } from 'aws-amplify/data';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    let channel: EventsChannel;

    const connectAndSubscribe = async () => {
      channel = await events.connect('default/todo');

      channel.subscribe({
        next: (data) => {
          console.log('received', data);
          const todo = {
            id: data.id,
            content: data.event.content
          }
          setTodos([...todos, todo]);
        },
        error: (err) => console.error('error', err)
      });
    };

    connectAndSubscribe();

    return () => channel && channel.close();
  }, []);

  async function createTodo() {
    await events.post('default/todo', {
      content: 'New todo',
    });
  }

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/gen2/start/quickstart/nextjs-pages-router/">
          Review next steps of this tutorial.
        </a>
      </div>
    </main>
  );
}
