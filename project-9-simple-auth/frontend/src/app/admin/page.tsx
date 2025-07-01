'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:8000/api';

export default function AdminPage() {
  const [adminMessage, setAdminMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    if (!token || role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    const fetchAdminData = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdminMessage(response.data.message);
      } catch (err) {
        setError('Нет доступа или сессия истекла.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [router]);

  if (loading) return <p className="text-center mt-10">Загрузка...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Админ-панель</h1>
      <p className="bg-yellow-100 border border-yellow-400 p-4 rounded-md text-lg">{adminMessage}</p>
      <button onClick={() => router.push('/dashboard')} className="mt-6 bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
        Назад в панель
      </button>
    </div>
  );
} 