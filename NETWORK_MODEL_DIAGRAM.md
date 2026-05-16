# CTOMS-LR Network Model Diagram

## System Architecture Overview

Network model showing all user entities, their relationships, and cloud deployment topology.

```mermaid
graph TB
    subgraph External["🌐 External Users & Clients"]
        C["👥 Customers"]
        T["👤 Tailors/Shop Owners"]
        A["🔐 Admin"]
    end

    subgraph Cloud["☁️ RENDER Cloud Infrastructure"]
        subgraph AppService["🚀 Application Layer"]
            APP["CTOMS-LR Application<br/>Laravel 11 + React/Inertia<br/>Port 8080"]
            WEB["Web Server<br/>Gunicorn/PHP-FPM"]
        end

        subgraph Storage["💾 Data Layer"]
            DB["PostgreSQL Database<br/>Orders, Appointments,<br/>Inventory, Users"]
            CACHE["Redis Cache<br/>Session Management<br/>Queue System"]
        end

        subgraph Assets["📦 Static Assets"]
            CDN["CDN/Static Files<br/>CSS, JS, Images<br/>Vite Build Output"]
        end

        subgraph Queue["⚙️ Background Processing"]
            QUEUE["Job Queue<br/>Email Notifications<br/>Order Updates"]
            WORKER["Queue Workers<br/>Async Tasks"]
        end
    end

    subgraph External_Services["🔗 External Services"]
        EMAIL["📧 Email Service<br/>Order Confirmations<br/>Notifications"]
        AUTH["🔑 Authentication<br/>Email Verification<br/>Password Reset"]
    end

    subgraph LocalDev["💻 Local Development"]
        PHPLOCAL["PHP Development Server<br/>localhost:8000"]
        NODELOCAL["Node Development Server<br/>Vite HMR"]
    end

    %% Customer Connections
    C -->|Browse Shop| APP
    C -->|View Products| CDN
    C -->|Create Order| DB
    C -->|Appointments| DB

    %% Tailor/Shop Owner Connections
    T -->|Manage Shop| APP
    T -->|View Dashboard| WEB
    T -->|Assign Staff| DB
    T -->|Manage Inventory| DB
    T -->|Schedule| DB
    T -->|Analytics| CACHE

    %% Admin Connections
    A -->|Admin Panel| APP
    A -->|User Management| DB
    A -->|Reports| DB
    A -->|System Config| CACHE

    %% Shop Staff Connections
    SS["👔 Shop Staff<br/>Tailors/Stitchers"]
    SS -->|View Assignments| APP
    SS -->|Track Orders| DB
    SS -->|Update Status| DB
    SS -->|View Schedule| DB

    %% Application Internal Flow
    APP -->|Stores Data| DB
    APP -->|Sessions & Temp| CACHE
    APP -->|Serves Assets| CDN
    APP -->|Queue Jobs| QUEUE
    QUEUE -->|Process| WORKER
    WORKER -->|Send Email| EMAIL
    WORKER -->|Update DB| DB

    %% External Services
    DB -->|SSL Connection| Cloud
    APP -->|HTTPS| EMAIL
    AUTH -->|Token Validation| APP
    EMAIL -->|Delivery Status| QUEUE

    %% Development Flow
    T -->|Deploy from Dev| PHPLOCAL
    T -->|Build Assets| NODELOCAL
    PHPLOCAL -->|Sync| APP

    %% Styling
    classDef users fill:#4f46e5,stroke:#312e81,color:#fff,stroke-width:2px
    classDef cloud fill:#06b6d4,stroke:#0e7490,color:#fff,stroke-width:3px
    classDef storage fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px
    classDef service fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px
    classDef dev fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px

    class C,T,A,SS users
    class APP,WEB,CDN,QUEUE,WORKER cloud
    class DB,CACHE storage
    class EMAIL,AUTH service
    class PHPLOCAL,NODELOCAL dev
```

---

## Entity Relationship Model

### User Roles & Permissions

```mermaid
graph LR
    USER["User Base<br/>Authentication"]
    
    USER -->|Role Assignment| ADMIN["Admin<br/>- Full System Access<br/>- User Management<br/>- Reports & Analytics"]
    USER -->|Role Assignment| OWNER["Shop Owner<br/>- Shop Management<br/>- Staff Assignment<br/>- Inventory Control<br/>- Schedule Management"]
    USER -->|Role Assignment| STAFF["Shop Staff<br/>- View Assignments<br/>- Track Orders<br/>- Update Status<br/>- View Schedule"]
    USER -->|No Login| CUSTOMER["Customer<br/>- Browse Products<br/>- Create Orders<br/>- Track Orders<br/>- View Appointments"]

    OWNER -->|Manages| STAFF
    STAFF -->|Assigned To| ORDERS["Orders"]
    CUSTOMER -->|Creates| ORDERS
    OWNER -->|Owns| SHOP["Tailoring Shop"]
    STAFF -->|Works At| SHOP
    SHOP -->|Has| APPOINTMENTS["Appointments"]
    ORDERS -->|Has| APPOINTMENTS

    classDef role fill:#4f46e5,stroke:#312e81,color:#fff
    classDef entity fill:#8b5cf6,stroke:#6d28d9,color:#fff
    
    class ADMIN,OWNER,STAFF,CUSTOMER role
    class ORDERS,SHOP,APPOINTMENTS entity
```

---

## Network Data Flow Diagram

### Request/Response Cycle

```mermaid
sequenceDiagram
    participant User as User/Client<br/>Browser
    participant CDN as CDN<br/>Static Assets
    participant App as Laravel App<br/>Render
    participant DB as PostgreSQL<br/>Database
    participant Queue as Job Queue
    participant Email as Email Service

    User->>App: HTTPS Request
    App->>CDN: Load CSS/JS
    CDN-->>User: Assets Served
    App->>DB: Query Data
    DB-->>App: Data Response
    
    alt Update/Create Operation
        App->>DB: Write Data
        DB-->>App: Confirm
        App->>Queue: Queue Job
        Queue->>Email: Process Notification
        Email-->>User: Notification Sent
    end
    
    App-->>User: JSON/HTML Response
```

---

## Cloud Network Topology

### Render.com Deployment Structure

```mermaid
graph TB
    subgraph RenderCloud["Render.com Cloud Provider"]
        subgraph Region["🌍 Region: US-East"]
            subgraph Service["CTOMS-LR Service"]
                direction LR
                FrontEnd["Frontend<br/>React/Inertia"]
                Backend["Backend<br/>Laravel 11"]
                FrontEnd <-->|HTTP| Backend
            end
            
            subgraph Database["PostgreSQL Instance"]
                PG["Primary DB<br/>Replication Enabled"]
                Backup["Automated Backups<br/>Point-in-Time Recovery"]
            end
            
            subgraph Cache["Redis Cache"]
                RedisNode["Redis Node<br/>Sessions & Cache"]
            end
            
            Backend -->|TCP 5432| Database
            Backend -->|TCP 6379| Cache
            Backend -->|WebSockets| FrontEnd
        end
    end

    subgraph Internet["🌐 Internet"]
        HTTPS["HTTPS/TLS 1.3<br/>Domain: ctomsph.online"]
    end

    subgraph ClientNetwork["Client Networks"]
        Browsers["Web Browsers<br/>Desktop/Mobile"]
    end

    Browsers -->|HTTPS| HTTPS
    HTTPS -->|Route| Service
    
    classDef cloud fill:#06b6d4,stroke:#0e7490,color:#fff,stroke-width:2px
    classDef network fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px
    classDef storage fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px
    
    class RenderCloud,Region,Service,Cache cloud
    class Internet,ClientNetwork,HTTPS network
    class Database storage
```

---

## Entity Interactions by Role

### Customer Journey

```mermaid
graph LR
    Browse["Browse Shop<br/>Products & Services"]
    Create["Create Order<br/>Submit Request"]
    Track["Track Order<br/>Status Updates"]
    Schedule["View Appointment<br/>Schedule Fitting"]
    Receive["Receive Notification<br/>Order Ready"]

    Browse -->|Place Order| Create
    Create -->|Assigned to Staff| Track
    Track -->|Staff Updates| Schedule
    Schedule -->|Completion| Receive
    
    style Browse fill:#4f46e5
    style Create fill:#4f46e5
    style Track fill:#4f46e5
    style Schedule fill:#4f46e5
    style Receive fill:#4f46e5
```

### Shop Owner Dashboard

```mermaid
graph LR
    Dashboard["Dashboard<br/>KPI & Metrics"]
    Staff["Staff Management<br/>Assign/Active"]
    Inventory["Inventory Control<br/>Add/Edit/Stock"]
    Orders["Order Management<br/>Review/Assign"]
    Schedule["Schedule Master<br/>Add Exceptions"]
    Analytics["Analytics<br/>Revenue/Orders"]

    Dashboard --> Staff
    Dashboard --> Inventory
    Dashboard --> Orders
    Dashboard --> Schedule
    Dashboard --> Analytics
    
    style Dashboard fill:#f59e0b
    style Staff fill:#f59e0b
    style Inventory fill:#f59e0b
    style Orders fill:#f59e0b
    style Schedule fill:#f59e0b
    style Analytics fill:#f59e0b
```

### Shop Staff Workflow

```mermaid
graph LR
    Login["Login<br/>Auth Token"]
    Dashboard["Staff Dashboard<br/>Assigned Work"]
    Orders["View Orders<br/>Assigned Only"]
    Schedule["View Schedule<br/>My Appointments"]
    Update["Update Status<br/>Mark Complete"]

    Login --> Dashboard
    Dashboard --> Orders
    Dashboard --> Schedule
    Orders --> Update
    Schedule --> Update
    
    style Login fill:#10b981
    style Dashboard fill:#10b981
    style Orders fill:#10b981
    style Schedule fill:#10b981
    style Update fill:#10b981
```

---

## Database Network Model

### Entity-Relationship Network

```mermaid
graph TB
    Users["users<br/>id, email, role"]
    
    Users -->|1:N| UserRoles["user_roles<br/>user_id, role"]
    Users -->|N:N| Shops["tailoring_shops<br/>id, name"]
    
    Shops -->|1:N| ShopStaff["shop_staff<br/>user_id, shop_id<br/>is_active, joined_date"]
    ShopStaff -->|N:1| Users
    
    Shops -->|1:N| Orders["orders<br/>id, order_number<br/>status, total_price"]
    Orders -->|N:N| OrderAssign["order_assignments<br/>user_id, order_id"]
    OrderAssign -->|N:1| Users
    
    Orders -->|1:N| OrderItems["order_items<br/>id, quantity, price"]
    Orders -->|1:N| Appointments["appointments<br/>id, date, time"]
    
    Shops -->|1:N| Inventory["inventory<br/>id, quantity, price"]
    Shops -->|1:N| ShopSchedule["shop_schedules<br/>day, open_time, close_time"]
    
    Users -->|1:N| Customers["customers<br/>id, name, contact"]
    Customers -->|1:N| Orders
    
    classDef entity fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef pivot fill:#ec4899,stroke:#be185d,color:#fff
    
    class Orders,Users,Shops,Appointments,ShopSchedule,Inventory,Customers entity
    class UserRoles,ShopStaff,OrderAssign,OrderItems pivot
```

---

## Network Security & Communication

### HTTPS/TLS Encryption

```mermaid
graph LR
    Client["Client Browser"]
    LB["Load Balancer<br/>SSL/TLS Termination"]
    App["CTOMS-LR App<br/>Port 8080"]
    DB["PostgreSQL<br/>SSL Connection"]

    Client -->|HTTPS/TLS 1.3| LB
    LB -->|HTTP/2<br/>Internal| App
    App -->|SSL<br/>Connection| DB

    Client -->|"Encrypted:<br/>- Credentials<br/>- Session Token<br/>- Order Data"| LB

    classDef secure fill:#10b981,stroke:#059669,color:#fff
    classDef transport fill:#4f46e5,stroke:#312e81,color:#fff
    
    class Client,LB,App,DB secure
    class LB,App transport
```

---

## Deployment Architecture

### Render.com Infrastructure

```mermaid
graph TB
    Domain["Domain<br/>ctoms-lr.render.com"]
    
    Domain -->|DNS| CDN["Cloudflare CDN<br/>Static Asset Cache"]
    Domain -->|DNS| LB["Render Load Balancer"]
    
    LB -->|Route| Instance1["Instance 1<br/>CTOMS-LR App"]
    LB -->|Route| Instance2["Instance 2+<br/>Auto-Scaling"]
    
    Instance1 & Instance2 -->|Shared Connection| DBCluster["Managed PostgreSQL<br/>Cluster"]
    Instance1 & Instance2 -->|Shared Connection| RedisCluster["Managed Redis<br/>Cluster"]
    
    Instance1 & Instance2 -->|Write Logs| Monitoring["Monitoring<br/>Prometheus/Grafana"]
    
    DBCluster -->|Backup| S3["Backup Storage<br/>S3-compatible"]
    
    classDef public fill:#f59e0b,stroke:#d97706,color:#fff
    classDef app fill:#06b6d4,stroke:#0e7490,color:#fff
    classDef data fill:#8b5cf6,stroke:#6d28d9,color:#fff
    
    class Domain,CDN public
    class Instance1,Instance2,LB app
    class DBCluster,RedisCluster,Monitoring,S3 data
```

---

## API Gateway & Service Communication

### Internal Service Communication

```mermaid
graph LR
    Client["HTTP Client<br/>User Request"]
    
    Client -->|Request| API["RESTful API Layer<br/>/api/v1/*"]
    
    API -->|Authenticate| AuthMiddle["Auth Middleware<br/>JWT Validation"]
    AuthMiddle -->|Authorize| PolicyMid["Policy Middleware<br/>Role Check"]
    
    PolicyMid -->|Route| Controllers["Controllers<br/>OrderController<br/>ShopController<br/>StaffController"]
    
    Controllers -->|Query/Mutate| Models["Eloquent Models<br/>Order, Shop,<br/>Appointment, User"]
    
    Models -->|SQL| DB["PostgreSQL<br/>Database"]
    
    DB -->|Data| Models
    Models -->|Response| Controllers
    Controllers -->|JSON| Client
    
    classDef layer fill:#4f46e5,stroke:#312e81,color:#fff
    class API,AuthMiddle,PolicyMid,Controllers,Models,DB layer
```

---

## Network Monitoring & Health

```mermaid
graph TB
    App["CTOMS-LR Application"]
    
    App -->|Logs| Logger["Logging Service<br/>Syslog/File"]
    App -->|Metrics| Metrics["Metrics Collector<br/>App Performance"]
    App -->|Health Check| Health["Health Endpoint<br/>/health"]
    
    Health -->|200 OK| LB["Load Balancer"]
    Metrics -->|Analyze| Dashboard["Monitoring Dashboard<br/>CPU, Memory, Requests"]
    Logger -->|Alert| Alerting["Alerting System<br/>Email/Slack"]
    
    Alerting -->|Notify| Ops["Operations Team"]
    
    classDef app fill:#06b6d4,stroke:#0e7490,color:#fff
    classDef ops fill:#f59e0b,stroke:#d97706,color:#fff
    
    class App,Health,Metrics,Logger,Dashboard app
    class Alerting,Ops ops
```

---

## Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hosting** | Render.com | Cloud platform for application |
| **Runtime** | PHP 8.2+ / Node.js | Application execution |
| **Frontend** | React 18 + Inertia.js + Vite | User interface |
| **Backend** | Laravel 11 | Business logic & APIs |
| **Database** | PostgreSQL | Persistent data storage |
| **Cache** | Redis | Session & cache layer |
| **Static Assets** | Render CDN | CSS, JS, Images |
| **Email** | SMTP Service | Notifications & alerts |
| **Security** | HTTPS/TLS 1.3 | Data encryption in transit |
| **Monitoring** | Render Logs | System health & errors |

---

## Key Network Features

✅ **Multi-tier Architecture** - Separation of frontend, backend, and database  
✅ **Role-Based Access** - Admin, Owner, Staff, Customer isolation  
✅ **Secure Communication** - TLS encryption for all network traffic  
✅ **Scalability** - Auto-scaling instances on Render  
✅ **Data Persistence** - PostgreSQL with automated backups  
✅ **Async Processing** - Background jobs via Redis queue  
✅ **Session Management** - Redis-based session storage  
✅ **CDN Distribution** - Static asset caching for performance  

---

**Last Updated:** May 15, 2026  
**Project:** CTOMS-LR (Custom Tailoring Order Management System - Laravel Refactor)  
**Deployment:** Render.com Cloud Platform
