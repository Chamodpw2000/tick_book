# Step 2: Reserve Inventory - Detailed Breakdown

## Overview

**Step 2: Reserve Inventory** is called after Event Validation succeeds. It reserves/holds tickets for the user temporarily while they complete payment.

---

## Request Flow Diagram

```
Step Functions State Machine
    ↓
Lambda Function: reserveInventory
    ↓
HTTP POST Request
    ↓
Inventory Service Endpoint
    ↓
Create Inventory Hold in Database
    ↓
Return hold details back to Lambda
    ↓
Lambda returns to Step Functions
    ↓
Step Functions stores result & moves to Step 3
```

---

## Step 2: Reserve Inventory - Lambda Function

```javascript
// lambda/reserveInventory.js
exports.handler = async (event) => {
  const { eventId, userId, items } = event;
  
  try {
    // Step Functions passes these values:
    // eventId: 123
    // userId: 789
    // items: [{ ticketTypeId: 456, quantity: 2 }, { ticketTypeId: 457, quantity: 1 }]
    
    console.log(`📦 Reserving tickets for user ${userId}`);
    
    const response = await fetch(
      `${process.env.INVENTORY_SERVICE_URL}/inventory/holds`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,        // Which event?
          userId,         // Who is booking?
          items,          // Multiple ticket types in one booking
          holdExpiryMinutes: 15  // Hold expires in 15 minutes
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Inventory reservation failed: ${data.message}`);
    }
    
    console.log(`✓ Inventory reserved - Holds: ${data.holds?.length ?? 0}`);
    
    // Return data back to Step Functions
    return {
      expiresAt: data.expiresAt,
      holds: data.holds,
      holdIds: Array.isArray(data.holds) ? data.holds.map(h => h.holdId) : []
    };
    
  } catch (error) {
    throw new Error(`[Step 2] ${error.message}`);
  }
};
```

---

## What Happens in the Database

### BEFORE Reserve Inventory Call

**EventInventory Table:**
```
┌─────┬─────────┬──────────────┬───────────────────┬──────────────┐──────────────┐
│ id  │ eventId │ ticketTypeId │ totalQuantity     │ availableQty │ reservedQty  │
├─────┼─────────┼──────────────┼───────────────────┼──────────────┤──────────────┤
│ 1   │ 123     │ 456          │ 100               │ 100          │ 0            │
└─────┴─────────┴──────────────┴───────────────────┴──────────────┘──────────────┘

Example:
- Event 123: Concert X
- Ticket Type 456: VIP tickets
- 100 total VIP tickets in inventory
- All 100 are still available
- None are reserved yet
```

### AFTER Reserve Inventory Call (Create Hold)

**InventoryHold Table (NEW RECORD CREATED):**
```
┌─────┬──────────────┬─────────┬──────────────┬───────────────┬──────────┬────────┐
│ id  │ inventoryId  │ eventId │ ticketTypeId │ bookingId     │ userId   │ qty    │
├─────┼──────────────┼─────────┼──────────────┼───────────────┼──────────┼────────┤
│ 1   │ InventId_1   │ 123     │ 456          │ NULL (yet)    │ 789      │ 2      │
└─────┴──────────────┴─────────┴──────────────┴───────────────┴──────────┴────────┘

Additional columns:
┌──────────────┬─────────────┬──────────────────────────┬─────────────────┐
│ status       │ id          │ expiresAt                │ createdAt       │
├──────────────┼─────────────┼──────────────────────────┼─────────────────┤
│ "ACTIVE"     │ 1           │ 2026-04-11 15:45:00 UTC  │ 2026-04-11 ...  │
└──────────────┴─────────────┴──────────────────────────┴─────────────────┘
```

**EventInventory Table (UPDATED):**
```
┌─────┬─────────┬──────────────┬───────────────────┬──────────────┬─────────────┐
│ id  │ eventId │ ticketTypeId │ totalQuantity     │ availableQty │ reservedQty │
├─────┼─────────┼──────────────┼───────────────────┼──────────────┼─────────────┤
│ 1   │ 123     │ 456          │ 100               │ 98           │ 2           │
└─────┴─────────┴──────────────┴───────────────────┴──────────────┴─────────────┘

Changes:
- availableQuantity: 100 → 98 (2 tickets reserved)
- reservedQuantity: 0 → 2 (2 tickets now reserved)
- totalQuantity: 100 (unchanged - still 100 total)

Formula: availableQuantity = totalQuantity - reservedQuantity
         98 = 100 - 2
```

---

## Complete Data Flow in Step Functions

### Input to Step 2

```json
{
  "userId": 789,
  "eventId": 123,
  "items": [
    { "ticketTypeId": 456, "quantity": 2 },
    { "ticketTypeId": 457, "quantity": 1 }
  ],
  "paymentMethod": "credit_card",
  "paymentMethodId": "pm_test_visa",
  "currency": "USD",
  "timestamp": "2026-04-11T15:30:00Z"
}
```

### Lambda reserveInventory Extracts

```javascript
const { eventId, userId, items } = event;
// eventId: 123
// userId: 789
// items: [{ ticketTypeId: 456, quantity: 2 }, { ticketTypeId: 457, quantity: 1 }]
```

### Lambda Makes HTTP Request

```http
POST /inventory/holds HTTP/1.1
Host: inventory-service:3004
Content-Type: application/json

{
  "eventId": 123,
  "userId": 789,
  "items": [
    { "ticketTypeId": 456, "quantity": 2 },
    { "ticketTypeId": 457, "quantity": 1 }
  ],
  "holdExpiryMinutes": 15
}
```

### Inventory Service Response

```json
{
  "expiresAt": "2026-04-11T15:45:00.000Z",
  "holds": [
    {
      "holdId": 1,
      "ticketTypeId": 456,
      "quantity": 2,
      "status": "ACTIVE",
      "expiresAt": "2026-04-11T15:45:00.000Z",
      "inventory": {
        "id": 1,
        "eventId": 123,
        "ticketTypeId": 456,
        "totalQuantity": 100,
        "availableQuantity": 98,
        "reservedQuantity": 2
      }
    },
    {
      "holdId": 2,
      "ticketTypeId": 457,
      "quantity": 1,
      "status": "ACTIVE",
      "expiresAt": "2026-04-11T15:45:00.000Z",
      "inventory": {
        "id": 2,
        "eventId": 123,
        "ticketTypeId": 457,
        "totalQuantity": 50,
        "availableQuantity": 49,
        "reservedQuantity": 1
      }
    }
  ]
}
```

### Lambda Returns to Step Functions

```javascript
return {
  expiresAt: "2026-04-11T15:45:00.000Z",
  holdIds: [1, 2]
};
```

### Step Functions Stores Result

```json
{
  "reserveInventoryResult": {
    "holdId": "HOLD_001",
    "status": "ACTIVE",
    "expiresAt": "2026-04-11T15:45:00Z",
    "totalPrice": 200.00,
    "availableQuantity": 98
  }
}
```

This result is now available for **Step 3 (Process Payment)** to use!

---

## Step 3 Uses This Data

```javascript
// Step 3: Process Payment Lambda uses totalPrice from Step 2
exports.handler = async (event) => {
  const { totalPrice } = event.paymentResult; // ← From Step 2!
  // totalPrice = 200.00
  
  // Use this to charge the payment
  const response = await fetch(`/api/payments/process`, {
    method: 'POST',
    body: JSON.stringify({
      amount: totalPrice,  // 200.00 ← From Step 2 reserve call
      // ... other fields
    })
  });
};
```

---

## What If Something Goes Wrong?

### Scenario: Inventory Out of Stock

```
Step 2 Lambda calls: POST /inventory/holds
  
Inventory Service checks:
  Event 123, Ticket Type 456 has only 50 available
  User wants 2 tickets ✓ (enough)
  Create hold for 2 tickets
  
Response: { success: true, holdId: "HOLD_001", ... }
```

### Scenario: Out of Stock (Fails)

```
Step 2 Lambda calls: POST /inventory/holds
  
Inventory Service checks:
  Event 123, Ticket Type 456 has only 1 available
  User wants 2 tickets ✗ (NOT enough!)
  Cannot create hold
  
Response: { success: false, message: "Out of stock" }
  
Lambda throws error:
  throw new Error(`Inventory reservation failed: Out of stock`)
  
Step Functions Catch Block Triggered:
  "Catch": [{
    "ErrorEquals": ["States.TaskFailed"],
    "Next": "CompensationFailed"  ← Go to failed state
  }]
  
Result: Booking fails immediately (no compensation needed - no hold was created)
```

---

## Hold Expiration Mechanism

### Why 15 Minutes?

```
Timeline:
┌──────────────────────────────────────────────────────────────┐
│ 15:30:00 - User starts checkout                              │
│ 15:30:05 - Step 2 Reserve Inventory (Hold created)           │
│            HOLD_001 status = "ACTIVE"                         │
│            expiresAt = 15:45:00                               │
│                                                               │
│ 15:35:00 - User fills payment details (5 min elapsed)        │
│ 15:40:00 - Step 3 Process Payment (8 min elapsed)            │
│ 15:41:00 - Step 4 Create Booking (11 min elapsed) ✓          │
│           holdId → CONFIRMED (no longer ACTIVE)              │
│           inventoryHold status = "CONFIRMED"                 │
│           tickets are locked to user                         │
│                                                               │
│ BUT: If user abandons at step 3 (payment timeout):           │
│ 15:50:00 - Hold expires (20 min after creation)              │
│            scheduledJob finds: holdId status = "ACTIVE"      │
│            status = "ACTIVE" AND expiresAt < now()           │
│            Auto-release: status = "EXPIRED"                  │
│            availableQuantity restored: 98 → 100              │
│            Tickets available again for other users           │
└──────────────────────────────────────────────────────────────┘
```

### No Manual Cancellation Needed!

```
// Background job runs every minute
SELECT * FROM InventoryHold 
WHERE status = 'ACTIVE' 
AND expiresAt < NOW()

// For each expired hold:
UPDATE InventoryHold SET status = 'EXPIRED' WHERE id = ...
UPDATE EventInventory SET reservedQuantity = reservedQuantity - quantity
```

---

## Database State During Booking Lifecycle

### Timeline with Database Changes

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIME: 15:30:05 - STEP 2: RESERVE INVENTORY                         │
├─────────────────────────────────────────────────────────────────────┤
│ InventoryHold: NEW RECORD                                           │
│   holdId: "HOLD_001"                                                │
│   userId: 789                                                       │
│   quantity: 2                                                       │
│   status: "ACTIVE"                                                  │
│   expiresAt: 15:45:00                                               │
│                                                                     │
│ EventInventory: UPDATED                                             │
│   availableQuantity: 100 → 98                                       │
│   reservedQuantity: 0 → 2                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TIME: 15:30:30 - STEP 3: PROCESS PAYMENT (SUCCESS)                │
├─────────────────────────────────────────────────────────────────────┤
│ Payment Table: NEW RECORD                                           │
│   paymentId: 999                                                    │
│   status: "COMPLETED"                                               │
│   amount: 200.00                                                    │
│                                                                     │
│ InventoryHold: UNCHANGED                                            │
│   status: "ACTIVE" (still - waiting for booking confirmation)       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TIME: 15:31:00 - STEP 4: CREATE BOOKING (SUCCESS)                   │
├─────────────────────────────────────────────────────────────────────┤
│ Booking Table: NEW RECORD                                           │
│   bookingId: 1001                                                   │
│   bookingReference: "BK7RQZK2K9"                                    │
│   status: "CONFIRMED"                                               │
│   paymentStatus: "COMPLETED"                                        │
│                                                                     │
│ InventoryHold: UPDATED                                              │
│   status: "CONFIRMED" ← Changed from ACTIVE!                        │
│   bookingId: 1001 ← Linked to booking                               │
│   Still reserved: 2 tickets not released                            │
│                                                                     │
│ EventInventory: UNCHANGED                                           │
│   availableQuantity: 98 (still)                                     │
│   reservedQuantity: 2 (still)                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TIME: 15:31:30 - STEP 5: GENERATE TICKETS (SUCCESS)                 │
├─────────────────────────────────────────────────────────────────────┤
│ Ticket Table: NEW RECORDS (qty 2)                                   │
│   ticketId: 5001                                                    │
│   ticketCode: "BK7RQZK2K9-01" ← QR code for entry                   │
│   status: "ISSUED"                                                  │
│                                                                     │
│   ticketId: 5002                                                    │
│   ticketCode: "BK7RQZK2K9-02" ← QR code for entry                   │
│   status: "ISSUED"                                                  │
│                                                                     │
│ InventoryHold: UNCHANGED                                            │
│   status: "CONFIRMED" (still)                                       │
└─────────────────────────────────────────────────────────────────────┘

                           ✅ BOOKING COMPLETE
                
  Tickets are now issued and user can enter the event!
```

---

## Sample Table Changes (Bookings + Payments)

These are **example row snapshots** (before/after) for the tables that typically change in later steps of the saga.

Note: in this repo’s Prisma schema, `payment_service` has a required `bookingId`, so a payment row is usually recorded only once there is a booking identifier available (either by creating a booking first, or by generating/assigning an ID that Step 3 can reference).

### Booking Table (booking_service)

#### BEFORE Step 4 (Create Booking)

**booking table:** (no record yet for this checkout)
```
┌────┬─────────┬──────────┬───────────────────┬─────────┬──────────────┬──────────┬────────────────┬─────────────────────┐
│ id │ user_id │ event_id │ booking_reference │ status  │ total_amount │ currency │ payment_status │ created_at          │
├────┼─────────┼──────────┼───────────────────┼─────────┼──────────────┼──────────┼────────────────┼─────────────────────┤
│ —  │ —       │ —        │ —                 │ —       │ —            │ —        │ —              │ —                   │
└────┴─────────┴──────────┴───────────────────┴─────────┴──────────────┴──────────┴────────────────┴─────────────────────┘
```

#### AFTER Step 4 (Create Booking)

**booking table:** (NEW RECORD CREATED)
```
┌──────┬─────────┬──────────┬───────────────────┬───────────┬──────────────┬──────────┬────────────────┬─────────────────────┐
│ id   │ user_id │ event_id │ booking_reference │ status    │ total_amount │ currency │ payment_status │ created_at          │
├──────┼─────────┼──────────┼───────────────────┼───────────┼──────────────┼──────────┼────────────────┼─────────────────────┤
│ 1001 │ 789     │ 123      │ BK7RQZK2K9        │ CONFIRMED │ 200.00       │ USD      │ COMPLETED      │ 2026-04-11 15:31:00 │
└──────┴─────────┴──────────┴───────────────────┴───────────┴──────────────┴──────────┴────────────────┴─────────────────────┘

Changes:
- New booking is created and becomes the source-of-truth for booking state
- `payment_status` reflects the outcome of the payment step
```

### Payment Table (payment_service)

#### BEFORE Step 3 (Process Payment)

**Payment table:** (no payment recorded yet for this booking)
```
┌────┬───────────┬────────┬────────┬────────┬──────────┬──────────────┬──────────────┬───────────────────┬─────────┬─────────────────────┐
│ id │ bookingId │ userId │ eventId│ amount │ currency │ paymentMethod │ providerName │ providerReference │ status  │ createdAt           │
├────┼───────────┼────────┼────────┼────────┼──────────┼──────────────┼──────────────┼───────────────────┼─────────┼─────────────────────┤
│ —  │ —         │ —      │ —      │ —      │ —        │ —            │ —            │ —                 │ —       │ —                   │
└────┴───────────┴────────┴────────┴────────┴──────────┴──────────────┴──────────────┴───────────────────┴─────────┴─────────────────────┘
```

#### AFTER Step 3 (Process Payment - SUCCESS)

**Payment table:** (NEW RECORD CREATED)
```
┌─────┬───────────┬────────┬────────┬────────┬──────────┬──────────────┬──────────────┬───────────────────┬───────────┬─────────────────────┐
│ id  │ bookingId │ userId │ eventId│ amount │ currency │ paymentMethod │ providerName │ providerReference │ status    │ createdAt           │
├─────┼───────────┼────────┼────────┼────────┼──────────┼──────────────┼──────────────┼───────────────────┼───────────┼─────────────────────┤
│ 999 │ 1001      │ 789    │ 123    │ 200.00 │ USD      │ credit_card  │ stripe       │ pi_3P...           │ COMPLETED │ 2026-04-11 15:30:30 │
└─────┴───────────┴────────┴────────┴────────┴──────────┴──────────────┴──────────────┴───────────────────┴───────────┴─────────────────────┘

Changes:
- Payment is tied to the booking via `bookingId`
- `providerReference` stores the external provider’s reference (if applicable)
```

---

## If Payment Fails (Compensation)

```
┌─────────────────────────────────────────────────────────────────────┐
│ TIME: 15:30:05 - STEP 2: RESERVE INVENTORY (SUCCESS)                │
├─────────────────────────────────────────────────────────────────────┤
│ InventoryHold: CREATED                                              │
│   holdId: "HOLD_001"                                                │
│   status: "ACTIVE"                                                  │
│                                                                     │
│ EventInventory: UPDATED                                             │
│   availableQuantity: 100 → 98                                       │
│   reservedQuantity: 0 → 2                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TIME: 15:30:30 - STEP 3: PROCESS PAYMENT (FAILED ❌)               │
├─────────────────────────────────────────────────────────────────────┤
│ Error: "Card Declined"                                              │
│ Step Functions Catch Block Triggered                                │
│ → Next State: Compensation_ReleaseInventory                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ COMPENSATION: RELEASE INVENTORY HOLD                                │
├─────────────────────────────────────────────────────────────────────┤
│ Compensation Lambda calls:                                          │
│   PATCH /inventory/holds/:holdId/release                            │
│                                                                     │
│ InventoryHold: UPDATED                                              │
│   holdId: "HOLD_001"                                                │
│   status: "ACTIVE" → "RELEASED" ← Changed!                          │
│                                                                     │
│ EventInventory: UPDATED                                             │
│   availableQuantity: 98 → 100 ✓ Restored!                           │
│   reservedQuantity: 2 → 0 ✓ Restored!                               │
│                                                                     │
│ Result: Tickets back in inventory for other users                   │
└─────────────────────────────────────────────────────────────────────┘

      🔄 SAGA ROLLED BACK - System returned to initial state
```

---

## Database Tables Summary

### EventInventory Table
```sql
CREATE TABLE event_inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  eventId INT NOT NULL,
  ticketTypeId INT NOT NULL,
  totalQuantity INT NOT NULL,          -- 100 (never changes)
  availableQuantity INT NOT NULL,      -- 100 - reservedQuantity
  reservedQuantity INT DEFAULT 0,      -- How many on hold
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(eventId, ticketTypeId),
  INDEX(eventId),
  INDEX(ticketTypeId)
);
```

### InventoryHold Table
```sql
CREATE TABLE inventory_hold (
  id INT PRIMARY KEY AUTO_INCREMENT,
  holdId VARCHAR(50) UNIQUE NOT NULL,  -- "HOLD_001"
  inventoryId INT NOT NULL,            -- FK to EventInventory
  eventId INT NOT NULL,
  ticketTypeId INT NOT NULL,
  bookingId INT,                       -- NULL until Step 4
  userId INT NOT NULL,
  quantity INT NOT NULL,               -- How many reserved
  status ENUM('ACTIVE', 'CONFIRMED', 'EXPIRED', 'RELEASED', 'USED'),
  expiresAt TIMESTAMP,                 -- 15 min from creation
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (inventoryId) REFERENCES event_inventory(id) ON DELETE CASCADE,
  INDEX(inventoryId),
  INDEX(eventId),
  INDEX(userId),
  INDEX(status),
  INDEX(expiresAt)
);
```

### Booking Table (booking_service)
```sql
CREATE TABLE booking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  booking_reference VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('PENDING','CONFIRMED','FAILED','CANCELLED') NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payment Table (payment_service)
```sql
CREATE TABLE Payment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bookingId INT NOT NULL,
  userId INT NOT NULL,
  eventId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(255) NOT NULL,
  paymentMethod VARCHAR(255) NOT NULL,
  providerName VARCHAR(255) NOT NULL,
  providerReference VARCHAR(255),
  status VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

---

## Key Points

✅ **Reserve = Create Hold Record** - Not actual ticket allocation yet  
✅ **Temporary Lock** - Hold expires automatically in 15 minutes  
✅ **Database Updated** - reservedQuantity and availableQuantity change  
✅ **Compensation Ready** - If payment fails, hold is released automatically  
✅ **Scaled Search** - Multiple users can reserve different tickets simultaneously  
✅ **Cost Control** - Showing available quantity prevents overbooking  

---

## Real-World Example

```
Concert Event XYZ has 100 VIP tickets

12:00:00 - User A starts checkout: Reserve 2 tickets
           Hold: HOLD_A001 (2 tickets)
           Inventory: available=98, reserved=2

12:01:00 - User B starts checkout: Reserve 5 tickets
           Hold: HOLD_B001 (5 tickets)
           Inventory: available=93, reserved=7

12:02:00 - User C starts checkout: Reserve 50 tickets
           Hold: HOLD_C001 (50 tickets)
           Inventory: available=43, reserved=57

12:05:00 - User A completes payment
           Booking created, HOLD_A001 → CONFIRMED
           Inventory still: available=43, reserved=57
           (CONFIRMED holds still count as "reserved")

12:16:00 - User B's hold expires (no payment)
           HOLD_B001 → EXPIRED
           Inventory: available=48, reserved=52
           (5 tickets released back)

12:03:00 - User C's payment declined
           HOLD_C001 → RELEASED (compensated)
           Inventory: available=98, reserved=2
           (50 tickets released back)

Result: 47 tickets still available:
  - 2 reserved by User A (confirmed booking)
  - 45 available for new buyers
```

