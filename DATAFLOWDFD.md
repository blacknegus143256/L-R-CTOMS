# CTOMS-LR Data Flow Documentation for Academic DFD Modeling

## 1. System Overview

CTOMS-LR (Centralized Tailoring Order and Management System) is a web-based information system that supports tailoring shop operations from customer registration through order completion, payment, delivery, rework handling, complaints, and administrative oversight. The system captures business transactions, routes them through authorized processes, and stores resulting records in centralized data stores.

### Main Actors
- **Customer**: Registers, places orders, submits measurements, pays, tracks order status, requests rework, and files reports.
- **Shop Staff**: Reviews orders, issues quotations, updates production progress, receives measurements, manages rework, and updates order status.
- **Shop Owner**: Manages shop profile, services, schedules, documents, and onboarding-related business data.
- **Super Admin**: Approves shops, manages users, investigates reports, oversees order issues, and monitors system records.
- **External Service Providers**: Payment gateway, email/notification provider, and file storage services.

### Core Transactions
- Account creation and login
- Shop onboarding and approval
- Order creation and management
- Measurement submission and processing
- Payment processing
- Rework requests
- Complaint and investigation handling
- Notifications and audit logging

### Major Business Modules
- Authentication and account management
- Shop browsing and onboarding
- Order processing
- Measurement management
- Payment handling
- Rework management
- Report and investigation management
- Notification handling
- Administrative control

---

## 2. External Entities

| Entity | Description |
|---|---|
| Customer | Places tailoring orders, submits measurements, pays, and tracks progress |
| Shop Staff | Manages orders, quotations, production updates, and rework responses |
| Shop Owner | Maintains shop profile, services, schedules, and compliance documents |
| Super Admin | Oversees system users, shops, complaints, and operational control |
| Payment Gateway | Processes electronic payments and returns transaction confirmation |
| Email/Notification Service | Delivers system-generated notifications and messages |
| File Storage Service | Stores uploaded images, documents, and proofs of payment |
| Map/Location Service | Supports location lookup and map-based shop reference data |

---

## 3. Major Processes

| Process No. | Process Name | Purpose | Inputs | Outputs |
|---|---|---|---|---|
| 1.0 | Authentication and Account Management | Handles registration, login, session control, role validation, and account suspension checks | Credentials, registration details, session data | Authenticated session, user profile, access decision |
| 2.0 | Shop Browsing and Inquiry | Allows customers to view approved tailoring shops and related service information | Shop search criteria, shop request | Shop listings, shop profile details |
| 3.0 | Shop Onboarding and Approval | Processes shop owner registration, document submission, and administrative approval | Shop profile data, business documents, approval decision | Approved/rejected shop record, onboarding status |
| 4.0 | Order Management | Creates and updates tailoring orders from quotation to completion | Order details, service selection, order status updates | Order records, order status updates, order logs |
| 5.0 | Measurement Management | Receives, stores, and updates customer measurements and fitting records | Measurement values, fitting appointment data | Measurement records, measurement status, appointment records |
| 6.0 | Payment Processing | Generates payment requests, records payment results, and updates order payment status | Payment request, payment confirmation, manual payment evidence | Payment records, payment status updates, receipt/reference data |
| 7.0 | Rework Management | Handles customer requests for alteration or correction after order delivery | Rework request, rework details, shop decision | Rework records, rework status, customer notification |
| 8.0 | Report and Investigation Management | Receives complaints, links them to orders, and supports super admin investigation | Report details, order reference, investigation decision | Complaint records, report status updates, investigation notes |
| 9.0 | Notification Handling | Sends system alerts, reminders, and status updates to relevant users | Event triggers, recipient data, message content | Delivered notifications, notification records |
| 10.0 | User and Role Administration | Manages user profiles, roles, suspension, impersonation, and access control | User records, role updates, admin actions | Updated user records, access decisions, audit entries |
| 11.0 | Audit and Log Management | Stores significant operational events for review and accountability | Order actions, admin actions, system events | Audit logs, historical records |

---

## 4. Data Stores

| Store ID | Data Store | Description |
|---|---|---|
| D1 | Users | Stores authentication details, roles, and account status |
| D2 | User Profiles | Stores contact information, location details, and customer profile data |
| D3 | Tailoring Shops | Stores shop identity, status, and business configuration |
| D4 | Services | Stores service offerings, prices, and service categories |
| D5 | Shop Attributes | Stores shop capability and material-related data |
| D6 | Orders | Stores master order records and order status information |
| D7 | Order Items | Stores individual items or line entries associated with orders |
| D8 | Order Measurements | Stores measurement values and fitting-related records |
| D9 | Order Photos | Stores order-related images and visual references |
| D10 | Order Logs | Stores chronological order and administrative activity logs |
| D11 | Payments | Stores payment transactions, references, and payment states |
| D12 | Rework Requests | Stores rework/alteration requests and their outcomes |
| D13 | Reports | Stores customer complaints and investigation status |
| D14 | Appointments | Stores scheduled fitting or service appointments |
| D15 | Notifications | Stores generated alerts and message records |
| D16 | Shop Documents | Stores business compliance documents for onboarding and review |
| D17 | Shop Schedules | Stores shop operating hours and availability data |
| D18 | Shop Exceptions | Stores closures, holidays, and special schedule exceptions |
| D19 | Order Statuses | Stores standardized order status definitions |
| D20 | Payment Statuses | Stores standardized payment status definitions |
| D21 | Shop Statuses | Stores standardized shop approval/status definitions |
| D22 | Fit Methods | Stores fitting method definitions used during order setup |
| D23 | Notifications Log | Stores notification history and read/unread state |

---

## 5. Data Flow Mapping

| Source | Process | Data | Destination Store |
|---|---|---|---|
| Customer | 1.0 Authentication and Account Management | Registration details, login credentials | D1 Users, D2 User Profiles |
| Customer | 2.0 Shop Browsing and Inquiry | Search criteria, shop selection request | D3 Tailoring Shops, D4 Services, D5 Shop Attributes |
| Shop Owner | 3.0 Shop Onboarding and Approval | Shop profile, compliance documents | D3 Tailoring Shops, D16 Shop Documents |
| Super Admin | 3.0 Shop Onboarding and Approval | Approval or rejection decision | D3 Tailoring Shops, D21 Shop Statuses |
| Customer | 4.0 Order Management | Order details, selected service, design reference | D6 Orders, D7 Order Items, D10 Order Logs |
| Shop Staff | 4.0 Order Management | Quotation, production updates, order status change | D6 Orders, D10 Order Logs |
| Customer | 5.0 Measurement Management | Measurement values, fitting information | D8 Order Measurements, D14 Appointments |
| Shop Staff | 5.0 Measurement Management | Measurement review, appointment schedule | D8 Order Measurements, D14 Appointments |
| Customer | 6.0 Payment Processing | Payment request, manual payment proof | D11 Payments, D6 Orders |
| Payment Gateway | 6.0 Payment Processing | Payment confirmation, reference ID | D11 Payments, D20 Payment Statuses |
| Customer | 7.0 Rework Management | Rework request, explanation, evidence | D12 Rework Requests, D10 Order Logs |
| Shop Staff | 7.0 Rework Management | Rework decision, completion status | D12 Rework Requests, D10 Order Logs |
| Customer | 8.0 Report and Investigation Management | Complaint details, order reference | D13 Reports |
| Super Admin | 8.0 Report and Investigation Management | Investigation and resolution decision | D13 Reports, D10 Order Logs |
| System | 9.0 Notification Handling | Event trigger, recipient, message | D15 Notifications |
| Super Admin | 10.0 User and Role Administration | Suspension, activation, impersonation actions | D1 Users, D10 Order Logs |
| System | 11.0 Audit and Log Management | Operational events and status changes | D10 Order Logs |

---

## 6. Context Diagram Description

At the context level, CTOMS-LR is a single central process that exchanges data with external entities. The system receives registration data, order details, measurements, payment information, rework requests, and complaint reports from customers. It receives shop profile updates, production status data, quotations, and order actions from shop staff and shop owners. It receives approval decisions, suspension actions, and investigation commands from the super admin.

The system also exchanges data with external service providers. A payment gateway returns payment confirmation data, an email or notification service delivers messages, and a file storage service receives uploaded images and documents. The overall context diagram should show the system as one central process connected to these external entities through clearly labeled data flows.

---

## 7. Level 1 DFD Description

The Level 1 DFD divides CTOMS-LR into major business processes.

### Process Relationships
- **1.0 Authentication and Account Management** interacts with **D1 Users** and **D2 User Profiles** to manage identity and access.
- **2.0 Shop Browsing and Inquiry** reads from **D3 Tailoring Shops**, **D4 Services**, and **D5 Shop Attributes** to present approved shop data.
- **3.0 Shop Onboarding and Approval** receives shop submission data, stores documents in **D16 Shop Documents**, and updates approval status in **D3 Tailoring Shops** and **D21 Shop Statuses**.
- **4.0 Order Management** creates master order records in **D6 Orders** and supporting line items in **D7 Order Items** while logging actions in **D10 Order Logs**.
- **5.0 Measurement Management** stores fitting and measurement data in **D8 Order Measurements** and schedules appointments in **D14 Appointments**.
- **6.0 Payment Processing** records payment transactions in **D11 Payments** and updates payment status references in **D20 Payment Statuses**.
- **7.0 Rework Management** manages rework cases in **D12 Rework Requests** and records activity in **D10 Order Logs**.
- **8.0 Report and Investigation Management** stores complaints in **D13 Reports** and updates investigation results.
- **9.0 Notification Handling** writes notification events to **D15 Notifications** and sends them to external channels.
- **10.0 User and Role Administration** updates **D1 Users** and stores administrative actions in **D10 Order Logs**.
- **11.0 Audit and Log Management** collects significant events from other processes for traceability.

### Main Transactions
- User login, registration, and access validation
- Shop listing and shop approval flow
- Order creation, quotation, and status tracking
- Measurement submission and fitting scheduling
- Payment confirmation and manual payment verification
- Rework submission and review
- Complaint filing and investigation
- Notifications and audit logging

---

## 8. Level 2 DFD Candidates

### 8.1 Order Processing

| Subprocess No. | Subprocess Name | Inputs | Outputs | Data Stores |
|---|---|---|---|---|
| 4.1 | Order Creation | Customer details, service choice, order information | New order record | D6 Orders, D7 Order Items |
| 4.2 | Order Quotation | Order details, production plan | Quotation and expected completion data | D6 Orders, D10 Order Logs |
| 4.3 | Order Status Update | Shop actions, customer approvals | Updated status | D6 Orders, D10 Order Logs |
| 4.4 | Order Completion | Final production result | Completed order record | D6 Orders, D10 Order Logs |

### 8.2 Payment Processing

| Subprocess No. | Subprocess Name | Inputs | Outputs | Data Stores |
|---|---|---|---|---|
| 6.1 | Payment Request Generation | Order amount, customer request | Payment link or request | D11 Payments |
| 6.2 | Payment Confirmation | Gateway response, reference number | Confirmed payment record | D11 Payments, D20 Payment Statuses |
| 6.3 | Manual Payment Verification | Proof of payment, admin review | Verified payment status | D11 Payments |

### 8.3 Rework Management

| Subprocess No. | Subprocess Name | Inputs | Outputs | Data Stores |
|---|---|---|---|---|
| 7.1 | Rework Submission | Customer complaint about order output | Rework request record | D12 Rework Requests |
| 7.2 | Rework Review | Shop evaluation, defect assessment | Decision to approve or reject | D12 Rework Requests, D10 Order Logs |
| 7.3 | Rework Completion | Corrective action result | Closed rework case | D12 Rework Requests, D10 Order Logs |

### 8.4 Shop Approval Workflow

| Subprocess No. | Subprocess Name | Inputs | Outputs | Data Stores |
|---|---|---|---|---|
| 3.1 | Shop Registration | Shop profile and owner details | Pending shop record | D3 Tailoring Shops |
| 3.2 | Document Submission | Compliance documents | Stored documents | D16 Shop Documents |
| 3.3 | Document Review | Administrative decision | Document approval or rejection | D16 Shop Documents |
| 3.4 | Shop Activation | Final approval decision | Approved shop status | D3 Tailoring Shops, D21 Shop Statuses |

### 8.5 Report Investigation

| Subprocess No. | Subprocess Name | Inputs | Outputs | Data Stores |
|---|---|---|---|---|
| 8.1 | Complaint Submission | Report details, optional order reference | New complaint record | D13 Reports |
| 8.2 | Case Review | Complaint data, linked order data | Investigation notes | D13 Reports, D6 Orders |
| 8.3 | Case Resolution | Admin decision | Resolved or dismissed report | D13 Reports, D10 Order Logs |

---

## 9. Data Dictionary

| Data Name | Description |
|---|---|
| User Credentials | Login identity information such as email and password |
| Registration Details | New account information supplied by a user |
| Authenticated Session | Active login state that permits system access |
| Shop Profile | Basic shop identity, description, contact, and status information |
| Compliance Documents | Business documents submitted for shop approval |
| Service Selection | Chosen tailoring service and related options |
| Order Details | Customer tailoring order information |
| Order Status | Current lifecycle state of an order |
| Quotation Details | Price estimate, schedule, and production information |
| Measurement Data | Body measurements and fitting details supplied by the customer or staff |
| Appointment Data | Scheduled time and purpose for a fitting or service visit |
| Payment Information | Transaction details, reference numbers, and confirmation status |
| Manual Payment Proof | Uploaded evidence for non-automated payment verification |
| Rework Request | Request for correction, alteration, or adjustment after order output |
| Complaint Report | Formal customer complaint or issue submission |
| Investigation Decision | Admin action resulting from report review |
| Notification Message | System-generated message sent to a user or stakeholder |
| Audit Log Entry | Recorded system action for traceability and accountability |
| Approval Decision | Final decision to approve, reject, suspend, or activate a record |
| Shop Schedule Data | Operating hours and availability information |
| Shop Exception Data | Holidays, closures, and special schedule exceptions |
| Fit Method Data | Defined measurement or fitting approach used in order processing |
| Report Linkage Data | Reference connecting a report to a specific order |

---

## 10. Academic DFD Notes

For thesis or capstone diagram recreation, the following should be observed:
- Use **external entities** only for actors and outside services that exchange data with the system.
- Use **process numbering** such as 1.0, 2.0, 3.0, and so on for Level 1 DFD.
- Decompose only the major business processes when drawing Level 2 DFDs.
- Label arrows with the name of the data being transferred, not with implementation terms.
- Represent persistent repositories as **D1, D2, D3** data stores.
- Keep the diagrams business-oriented and avoid user interface or coding details.
- Ensure each process has a clear input, transformation, and output.
- Use consistent naming across the context diagram, Level 1 DFD, and Level 2 DFD.
