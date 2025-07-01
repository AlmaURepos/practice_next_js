from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Annotated, Dict, Optional
import uuid
from datetime import datetime, timedelta, timezone

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:3001"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Фейковые пользователи с ролями ---
FAKE_USERS = {
    "user": {"username": "user", "password": "password", "role": "user"},
    "admin": {"username": "admin", "password": "adminpass", "role": "admin"},
}

# --- Хранилище токенов: token -> {username, created_at} ---
TOKENS: Dict[str, Dict[str, str]] = {}
TOKEN_LIFETIME = timedelta(hours=1)

# --- Модель ответа для токена ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

# --- Зависимость для проверки токена ---
async def token_verifier(authorization: Annotated[str, Header()]):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
        )
    token = authorization.split(" ")[1]
    token_data = TOKENS.get(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    # Проверка времени жизни токена
    created_at = datetime.fromisoformat(token_data["created_at"])
    if datetime.now(timezone.utc) - created_at > TOKEN_LIFETIME:
        # Токен устарел, удаляем
        del TOKENS[token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    return token_data

# --- Зависимость для проверки роли ---
def admin_required(token_data=Depends(token_verifier)):
    if token_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Требуется роль администратора")
    return token_data

# --- Эндпоинты API ---

@app.post("/api/login", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """Проверяет логин/пароль и возвращает токен."""
    user = FAKE_USERS.get(form_data.username)
    if user and form_data.password == user["password"]:
        # Генерируем уникальный токен
        token = str(uuid.uuid4())
        TOKENS[token] = {
            "username": user["username"],
            "role": user["role"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user["role"],
            "username": user["username"]
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.post("/api/logout")
async def logout(authorization: Annotated[str, Header()]):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    token = authorization.split(" ")[1]
    if token in TOKENS:
        del TOKENS[token]
    return {"message": "Вы успешно вышли"}

@app.get("/api/secret-data")
async def get_secret_data(token_data: Annotated[dict, Depends(token_verifier)]):
    """Этот эндпоинт защищен. Доступ возможен только с валидным токеном."""
    return {"message": f"Привет, {token_data['username']}! Секретное сообщение: 42."}

@app.get("/api/admin-data")
async def get_admin_data(token_data: Annotated[dict, Depends(admin_required)]):
    """Только для админа."""
    return {"message": f"Привет, {token_data['username']}! Это данные только для администратора."}