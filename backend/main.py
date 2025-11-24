from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from dotenv import load_dotenv
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.charity import router as charity_router
from routers.books import router as books_router
from routers.payments import router as payments_router
from database import engine, Base

load_dotenv()

# tables created via Alembic migrations, no need for Base.metadata.create_all()

app = FastAPI(title="readar", version="1.0.0")

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url.path}")
    print(f"Headers: {dict(request.headers)}")
    if request.method == "POST":
        body = await request.body()
        print(f"Body: {body}")
    response = await call_next(request)
    return response

# security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    # allow local dev and deployed hosts (including Render)
    allowed_hosts=["localhost", "127.0.0.1", "*.readar.com", "readar-monorepo.onrender.com", "*.onrender.com", "*.ngrok-free.app", "*.ngrok-free.dev"]
)

app.add_middleware(
    CORSMiddleware,
    # Allow local dev and the hosted frontend on Render (adjust if frontend is hosted elsewhere)
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://*.readar.com", "https://readar-monorepo.onrender.com", "https://readar-monorepo.vercel.app", "https://smudgeless-tagmemic-charlesetta.ngrok-free.dev"],
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
@app.head("/health")
async def health():
    return {"status": "ok"}

@app.head("/")
async def root_head():
    return {}


@app.on_event("startup")
async def create_db_tables_if_missing():
    """Ensure DB tables exist on startup. This is a fallback for deployments
    (e.g., SQLite on Render) where migrations may not have been run yet.
    Prefer running Alembic migrations (`alembic upgrade head`) in production.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created/verified successfully")
    except Exception as e:
        # Log error but don't crash startup so that the app can still surface errors
        print(f"Warning: failed to auto-create tables on startup: {e}")



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
