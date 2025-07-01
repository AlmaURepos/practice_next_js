from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Annotated
from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship
from datetime import datetime, timezone
import uuid
import os

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:3001"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Настройка БД ---
DB_FILE = "microblog.db"
engine = create_engine(f"sqlite:///{DB_FILE}", echo=False)

# --- Модели ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password: str
    posts: List["Post"] = Relationship(back_populates="owner")
    likes: List["Like"] = Relationship(back_populates="user")

class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner_id: int = Field(foreign_key="user.id")
    owner: Optional[User] = Relationship(back_populates="posts")
    likes: List["Like"] = Relationship(back_populates="post")

class Like(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    post_id: int = Field(foreign_key="post.id")
    user: Optional[User] = Relationship(back_populates="likes")
    post: Optional[Post] = Relationship(back_populates="likes")

# --- Pydantic модели для API ---
class PostRead(BaseModel):
    id: int
    text: str
    timestamp: datetime
    owner_id: int
    owner_username: str
    likes_count: int
    liked_by_me: bool = False

class PostCreate(BaseModel):
    text: str

class UserRead(BaseModel):
    id: int
    username: str

# --- Инициализация БД и фейковые пользователи ---
def init_db():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        if not session.exec(select(User)).first():
            session.add_all([
                User(username="user1", password="password1"),
                User(username="user2", password="password2"),
            ])
            session.commit()

init_db()

# --- Аутентификация ---
def get_current_user(authorization: Annotated[str, Header()]) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid scheme")
    token = authorization.split(" ")[1]
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == token)).first()
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
        return user

@app.post("/api/login")
def login(form_data: dict):
    username = form_data.get("username")
    password = form_data.get("password")
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if not user or user.password != password:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect username or password")
        return {"access_token": user.username, "token_type": "bearer", "user": {"id": user.id, "username": user.username}}

# --- Эндпоинты для постов ---
@app.get("/api/posts", response_model=List[PostRead])
def list_posts(authorization: Annotated[str, Header()] = None):
    current_user = None
    if authorization:
        try:
            current_user = get_current_user(authorization)
        except Exception:
            current_user = None
    with Session(engine) as session:
        posts = session.exec(select(Post).order_by(Post.timestamp.desc())).all()
        result = []
        for post in posts:
            likes_count = len(session.exec(select(Like).where(Like.post_id == post.id)).all())
            liked_by_me = False
            if current_user:
                liked_by_me = session.exec(select(Like).where(Like.post_id == post.id, Like.user_id == current_user.id)).first() is not None
            result.append(PostRead(
                id=post.id,
                text=post.text,
                timestamp=post.timestamp,
                owner_id=post.owner_id,
                owner_username=post.owner.username if post.owner else "",
                likes_count=likes_count,
                liked_by_me=liked_by_me
            ))
        return result

@app.post("/api/posts", response_model=PostRead, status_code=201)
def create_post(post_data: PostCreate, current_user: Annotated[User, Depends(get_current_user)]):
    with Session(engine) as session:
        post = Post(
            text=post_data.text,
            owner_id=current_user.id
        )
        session.add(post)
        session.commit()
        session.refresh(post)
        return PostRead(
            id=post.id,
            text=post.text,
            timestamp=post.timestamp,
            owner_id=post.owner_id,
            owner_username=current_user.username,
            likes_count=0,
            liked_by_me=False
        )

@app.delete("/api/posts/{post_id}", status_code=204)
def delete_post(post_id: int, current_user: Annotated[User, Depends(get_current_user)]):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
        if post.owner_id != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to delete this post")
        session.delete(post)
        session.commit()
        return

# --- Эндпоинты для лайков ---
@app.post("/api/posts/{post_id}/like", status_code=201)
def like_post(post_id: int, current_user: Annotated[User, Depends(get_current_user)]):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
        like = session.exec(select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)).first()
        if like:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already liked")
        like = Like(post_id=post_id, user_id=current_user.id)
        session.add(like)
        session.commit()
        return {"message": "Liked"}

@app.delete("/api/posts/{post_id}/like", status_code=204)
def unlike_post(post_id: int, current_user: Annotated[User, Depends(get_current_user)]):
    with Session(engine) as session:
        like = session.exec(select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)).first()
        if not like:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Like not found")
        session.delete(like)
        session.commit()
        return

# --- Эндпоинт для постов пользователя ---
@app.get("/api/users/{username}/posts", response_model=List[PostRead])
def user_posts(username: str, authorization: Annotated[str, Header()] = None):
    current_user = None
    if authorization:
        try:
            current_user = get_current_user(authorization)
        except Exception:
            current_user = None
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        posts = session.exec(select(Post).where(Post.owner_id == user.id).order_by(Post.timestamp.desc())).all()
        result = []
        for post in posts:
            likes_count = len(session.exec(select(Like).where(Like.post_id == post.id)).all())
            liked_by_me = False
            if current_user:
                liked_by_me = session.exec(select(Like).where(Like.post_id == post.id, Like.user_id == current_user.id)).first() is not None
            result.append(PostRead(
                id=post.id,
                text=post.text,
                timestamp=post.timestamp,
                owner_id=post.owner_id,
                owner_username=user.username,
                likes_count=likes_count,
                liked_by_me=liked_by_me
            ))
        return result