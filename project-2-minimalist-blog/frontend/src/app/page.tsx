'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
}

const API_URL = 'http://localhost:8000/api/posts';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(API_URL);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка постов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Заголовок */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Минималистичный Блогg</h1>
          <p className="text-xl text-gray-600">Простые мысли, красивые слова</p>
        </header>

        {/* Список постов */}
        <div className="space-y-8">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Пока нет постов</p>
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {post.author || 'Неизвестный автор'}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {post.date ? formatDate(post.date) : 'Без даты'}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {post.category || 'Без категории'}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <Link href={`/posts/${post.slug}`} className="hover:text-blue-600 transition-colors">
                    {post.title || 'Без заголовка'}
                  </Link>
                </h2>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {post.content && post.content.length > 200 
                    ? `${post.content.substring(0, 200)}...` 
                    : post.content || 'Нет содержимого'
                  }
                </p>
                
                <Link 
                  href={`/posts/${post.slug}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Читать далее
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}