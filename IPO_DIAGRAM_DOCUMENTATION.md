# CTOMS - IPO (Input-Process-Output) Diagram Documentation

## System Overview
CTOMS (Clothing Tailor Order Management System) is a Laravel-based platform that manages order workflows for tailoring services, including customer management, order processing, measurements, payments, and appointment scheduling.

---

## INPUT PHASE

### 1. **Customer Data**
- **Source**: Customer registration and profile updates
- **Data Elements**:
  - User credentials (email, password)
  - Personal information (name, contact, address)
  - Profile preferences
- **Storage Model**: `User`, `Customer`, `UserProfile`

### 2. **Order Details**
- **Source**: Customer order placement
- **Data Elements**:
  - Selected services (tailoring type, alterations)
  - Measurements (body dimensions, fit preferences)
  - Reference photos (garment images)
  - Delivery/pickup preferences
- **Storage Models**: `Order`, `OrderItem`, `OrderMeasurement`, `OrderPhoto`, `OrderService`

### 3. **Payment Information**
- **Source**: Customer payment submission
- **Data Elements**:
  - Amount to be paid
  - Payment method (card, e-wallet)
  - Transaction reference
- **Storage Model**: `Payment`, `PaymentStatus`
- **External Integration**: PayMongo API

### 4. **Shop Configuration**
- **Source**: Shop owner setup and management
- **Data Elements**:
  - Operating hours and schedule
  - Available services and pricing
  - Measurement attributes and standards
  - Shop policies and documents
- **Storage Models**: `TailoringShop`, `ShopSchedule`, `Service`, `ServiceCategory`, `ShopAttribute`

### 5. **Admin Actions**
- **Source**: Shop staff and administrators
- **Data Elements**:
  - Order status updates
  - Customer notes
  - Rework requests and updates
- **Storage Models**: `OrderStatus`, `OrderLog`, `OrderRework`

---

## PROCESS PHASE

### 1. **Authentication & Authorization** (Sanctum)
- Validates user identity via API tokens
- Enforces role-based access control
- Ensures customers access only their orders
- Ensures shop owners access only their shop data
- Output: Authenticated user context

### 2. **Order Management**
- Creates new orders with validation
- Updates order details and status
- Tracks order lifecycle (pending → confirmed → processing → completed)
- Links orders to customers and shops
- Output: Validated order records

### 3. **Measurement Capture & Storage**
- Receives customer measurements (height, width, fit preferences)
- Stores with metadata (unit, date, reference garment)
- Validates against shop standards
- Output: Standardized measurement data

### 4. **Payment Processing**
- Routes payment requests to PayMongo gateway
- Handles payment confirmation/failure
- Updates order payment status
- Generates transaction records
- Output: Payment confirmation or error response

### 5. **Notification System**
- Sends order confirmations to customers
- Alerts shop when new order received
- Notifies of status changes
- Dispatches appointment reminders
- Output: Notification logs and delivery status

### 6. **Appointment Scheduling**
- Checks shop availability
- Validates appointment time slots
- Prevents double-booking
- Stores appointment details
- Output: Scheduled appointment record

### 7. **Order Status Workflow**
- Manages state transitions (created → accepted → in-progress → completed)
- Validates workflow rules
- Triggers notifications on state changes
- Logs status history
- Output: Updated order status and audit trail

---

## OUTPUT PHASE

### 1. **Order Confirmation**
- **Delivery Method**: API response + Email notification
- **Contents**: Order ID, customer details, service summary, estimated delivery date
- **Recipient**: Customer
- **Model**: Response JSON with `Order` data

### 2. **Payment Receipt**
- **Delivery Method**: API response + Email notification
- **Contents**: Transaction ID, amount, date, payment method
- **Recipient**: Customer
- **Model**: Response JSON with `Payment` data

### 3. **Notifications**
- **Delivery Method**: Email, SMS (future), Push notifications
- **Types**: Order received, status update, appointment reminder, ready-for-pickup
- **Recipients**: Customers, Shop owners
- **Model**: `OrderUpdatedNotification`, `NewOrderReceivedNotification`

### 4. **Available Time Slots**
- **Delivery Method**: API response (JSON)
- **Contents**: Selectable appointment dates and times
- **Recipient**: Customer
- **Endpoint**: `/api/shops/{shop}/availability`

### 5. **Order Status Report**
- **Delivery Method**: API response + Dashboard display
- **Contents**: Current status, history log, timeline, rework details (if any)
- **Recipient**: Customer, Shop owner
- **Models**: `Order`, `OrderLog`, `OrderStatus`, `OrderRework`

### 6. **Customer Dashboard**
- **Delivery Method**: Web interface (React/Inertia.js frontend)
- **Contents**: Order list, order details, measurement history, appointment calendar
- **Recipient**: Authenticated customer
- **Integration**: Frontend fetches from API, displays aggregated data

---

## Data Flow Summary

```
Customer Input
    ↓
Authentication (B1)
    ↓
Order Management (B2) → Measurement Capture (B3)
    ↓
Payment Processing (B4) → Notification System (B5)
    ↓
Order Status Workflow (B7)
    ↓
Appointment Scheduling (B6) → Notifications (B5)
    ↓
Outputs (C1-C6) → Customer Dashboard (C6)
```

---

## Key Technologies

| Component | Technology |
|-----------|-----------|
| **Backend Framework** | Laravel 11 |
| **API Authentication** | Sanctum (token-based) |
| **Payment Gateway** | PayMongo |
| **Notification Service** | Laravel Mail, Queue |
| **Frontend** | React + Inertia.js |
| **Database** | MySQL/PostgreSQL |
| **File Storage** | Cloud Storage (S3-compatible) |

---

## Research Classification

**System Type**: Business Process Management (BPM) System  
**Application Domain**: Service Industry (Tailoring/Fashion Alterations)  
**Architecture**: RESTful API with SPA Frontend  
**Scale**: Multi-shop, Multi-customer B2C/B2B

---

## Conclusion

The CTOMS system follows a standard IPO model where:
- **Inputs** are validated customer and administrative data
- **Processes** enforce business rules, security, and workflow management
- **Outputs** provide actionable information to stakeholders (customers, shop owners, admins)

This design ensures data integrity, proper authentication, clear audit trails, and seamless user experience across all stakeholder types.
