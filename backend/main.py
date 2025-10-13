from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from dotenv import load_dotenv
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.charity import router as charity_router
from routers.books import router as books_router
from routers.payments import router as payments_router

load_dotenv()

# tables created via Alembic migrations, no need for Base.metadata.create_all()

app = FastAPI(title="readar", version="1.0.0")

# security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.readar.com"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.readar.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routes
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(books_router, prefix="/api/books", tags=["books"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
app.include_router(charity_router, prefix="/api/charity", tags=["charity"])

@app.get("/")
async def root():
    return {"message": "readar api"}

@app.get("/health")
async def health():
    return {"status": "ok"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
