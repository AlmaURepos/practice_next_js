from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# --- Конфигурация приложения ---
app = FastAPI()

# --- Настройка CORS ---
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic модели (структура данных) ---
class PostBase(BaseModel):
    slug: str
    title: str

class PostFull(PostBase):
    content: str
    author: str
    date: str
    category: str

# --- База данных в памяти (простой список Python) ---
fake_posts_db: List[PostFull] = [
    PostFull(
        slug="first-post",
        title="Мой первый пост",
        content="Это содержимое моего первого поста. Здесь много интересного текста о веб-разработке!", 
        author="Иванов Иван",
        date="2025-06-30",
        category="Веб разработка"
    ),
    PostFull(
        slug="fastapi-and-nextjs",
        title="FastAPI + Next.js = ❤️",
        content="Сочетание FastAPI для бэкенда и Next.js для фронтенда - это мощный и современный стек. Асинхронность FastAPI и рендеринг Next.js творят чудеса.", 
        author="Петров Петр",
        date="2025-05-30",
        category="Бэкенд разработка"
    ),
    PostFull(
        slug="why-i-love-python",
        title="Почему я люблю Python",
        content="Python - это язык с простым синтаксисом и огромной экосистемой. Он отлично подходит для бэкенда, анализа данных и многого другого.", 
        author="Сергеев Сергей",
        date="2025-07-30",
        category="питон разработка"
    )
]

# --- Эндпоинты API ---

# Отдает краткий список всех постов (slug и title)
@app.get("/api/posts", response_model=List[PostBase])
async def get_all_posts():
    return fake_posts_db

# Отдает полную информацию о конкретном посте по его slug
@app.get("/api/posts/{slug}", response_model=PostFull)
async def get_post_by_slug(slug: str):
    for post in fake_posts_db:
        if post.slug == slug:
            return post
    raise HTTPException(status_code=404, detail="Post not found")

@app.get("/")
async def root():
    return {"message": "Blog API is running"}