import json
import uuid
import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import aiofiles

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:3001"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DB_FILE = "data/guestbook.json"

# --- Создаем папку data если её нет ---
os.makedirs("data", exist_ok=True)

# --- Pydantic модели ---
class GuestbookEntry(BaseModel):
    id: str
    name: str
    message: str
    timestamp: datetime

class EntryCreate(BaseModel):
    name: str
    message: str

class EntryUpdate(BaseModel):
    message: str

class PaginatedResponse(BaseModel):
    entries: List[GuestbookEntry]
    total: int
    page: int
    limit: int
    total_pages: int

# --- Вспомогательные функции для работы с файлом ---
async def read_db() -> List[GuestbookEntry]:
    if not os.path.exists(DB_FILE):
        return []
    async with aiofiles.open(DB_FILE, mode='r', encoding='utf-8') as f:
        content = await f.read()
        if not content:
            return []
        data = json.loads(content)
        return [GuestbookEntry(**item) for item in data]

async def write_db(data: List[GuestbookEntry]):
    # Преобразуем объекты Pydantic в словари для сериализации в JSON
    export_data = [item.model_dump(mode='json') for item in data]
    async with aiofiles.open(DB_FILE, mode='w', encoding='utf-8') as f:
        await f.write(json.dumps(export_data, indent=4, ensure_ascii=False))

# --- Эндпоинты API ---
@app.get("/api/entries", response_model=PaginatedResponse)
async def get_entries(
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(10, ge=1, le=100, description="Количество записей на странице")
):
    """Возвращает записи из гостевой книги с пагинацией."""
    entries = await read_db()
    
    # Сортируем записи так, чтобы новые были сверху
    sorted_entries = sorted(entries, key=lambda x: x.timestamp, reverse=True)
    
    total = len(sorted_entries)
    total_pages = (total + limit - 1) // limit  # Округление вверх
    
    # Вычисляем индексы для среза
    start_index = (page - 1) * limit
    end_index = start_index + limit
    
    # Получаем записи для текущей страницы
    page_entries = sorted_entries[start_index:end_index]
    
    return PaginatedResponse(
        entries=page_entries,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@app.post("/api/entries", response_model=GuestbookEntry, status_code=201)
async def create_entry(entry_data: EntryCreate):
    """Добавляет новую запись в гостевую книгу."""
    entries = await read_db()

    new_entry = GuestbookEntry(
        id=str(uuid.uuid4()),
        name=entry_data.name,
        message=entry_data.message,
        timestamp=datetime.now(timezone.utc)
    )

    entries.append(new_entry)
    await write_db(entries)

    return new_entry

@app.delete("/api/entries/{entry_id}")
async def delete_entry(entry_id: str):
    """Удаляет запись по ID."""
    entries = await read_db()
    
    # Ищем запись для удаления
    entry_to_delete = None
    for entry in entries:
        if entry.id == entry_id:
            entry_to_delete = entry
            break
    
    if not entry_to_delete:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    
    # Удаляем запись
    entries.remove(entry_to_delete)
    await write_db(entries)
    
    return {"message": "Запись успешно удалена"}

@app.put("/api/entries/{entry_id}", response_model=GuestbookEntry)
async def update_entry(entry_id: str, entry_data: EntryUpdate):
    """Редактирует сообщение записи по ID."""
    entries = await read_db()
    
    # Ищем запись для редактирования
    for entry in entries:
        if entry.id == entry_id:
            entry.message = entry_data.message
            await write_db(entries)
            return entry
    
    raise HTTPException(status_code=404, detail="Запись не найдена")