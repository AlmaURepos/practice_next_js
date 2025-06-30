'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface WeatherData {
  city_name: string;
  temperature: number;
  description: string;
  icon: string;
}

interface ForecastData {
  city_name: string;
  forecasts: Array<{
    date: string;
    temperature: number;
    description: string;
    icon: string;
  }>;
}

const API_URL = 'http://localhost:8000/api';

export default function Home() {
  const [city, setCity] = useState('Almaty'); // Город по умолчанию
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast(null);
    
    try {
      const response = await axios.get(`${API_URL}/weather/${cityName}`);
      setWeather(response.data);
      
      // Также загружаем прогноз для этого города
      await fetchForecast(cityName);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные о погоде.');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (cityName: string) => {
    setForecastLoading(true);
    try {
      const response = await axios.get(`${API_URL}/forecast/${cityName}`);
      setForecast(response.data);
    } catch (err: any) {
      console.error('Ошибка загрузки прогноза:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast(null);
    
    try {
      const response = await axios.get(`${API_URL}/weather/coords`, {
        params: { lat, lon }
      });
      setWeather(response.data);
      setCity(response.data.city_name);
      
      // Также загружаем прогноз для этого города
      await fetchForecast(response.data.city_name);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные о погоде.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером.');
      return;
    }

    setLocationPermission('pending');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocationPermission('denied');
        setError('Не удалось получить ваше местоположение.');
        console.error('Ошибка геолокации:', error);
      }
    );
  };

  // Загружаем погоду для города по умолчанию при первом рендере
  useEffect(() => {
    fetchWeather('Almaty');
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city.trim());
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 p-4">
      <div className="w-full max-w-2xl bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Погода</h1>
        
        {/* Форма поиска */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Введите город"
            className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-3 rounded-lg disabled:bg-blue-300 transition-colors"
          >
            {loading ? '...' : 'Поиск'}
          </button>
          <button 
            type="button"
            onClick={getCurrentLocation}
            disabled={loading || locationPermission === 'pending'}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-3 rounded-lg disabled:bg-green-300 transition-colors"
            title="Определить по геолокации"
          >
            📍
          </button>
        </form>

        {/* Индикатор геолокации */}
        {locationPermission === 'pending' && (
          <p className="text-center text-blue-600 mb-4">Определяем ваше местоположение...</p>
        )}

        {loading && <p className="text-center text-gray-700 mb-4">Загрузка...</p>}
        {error && <p className="text-center text-red-500 mb-4">{error}</p>}

        {/* Текущая погода */}
        {weather && (
          <div className="mb-8">
            <div className="flex flex-col items-center text-center text-gray-900 mb-6">
              <h2 className="text-4xl font-semibold mb-2">{weather.city_name}</h2>
              <div className="flex items-center mb-2">
                <p className="text-7xl font-light mr-4">{Math.round(weather.temperature)}°C</p>
                <Image
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  width={120}
                  height={120}
                />
              </div>
              <p className="text-xl capitalize">{weather.description}</p>
            </div>
          </div>
        )}

        {/* Прогноз на 5 дней */}
        {forecast && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Прогноз на 5 дней</h3>
            {forecastLoading ? (
              <p className="text-center text-gray-700">Загрузка прогноза...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {forecast.forecasts.map((day, index) => (
                  <div key={index} className="bg-white/30 backdrop-blur-sm p-4 rounded-xl text-center">
                    <p className="font-semibold text-gray-800 mb-2">{formatDate(day.date)}</p>
                    <div className="flex justify-center mb-2">
                      <Image
                        src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                        alt={day.description}
                        width={50}
                        height={50}
                      />
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-1">{Math.round(day.temperature)}°C</p>
                    <p className="text-sm text-gray-600 capitalize">{day.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  
  );
    
}