import secrets
import time
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional

app = FastAPI()

# --- Настройка CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- "База данных" в памяти (словарь Python) ---
# Ключ - короткий код, значение - объект с данными ссылки
url_db = {}

# Константа для срока действия ссылок (в днях)
LINK_EXPIRY_DAYS = 30

# --- Pydantic модели ---
class URLCreate(BaseModel):
    long_url: HttpUrl  # Pydantic проверит, что это валидный URL
    custom_code: Optional[str] = None  # Опциональный кастомный код

class URLResponse(BaseModel):
    short_url: str
    clicks: int
    created_at: str

# --- Эндпоинты API ---

@app.post("/api/shorten", response_model=URLResponse)
def create_short_url(url_data: URLCreate, request: Request):
    """Создает короткий код для длинного URL."""
    long_url = str(url_data.long_url)
    
    # Определяем короткий код
    if url_data.custom_code:
        # Если предоставлен кастомный код
        short_code = url_data.custom_code.strip()
        
        # Проверяем, что код не пустой и содержит только буквы, цифры и дефисы
        if not short_code or not short_code.replace('-', '').replace('_', '').isalnum():
            raise HTTPException(status_code=400, detail="Кастомный код должен содержать только буквы, цифры, дефисы и подчеркивания")
        
        # Проверяем, что код не занят
        if short_code in url_db:
            raise HTTPException(status_code=409, detail="Этот код уже занят")
    else:
        # Генерируем случайный безопасный код
        short_code = secrets.token_urlsafe(6)
        # Убедимся, что код уникален
        while short_code in url_db:
            short_code = secrets.token_urlsafe(6)

    # Создаем запись в базе данных с новой структурой
    current_time = datetime.now()
    url_db[short_code] = {
        "long_url": long_url,
        "clicks": 0,
        "created_at": current_time.isoformat()
    }

    # Формируем полный короткий URL для ответа
    base_url = str(request.base_url)
    short_url = f"{base_url}{short_code}"

    return {
        "short_url": short_url,
        "clicks": 0,
        "created_at": current_time.isoformat()
    }

@app.get("/{short_code}")
def redirect_to_long_url(short_code: str):
    """Ищет длинный URL по короткому коду и перенаправляет на него."""
    url_data = url_db.get(short_code)

    if not url_data:
        raise HTTPException(status_code=404, detail="Short URL not found")

    # Проверяем срок действия ссылки
    created_at = datetime.fromisoformat(url_data["created_at"])
    expiry_date = created_at + timedelta(days=LINK_EXPIRY_DAYS)
    
    if datetime.now() > expiry_date:
        # Удаляем просроченную ссылку из базы данных
        del url_db[short_code]
        raise HTTPException(status_code=404, detail="Link has expired")

    # Увеличиваем счетчик кликов
    url_data["clicks"] += 1

    # Выполняем HTTP 307 Temporary Redirect
    return RedirectResponse(url=url_data["long_url"])

@app.get("/api/stats/{short_code}")
def get_url_stats(short_code: str):
    """Возвращает статистику по короткой ссылке."""
    url_data = url_db.get(short_code)

    if not url_data:
        raise HTTPException(status_code=404, detail="Short URL not found")

    # Проверяем срок действия ссылки
    created_at = datetime.fromisoformat(url_data["created_at"])
    expiry_date = created_at + timedelta(days=LINK_EXPIRY_DAYS)
    
    return {
        "short_code": short_code,
        "long_url": url_data["long_url"],
        "clicks": url_data["clicks"],
        "created_at": url_data["created_at"],
        "expires_at": expiry_date.isoformat(),
        "is_expired": datetime.now() > expiry_date
    }