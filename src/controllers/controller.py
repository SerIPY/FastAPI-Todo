from datetime import datetime
from typing import List, Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.database import async_session_maker
from src.models.model import Todo

router = APIRouter()

class CreateTodo(BaseModel):
    text: str

class ReadTodo(CreateTodo):
    id: int
    completed: bool
    create_at: datetime
  
class UpdateTodo(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

@router.post(path="/create_todo", summary="Create To-Do", response_model=ReadTodo)
async def create_todo(todo: CreateTodo, session: AsyncSession = Depends(get_session)):
    new_todo = Todo(text=todo.text)
    session.add(new_todo)
    
    await session.commit()
    await session.refresh(new_todo)
    return new_todo

@router.get("/get_todo_for_id", summary="Get To-Do by ID", response_model=ReadTodo)
async def get_todo(id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Todo).where(Todo.id == id))
    todo = result.scalar_one()
    return todo

@router.get(path="/get_all_todo", summary="Get all To-Do", response_model=List[ReadTodo])
async def get_all_to_do(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Todo))
    todos = result.scalars().all()
    return todos

@router.patch(path="/update_todo:id", response_model=ReadTodo)
async def update_todo(id: int, todo: UpdateTodo, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Todo).where(Todo.id == id))
    current_todo = result.scalar_one()

    if todo.text is not None:
         current_todo.text = todo.text
    if todo.completed is not None:
         current_todo.completed = todo.completed

    await session.commit()
    await session.refresh(current_todo)
    return current_todo

@router.delete(path="/delete_todo:id", summary="Delete your TO-DO")
async def delete_todo(id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Todo).where(Todo.id == id))
    todo = result.scalar_one()

    await session.delete(todo)
    await session.commit()
    return {"success": True}

