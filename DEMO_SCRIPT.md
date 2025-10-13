# 🎬 Readar Demo Script - Buyer-Seller Interaction

## Quick Setup (2 minutes)

### 1. Reset Database & Start Servers
```bash
# Terminal 1 - Backend
cd backend
python reset_database.py
python main.py

# Terminal 2 - Frontend  
cd frontend
npm start
```

## 🎭 Demo Flow (3-4 minutes)

### Scene 1: Seller (Alice) Lists a Book
1. **Open Browser 1**: http://localhost:3000
2. **Login as Alice**:
   - Email: `alice@test.com`
   - Password: `password123`
3. **Navigate**: Click "sell/lend" in navbar
4. **Add Book**:
   - Title: "The God of Small Things"
   - Author: "Arundhati Roy"
   - Price: 400
   - Tags: fiction, indian-literature
   - Description: "Excellent condition"
   - Click "Add Book"
5. **Verify**: Check "My Stock" - book appears

### Scene 2: Buyer (Bob) Finds & Reserves Book
1. **Open Browser 2** (Incognito): http://localhost:3000
2. **Login as Bob**:
   - Email: `bob@test.com` 
   - Password: `password123`
3. **Navigate**: Click "buy/borrow" in navbar
4. **Search**: Search for "God of Small Things"
5. **Reserve**: Click "Reserve & Pay" button
6. **Mock Payment**: 
   - Shows realistic payment interface
   - Displays ₹80 advance (20% of ₹400)
   - Click "Pay ₹80"
   - Shows processing animation (3 seconds)
   - Redirects to success page

### Scene 3: Payment Success & Contact Reveal
1. **Bob sees**:
   - ✅ Payment successful message
   - **Alice's contact details revealed**:
     - Name: Alice Smith
     - Email: alice@test.com
     - Phone: +91-9876543210
     - Location: Mumbai, Maharashtra
   - Instructions for next steps

### Scene 4: Seller Gets Notification
1. **Switch to Alice's Browser**
2. **Navigate**: Click "Sales" in navbar
3. **Alice sees**:
   - 🔔 **New notification**: "New reservation for 'The God of Small Things' by Bob Jones"
   - Bob's contact details
   - Reservation status: CONFIRMED  
   - "Mark as Collected" button

### Scene 5: Transaction Completion
1. **Alice clicks**: "Mark as Collected"
2. **System updates**:
   - Book status → SOLD
   - Notification: "Successfully marked as collected"
   - Book disappears from search results

## 🎯 Key Demo Points to Highlight

### ✅ **Contact Privacy Protection**
- Seller contact only revealed AFTER payment
- Prevents spam and ensures commitment

### ✅ **Realistic Payment Flow**
- Professional-looking payment interface
- Advance payment system (20%)
- Loading states and confirmations

### ✅ **Real-time Notifications**
- Seller gets instant notification
- Activity feed shows transaction history
- Auto-refresh functionality

### ✅ **Complete Lifecycle Tracking**
- Book: IN_STOCK → RESERVED → SOLD
- Clear status indicators throughout

### ✅ **User Experience**
- Clean, intuitive interface
- Mobile-friendly design
- Clear next-step instructions

## 📱 Perfect for Screen Recording

This demo shows:
1. **Real marketplace behavior** - Multiple users, realistic interaction
2. **Payment integration** - Professional payment flow (mock but realistic)
3. **Privacy & security** - Contact reveal only after payment
4. **Seller tools** - Dashboard, notifications, transaction management
5. **Complete workflow** - From listing to sale completion

**Total Demo Time**: 3-4 minutes
**Perfect for**: Investor pitch, product demo, user testing

## 🚀 Production Notes

In production, simply:
- Replace mock payment with real Razorpay
- Add email/SMS notifications
- Enable user verification
- Add dispute resolution

The entire architecture is **production-ready**!