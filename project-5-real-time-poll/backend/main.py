import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import uuid
from datetime import datetime

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

# --- Файл для сохранения данных ---
POLLS_FILE = "polls.json"

# --- "База данных" в памяти ---
polls = {}

# --- Pydantic модели ---
class PollOption(BaseModel):
    label: str
    votes: int

class PollData(BaseModel):
    id: str
    question: str
    options: Dict[str, PollOption]
    created_at: str

class CreatePollRequest(BaseModel):
    question: str
    options: List[str]

class PollResponse(BaseModel):
    id: str
    question: str
    options: Dict[str, Dict[str, int | str]]

# --- Функции для работы с файлом ---
def load_polls_from_file():
    """Загружает опросы из файла при запуске сервера."""
    global polls
    if os.path.exists(POLLS_FILE):
        try:
            with open(POLLS_FILE, 'r', encoding='utf-8') as f:
                polls = json.load(f)
        except Exception as e:
            print(f"Ошибка при загрузке файла опросов: {e}")
            polls = {}
    else:
        # Создаем дефолтный опрос, если файл не существует
        default_poll_id = str(uuid.uuid4())
        polls = {
            default_poll_id: {
                "id": default_poll_id,
                "question": "Ваш любимый фреймворк для бэкенда?",
                "options": {
                    "fastapi": {"label": "FastAPI", "votes": 0},
                    "django": {"label": "Django", "votes": 0},
                    "flask": {"label": "Flask", "votes": 0},
                    "nodejs": {"label": "Node.js (Express)", "votes": 0}
                },
                "created_at": datetime.now().isoformat()
            }
        }
        save_polls_to_file()

def save_polls_to_file():
    """Сохраняет опросы в файл."""
    try:
        with open(POLLS_FILE, 'w', encoding='utf-8') as f:
            json.dump(polls, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Ошибка при сохранении файла опросов: {e}")

# --- Загружаем данные при запуске ---
load_polls_from_file()

# --- Эндпоинты API ---

@app.get("/api/polls", response_model=Dict[str, PollResponse])
async def get_all_polls():
    """Возвращает все опросы."""
    return polls

@app.get("/api/poll/{poll_id}", response_model=PollResponse)
async def get_poll_data(poll_id: str):
    """Возвращает конкретный опрос по ID."""
    if poll_id not in polls:
        raise HTTPException(status_code=404, detail="Poll not found")
    return polls[poll_id]

@app.post("/api/poll/create", response_model=PollResponse)
async def create_poll(poll_request: CreatePollRequest):
    """Создает новый опрос."""
    if len(poll_request.options) < 2:
        raise HTTPException(status_code=400, detail="At least 2 options are required")
    
    poll_id = str(uuid.uuid4())
    
    # Создаем опции из списка строк
    options = {}
    for i, option_text in enumerate(poll_request.options):
        option_key = f"option_{i}"
        options[option_key] = {"label": option_text, "votes": 0}
    
    new_poll = {
        "id": poll_id,
        "question": poll_request.question,
        "options": options,
        "created_at": datetime.now().isoformat()
    }
    
    polls[poll_id] = new_poll
    save_polls_to_file()
    
    return new_poll

@app.post("/api/poll/{poll_id}/vote/{option_key}", response_model=PollResponse)
async def cast_vote(poll_id: str, option_key: str):
    """Принимает голос за один из вариантов конкретного опроса."""
    if poll_id not in polls:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    poll = polls[poll_id]
    if option_key not in poll["options"]:
        raise HTTPException(status_code=404, detail="Option not found")

    poll["options"][option_key]["votes"] += 1
    save_polls_to_file()
    return poll

# --- Обратная совместимость со старым API ---
@app.get("/api/poll", response_model=PollResponse)
async def get_default_poll():
    """Возвращает первый доступный опрос (для обратной совместимости)."""
    if not polls:
        raise HTTPException(status_code=404, detail="No polls available")
    
    # Возвращаем первый опрос
    first_poll_id = list(polls.keys())[0]
    return polls[first_poll_id]

@app.post("/api/poll/vote/{option_key}", response_model=PollResponse)
async def cast_vote_default(option_key: str):
    """Принимает голос за первый доступный опрос (для обратной совместимости)."""
    if not polls:
        raise HTTPException(status_code=404, detail="No polls available")
    
    first_poll_id = list(polls.keys())[0]
    return await cast_vote(first_poll_id, option_key)