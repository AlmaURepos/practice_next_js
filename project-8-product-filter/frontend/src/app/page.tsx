'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

const API_URL = 'http://localhost:8000/api';

export default function Home() {
  // Состояния для данных
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Состояния для фильтров
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Состояние загрузки
  const [loading, setLoading] = useState(true);

  // Debouncing для поиска
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Загрузка категорий один раз при монтировании компонента
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(['All', ...response.data]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Debouncing эффект для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400); // 400ms задержка

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Основной эффект для загрузки продуктов при изменении фильтров
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (debouncedSearchTerm) {
          params.append('search', debouncedSearchTerm);
        }
        if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory);
        }
        if (sortOption) {
          params.append('sort', sortOption);
        }
        if (minPrice) {
          params.append('min_price', minPrice);
        }
        if (maxPrice) {
          params.append('max_price', maxPrice);
        }

        const response = await axios.get(`${API_URL}/products?${params.toString()}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearchTerm, selectedCategory, sortOption, minPrice, maxPrice]);

  // Очистка фильтров
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortOption('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Каталог товаров</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Панель фильтров */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Поиск */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="p-2 border rounded-md w-full"
              />
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select
                value={selectedCategory}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                className="p-2 border rounded-md w-full"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Сортировка */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сортировка</label>
              <select
                value={sortOption}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortOption(e.target.value)}
                className="p-2 border rounded-md w-full"
              >
                <option value="">Без сортировки</option>
                <option value="price_asc">По цене: сначала дешевые</option>
                <option value="price_desc">По цене: сначала дорогие</option>
              </select>
            </div>

            {/* Минимальная цена */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Мин. цена</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMinPrice(e.target.value)}
                className="p-2 border rounded-md w-full"
                min="0"
              />
            </div>

            {/* Максимальная цена */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Макс. цена</label>
              <input
                type="number"
                placeholder="∞"
                value={maxPrice}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxPrice(e.target.value)}
                className="p-2 border rounded-md w-full"
                min="0"
              />
            </div>
          </div>

          {/* Кнопка очистки фильтров */}
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Очистить фильтры
            </button>
          </div>
        </div>

        {/* Сетка товаров */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Загрузка товаров...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length > 0 ? products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <div className="p-6">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{product.category}</span>
                  <h2 className="text-xl font-bold text-gray-800 mt-2 h-16">{product.name}</h2>
                  <p className="text-2xl font-light text-blue-600 mt-4">${product.price}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600 text-lg">Товары не найдены.</p>
                <p className="text-gray-500 text-sm mt-2">Попробуйте изменить параметры фильтрации</p>
              </div>
            )}
          </div>
        )}

        {/* Информация о результатах */}
        {!loading && products.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Найдено товаров: {products.length}
          </div>
        )}
      </main>
    </div>
  );
}