'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';

interface Post {
  id: number;
  text: string;
  timestamp: string;
  owner_id: number;
  owner_username: string;
  likes_count: number;
  liked_by_me: boolean;
}

const API_URL = 'http://localhost:8000/api';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params.username === 'string' ? params.username : Array.isArray(params.username) ? params.username[0] : '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.get(`${API_URL}/users/${username}/posts`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      setPosts(res.data);
    } catch (err) {
      setError('Пользователь не найден или ошибка загрузки.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    fetchUserPosts();
    // eslint-disable-next-line
  }, [username]);

  const handleLike = async (post: Post) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      if (post.liked_by_me) {
        await axios.delete(`${API_URL}/posts/${post.id}/like`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/posts/${post.id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchUserPosts();
    } catch (error) { console.error('Ошибка лайка:', error); }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-4">Профиль: {username}</h1>
      {posts.length === 0 ? (
        <p>У пользователя пока нет постов.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-lg shadow relative">
              <p>{post.text}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{new Date(post.timestamp).toLocaleString()}</span>
                <span className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(post)}
                    className={`text-lg ${post.liked_by_me ? 'text-red-500' : 'text-gray-400'} hover:text-red-600`}
                    title={post.liked_by_me ? 'Убрать лайк' : 'Поставить лайк'}
                  >
                    ♥
                  </button>
                  <span>{post.likes_count}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => router.push('/home')} className="mt-8 bg-gray-500 text-white p-2 rounded hover:bg-gray-600">Назад к ленте</button>
    </div>
  );
} 