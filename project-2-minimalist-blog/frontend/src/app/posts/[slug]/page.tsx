'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

interface Post {
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
}

const API_URL = 'http://localhost:8000/api/posts';

// Простая функция для рендеринга Markdown
const renderMarkdown = (content: string) => {
  if (!content || typeof content !== 'string') {
    return [<p key="no-content">Нет содержимого</p>];
  }
  
  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  let currentList: React.ReactElement[] = [];
  let inList = false;

  lines.forEach((line, index) => {
    // Заголовки
    if (line.startsWith('# ')) {
      if (inList && currentList.length > 0) {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
      elements.push(<h1 key={index} className="text-3xl font-bold text-gray-900 mb-4">{line.substring(2)}</h1>);
      return;
    }
    if (line.startsWith('## ')) {
      if (inList && currentList.length > 0) {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
      elements.push(<h2 key={index} className="text-2xl font-bold text-gray-800 mb-3 mt-6">{line.substring(3)}</h2>);
      return;
    }
    if (line.startsWith('### ')) {
      if (inList && currentList.length > 0) {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
      elements.push(<h3 key={index} className="text-xl font-semibold text-gray-800 mb-2 mt-4">{line.substring(4)}</h3>);
      return;
    }
    
    // Пустые строки
    if (line.trim() === '') {
      if (inList && currentList.length > 0) {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
      return;
    }
    
    // Блоки кода
    if (line.startsWith('```')) {
      if (inList && currentList.length > 0) {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
      elements.push(<div key={index} className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4"><code className="text-sm text-gray-800">{line.substring(3)}</code></div>);
      return;
    }
    
    // Цитаты
    if (line.startsWith('> ')) {
      if (inList && currentList.length > 0) {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
      elements.push(<blockquote key={index} className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4">{line.substring(2)}</blockquote>);
      return;
    }
    
    // Списки
    if (line.startsWith('- ')) {
      inList = true;
      currentList.push(<li key={`li-${index}`} className="text-gray-700">{line.substring(2)}</li>);
      return;
    }
    if (line.match(/^\d+\. /)) {
      inList = true;
      currentList.push(<li key={`li-${index}`} className="text-gray-700">{line.replace(/^\d+\. /, '')}</li>);
      return;
    }
    
    // Обычный текст
    if (inList && currentList.length > 0) {
      elements.push(<ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
      currentList = [];
      inList = false;
    }
    elements.push(<p key={index} className="text-gray-700 mb-4 leading-relaxed">{line}</p>);
  });

  // Добавляем оставшийся список
  if (inList && currentList.length > 0) {
    elements.push(<ul key="final-list" className="list-disc list-inside mb-4 space-y-1">{currentList}</ul>);
  }

  return elements;
};

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const fetchPost = async () => {
        try {
          const response = await axios.get(`${API_URL}/${slug}`);
          setPost(response.data);
        } catch (error) {
          console.error(`Error fetching post ${slug}:`, error);
        } finally {
            setLoading(false);
        }
      };
      fetchPost();
    }
  }, [slug]);

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
          <p className="text-gray-600">Загрузка поста...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Пост не найден</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">Вернуться на главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto p-8">
        <Link href="/" className="text-blue-500 hover:underline mb-8 block">&larr; Назад ко всем постам</Link>
        
        {/* Заголовок и метаданные */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{post.title || 'Без заголовка'}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              {post.author || 'Неизвестный автор'}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              {post.date ? formatDate(post.date) : 'Без даты'}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {post.category || 'Без категории'}
            </span>
          </div>
        </header>

        {/* Контент поста */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            {post.content ? renderMarkdown(post.content) : <p>Нет содержимого</p>}
          </div>
        </div>
      </article>
    </div>
  );
}