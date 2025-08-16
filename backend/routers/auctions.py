from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import Auction, Bid, Book, User, AuctionStatus
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class AuctionCreate(BaseModel):
    book_id: int
    starting_price: float
    min_increment: float = 1.0
    duration_hours: int = 24

class AuctionResponse(BaseModel):
    id: int
    book_id: int
    starting_price: float
    current_price: float
    min_increment: float
    end_time: datetime
    status: AuctionStatus
    winner_id: int = None

class BidCreate(BaseModel):
    amount: float

class BidResponse(BaseModel):
    id: int
    auction_id: int
    bidder_id: int
    amount: float
    created_at: datetime

@router.post("/", response_model=AuctionResponse)
async def create_auction(
    auction: AuctionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # verify book ownership
    book = db.query(Book).filter(Book.id == auction.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="not authorized to auction this book")
    
    # create auction
    end_time = datetime.utcnow() + timedelta(hours=auction.duration_hours)
    db_auction = Auction(
        book_id=auction.book_id,
        creator_id=current_user.id,
        starting_price=auction.starting_price,
        current_price=auction.starting_price,
        min_increment=auction.min_increment,
        end_time=end_time
    )
    
    db.add(db_auction)
    db.commit()
    db.refresh(db_auction)
    return db_auction

@router.get("/", response_model=List[AuctionResponse])
async def get_active_auctions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    auctions = db.query(Auction).filter(
        Auction.status == AuctionStatus.ACTIVE,
        Auction.end_time > datetime.utcnow()
    ).offset(skip).limit(limit).all()
    return auctions

@router.get("/{auction_id}", response_model=AuctionResponse)
async def get_auction(auction_id: int, db: Session = Depends(get_db)):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="auction not found")
    return auction

@router.post("/{auction_id}/bid", response_model=BidResponse)
async def place_bid(
    auction_id: int,
    bid: BidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="auction not found")
    
    if auction.status != AuctionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="auction not active")
    
    if auction.end_time <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="auction has ended")
    
    if auction.creator_id == current_user.id:
        raise HTTPException(status_code=400, detail="cannot bid on your own auction")
    
    if bid.amount < auction.current_price + auction.min_increment:
        raise HTTPException(
            status_code=400, 
            detail=f"bid must be at least {auction.current_price + auction.min_increment}"
        )
    
    # create bid
    db_bid = Bid(
        auction_id=auction_id,
        bidder_id=current_user.id,
        amount=bid.amount
    )
    
    # update auction current price
    auction.current_price = bid.amount
    
    db.add(db_bid)
    db.commit()
    db.refresh(db_bid)
    
    return db_bid

@router.get("/{auction_id}/bids", response_model=List[BidResponse])
async def get_auction_bids(auction_id: int, db: Session = Depends(get_db)):
    bids = db.query(Bid).filter(Bid.auction_id == auction_id).order_by(Bid.created_at.desc()).all()
    return bids
