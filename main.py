from fastapi import FastAPI
from src.controllers.controller import router as example_router
from fastapi.middleware.cors import CORSMiddleware
from src.db.database import init_db

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()

app.include_router(example_router, tags=["TO-DO"])