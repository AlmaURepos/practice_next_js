'use client'; // This directive is necessary for using React hooks

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

// Define the type for a single To-Do item to match the backend
interface Todo {
  id: string;
  task: string;
  completed: boolean;
}

// The base URL of our FastAPI backend
const API_URL = 'http://localhost:8000/api/todos';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // 1. Fetch all todos from the backend when the component mounts
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get(API_URL);
        setTodos(response.data);
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };
    fetchTodos();
  }, []); // Empty dependency array means this runs once on mount

  // 2. Handle form submission to add a new task
  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault(); // Prevent page reload
    if (!newTask.trim()) return; // Don't add empty tasks

    try {
      const response = await axios.post(API_URL, { task: newTask });
      setTodos([...todos, response.data]); // Add new task to the list
      setNewTask(''); // Clear the input field
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // 3. Handle toggling the completed status of a task
  const handleToggleComplete = async (id: string) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}`);
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // 4. Handle deleting a task
  const handleDeleteTask = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(todo => todo.id !== id)); // Remove task from the list
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.task);
  };

  const handleSaveEdit = async(id: string) =>{
    try{
      const response = await axios.put(`${API_URL}/${id}`, {task: editingText});
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
      setEditingId(null);
      setEditingText('');

    } catch(error){
      console.error('error', error);
    }
  }


  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };


  const handleDeleteCompleted = async() =>{
    try{
      await axios.delete(`${API_URL}/completed`);
      setTodos(todos.filter(todo => ! todo.completed));
      

    } catch(error){
      console.error('error', error);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
          ✨ Умный To-Do List ✨
        </h1>

        {/* Form to add a new task */}
        <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Добавить новую задачу..."
            className="flex-grow p-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-gray-300 transition-all duration-300"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Добавить
          </button>
        </form>

        {/* Clear completed button */}
        {todos.some(todo => todo.completed) && (
          <div className="mb-6">
            <button
              onClick={handleDeleteCompleted}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🗑️ Очистить все выполненные
            </button>
          </div>
        )}

        {/* List of tasks */}
        <ul className="space-y-4">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {editingId === todo.id ? (
                // Edit mode
                <div className="flex items-center gap-3 flex-grow">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-grow p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(todo.id)}
                    onKeyDown={(e) => e.key === 'Escape' && handleCancelEdit()}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(todo.id)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
                  >
                    💾
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
                  >
                    ❌
                  </button>
                </div>
              ) : (
                // View mode
                <>
                  <span
                    onClick={() => handleToggleComplete(todo.id)}
                    className={`cursor-pointer flex-grow transition-all duration-300 ${
                      todo.completed 
                        ? 'line-through text-gray-400 opacity-60' 
                        : 'text-white hover:text-cyan-300'
                    }`}
                  >
                    {todo.completed ? '✅ ' : '⭕ '}{todo.task}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-110"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteTask(todo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-110"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {/* Empty state */}
        {todos.length === 0 && (
          <div className="text-center py-8 text-gray-300">
            <p className="text-xl">🎯 Начните с добавления первой задачи!</p>
          </div>
        )}
      </div>
    </main>
  );

}