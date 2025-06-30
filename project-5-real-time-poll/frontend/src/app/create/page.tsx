'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function CreatePoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Минимум 2 опции
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Введите вопрос');
      return;
    }

    if (options.some(option => !option.trim())) {
      setError('Все варианты ответов должны быть заполнены');
      return;
    }

    if (new Set(options.map(opt => opt.trim())).size !== options.length) {
      setError('Варианты ответов не должны повторяться');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/poll/create`, {
        question: question.trim(),
        options: options.map(opt => opt.trim())
      });

      // Перенаправляем на главную страницу после создания
      router.push('/');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Ошибка при создании опроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Создать новый опрос</h1>
          <p className="text-gray-600 mt-2">Заполните форму ниже, чтобы создать новый опрос</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Вопрос */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Вопрос *
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ваш вопрос..."
              required
            />
          </div>

          {/* Варианты ответов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Варианты ответов * (минимум 2)
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Вариант ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
            >
              + Добавить вариант
            </button>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
            >
              {isSubmitting ? 'Создание...' : 'Создать опрос'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 