'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

interface Entry {
  id: string;
  name: string;
  message: string;
  timestamp: string; // Дата придет как строка в формате ISO
}

interface PaginatedResponse {
  entries: Entry[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const API_URL = 'http://localhost:8000/api/entries';

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [limit] = useState(10);
  
  // Состояние для редактирования
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');

  const fetchEntries = async (page: number = 1) => {
    try {
      const response = await axios.get<PaginatedResponse>(`${API_URL}?page=${page}&limit=${limit}`);
      setEntries(response.data.entries);
      setTotalPages(response.data.total_pages);
      setTotalEntries(response.data.total);
      setCurrentPage(response.data.page);
    } catch (err) {
      setError('Не удалось загрузить записи.');
    }
  };

  useEffect(() => {
    fetchEntries(1);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Имя и сообщение не могут быть пустыми.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(API_URL, { name, message });
      // Очищаем поля и перезагружаем записи
      setName('');
      setMessage('');
      fetchEntries(1); // Возвращаемся на первую страницу
    } catch (err) {
      setError('Ошибка при отправке сообщения.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${entryId}`);
      fetchEntries(currentPage);
    } catch (err) {
      setError('Ошибка при удалении записи.');
    }
  };

  const handleEdit = async (entryId: string) => {
    if (!editMessage.trim()) {
      setError('Сообщение не может быть пустым.');
      return;
    }

    try {
      await axios.put(`${API_URL}/${entryId}`, { message: editMessage });
      setEditingId(null);
      setEditMessage('');
      fetchEntries(currentPage);
    } catch (err) {
      setError('Ошибка при редактировании записи.');
    }
  };

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setEditMessage(entry.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchEntries(page);
    }
  };

  return (
    <main className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Гостевая Книга</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Оставить запись</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-1">Ваше имя</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Аноним"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="message" className="block text-gray-700 mb-1">Сообщение</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Всем привет!"
            ></textarea>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>

        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-lg shadow">
              {editingId === entry.id ? (
                <div>
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mb-2"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entry.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800">{entry.message}</p>
              )}
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-500">
                  <strong>- {entry.name}</strong> в {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(entry)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            
            <span className="text-gray-700">
              Страница {currentPage} из {totalPages} (всего записей: {totalEntries})
            </span>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              Вперед
            </button>
          </div>
        )}
      </div>
    </main>
  );
}