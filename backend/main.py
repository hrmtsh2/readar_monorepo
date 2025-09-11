from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from dotenv import load_dotenv
from routers import auth, users, auctions, reservations, charity, reading_data, books

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
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(books.router, prefix="/api/books", tags=["books"])
# Temporarily commented out until we fix async issues
# app.include_router(auctions.router, prefix="/api/auctions", tags=["auctions"])
# app.include_router(reservations.router, prefix="/api/reservations", tags=["reservations"])
# app.include_router(reading_data.router, prefix="/api/reading", tags=["reading"])
app.include_router(charity.router, prefix="/api/charity", tags=["charity"])

@app.get("/")
async def root():
    return {"message": "readar api"}

@app.get("/health")
async def health():
    return {"status": "ok"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
