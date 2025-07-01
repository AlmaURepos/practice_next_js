'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:8000/api';

export default function DashboardPage() {
  const [secretMessage, setSecretMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    const userName = localStorage.getItem('user_name');
    setRole(userRole || '');
    setUserName(userName || '');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchSecretData = async () => {
      try {
        const response = await axios.get(`${API_URL}/secret-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSecretMessage(response.data.message);
      } catch (error) {
        // Если токен невалидный, разлогиниваем
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchSecretData();
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await axios.post(`${API_URL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  const goToAdmin = () => {
    router.push('/admin');
  };

  if (loading) {
    return <p className="text-center mt-10">Загрузка...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Защищенная Панель</h1>
      <p className="mt-2 text-gray-700">Пользователь: <b>{userName}</b> | Роль: <b>{role}</b></p>
      <p className="mt-4 text-xl p-4 bg-green-100 border border-green-400 rounded-md">{secretMessage}</p>
      {role === 'admin' && (
        <button onClick={goToAdmin} className="mt-4 bg-purple-600 text-white p-2 rounded hover:bg-purple-700 mr-4">
          Перейти в админ-панель
        </button>
      )}
      <button onClick={handleLogout} className="mt-6 bg-red-500 text-white p-2 rounded hover:bg-red-600">
        Выйти
      </button>
    </div>
  );
}