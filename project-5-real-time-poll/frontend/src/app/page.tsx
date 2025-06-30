'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

// Типы для данных голосования
interface PollOption {
  label: string;
  votes: number;
}

interface PollData {
  id: string;
  question: string;
  options: Record<string, PollOption>;
  created_at: string;
}

interface AllPolls {
  [pollId: string]: PollData;
}

const API_URL = 'http://localhost:8000/api';

export default function Home() {
  const [allPolls, setAllPolls] = useState<AllPolls>({});
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({}); // pollId -> optionKey

  // Загружаем данные о голосованиях из localStorage при загрузке страницы
  useEffect(() => {
    const savedVotes = localStorage.getItem('votedPolls');
    if (savedVotes) {
      try {
        setVotedPolls(JSON.parse(savedVotes));
      } catch (error) {
        console.error('Ошибка при загрузке данных о голосованиях:', error);
      }
    }
  }, []);

  // Функция для получения всех опросов с сервера
  const fetchAllPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/polls`);
      setAllPolls(response.data);
      
      // Устанавливаем первый опрос как текущий, если текущий не выбран
      if (!currentPollId && Object.keys(response.data).length > 0) {
        setCurrentPollId(Object.keys(response.data)[0]);
      }
    } catch (error) {
      console.error("Failed to fetch polls data:", error);
    }
  };

  // Основной эффект для поллинга
  useEffect(() => {
    fetchAllPolls(); // Получаем данные при первой загрузке
    const intervalId = setInterval(fetchAllPolls, 3000); // Опрашиваем сервер каждые 3 секунды

    // Очищаем интервал при размонтировании компонента, чтобы избежать утечек памяти
    return () => clearInterval(intervalId);
  }, []);

  const handleVote = async (pollId: string, optionKey: string) => {
    // Проверяем, не голосовал ли пользователь уже в этом опросе
    if (votedPolls[pollId]) {
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/poll/${pollId}/vote/${optionKey}`);
      
      // Обновляем данные опросов
      setAllPolls(prev => ({
        ...prev,
        [pollId]: response.data
      }));

      // Сохраняем информацию о голосовании в localStorage
      const newVotedPolls = {
        ...votedPolls,
        [pollId]: optionKey
      };
      setVotedPolls(newVotedPolls);
      localStorage.setItem('votedPolls', JSON.stringify(newVotedPolls));
    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  };

  const currentPoll = currentPollId ? allPolls[currentPollId] : null;
  const totalVotes = currentPoll ? Object.values(currentPoll.options).reduce((sum, option) => sum + option.votes, 0) : 0;
  const pollIds = Object.keys(allPolls);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-xl shadow-lg">
        {/* Заголовок и навигация */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Система голосования</h1>
          <Link 
            href="/create"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
          >
            Создать опрос
          </Link>
        </div>

        {/* Выбор опроса */}
        {pollIds.length > 1 && (
          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите опрос:
            </label>
            <select
              value={currentPollId || ''}
              onChange={(e) => setCurrentPollId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pollIds.map(pollId => (
                <option key={pollId} value={pollId}>
                  {allPolls[pollId].question}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Отображение текущего опроса */}
        {currentPoll ? (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">{currentPoll.question}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Создан: {new Date(currentPoll.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
            
            <div className="space-y-4">
              {Object.entries(currentPoll.options).map(([key, option]) => {
                const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                const hasVoted = votedPolls[currentPoll.id];
                const isVotedOption = hasVoted === key;
                
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-700">{option.label}</span>
                      <span className="text-sm font-medium text-gray-500">
                        {option.votes} голосов ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div
                        className="bg-blue-500 h-8 rounded-full transition-all duration-500 ease-in-out text-white flex items-center px-2"
                        style={{ width: `${percentage}%` }}
                      >
                      </div>
                    </div>
                    <button
                      onClick={() => handleVote(currentPoll.id, key)}
                      disabled={!!hasVoted}
                      className={`w-full mt-2 py-2 text-white font-semibold rounded-lg transition-colors ${
                        hasVoted 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-600'
                      } ${isVotedOption ? '!bg-blue-700' : ''}`}
                    >
                      {isVotedOption ? 'Ваш голос' : hasVoted ? 'Уже голосовали' : 'Голосовать'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center text-gray-600 font-bold pt-4 border-t">
              Всего голосов: {totalVotes}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Нет доступных опросов</p>
            <Link 
              href="/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Создать первый опрос
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}