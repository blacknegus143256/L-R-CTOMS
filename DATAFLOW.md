# CTOMS-LR Integrated Data Flow Documentation for One Academic DFD

## 1. System Summary

CTOMS-LR is a tailoring order management system that supports customer registration, order placement, measurement handling, payment processing, rework requests, complaints, and administrative oversight. The system is organized around one central business flow in which users submit data, the system processes transactions, and records are stored for operational and supervisory use.

### Primary Users
- Customer
- Shop Owner / Store Admin
- Super Admin

### Overall Operational Flow
1. A customer registers or logs in.
2. The customer browses approved tailoring shops and places an order.
3. The shop owner or store admin reviews the order, issues a quotation, and updates order status.
4. The customer submits measurements and payment information.
5. The system stores the transaction and generates the corresponding receipt and notifications.
6. The customer may submit a rework request or complaint.
7. The super admin manages approvals, user control, and report investigation.

---

## 2. External Entities

| Entity | Description |
|---|---|
| Customer | Submits registration, orders, measurements, payments, rework requests, and reports |
| Shop Owner / Store Admin | Manages shop profile, services, orders, appointments, and production updates |
| Super Admin | Oversees users, shop approvals, reports, and system control |
| Payment Gateway | Returns payment confirmation for online transactions |

---

## 3. Major Processes

| No. | Process | Purpose | Inputs | Outputs |
|---|---|---|---|---|
| 1 | Authentication and Account Control | Registers users, verifies login, and controls access | Registration data, login credentials | Authenticated session, access decision |
| 2 | Shop Browsing and Inquiry | Displays approved tailoring shops and service information | Search request, shop query | Shop listings, shop details |
| 3 | Shop Onboarding and Approval | Handles shop submission and administrative approval | Shop profile, documents, approval decision | Approved shop record, approval notice |
| 4 | Order Processing | Creates, reviews, quotes, and updates tailoring orders | Order details, service selection, order status changes | Order record, quotation, order update |
| 5 | Measurement and Appointment Handling | Stores customer measurements and fitting schedules | Measurement data, appointment request | Measurement record, appointment schedule |
| 6 | Payment Processing | Records and confirms payments | Payment request, proof, gateway response | Payment record, payment receipt, payment status |
| 7 | Rework Handling | Manages correction or alteration requests | Rework request, shop decision | Rework record, rework status update |
| 8 | Report Management | Stores complaints and supports investigation | Complaint details, linked order reference | Report record, investigation status |
| 9 | User and Shop Administration | Manages users, shop status, and account control | User action, approval or suspension decision | Updated user/shop record, admin notice |
| 10 | Notification and Log Generation | Creates system alerts and audit records | Business events, status changes | Notification, audit log entry |

---

## 4. Data Stores

| Store ID | Data Store | Description |
|---|---|---|
| D1 | Users | Stores account identity, role, and status information |
| D2 | User Profiles | Stores contact and profile details |
| D3 | Tailoring Shops | Stores shop records, identity, and approval status |
| D4 | Services | Stores tailoring service offerings and prices |
| D5 | Shop Attributes | Stores shop capability and attribute data |
| D6 | Orders | Stores master order records and order status |
| D7 | Order Items | Stores order line items and related selections |
| D8 | Measurements | Stores measurement values and fitting details |
| D9 | Appointments | Stores fitting or service appointment data |
| D10 | Payments | Stores payment transactions and confirmation data |
| D11 | Rework Requests | Stores correction or alteration requests |
| D12 | Reports | Stores complaints and investigation records |
| D13 | Shop Documents | Stores onboarding and compliance documents |
| D14 | Notifications | Stores user alerts and message records |
| D15 | Audit Logs | Stores system and administrative activity records |
| D16 | Order Status Reference | Stores standardized order status values |
| D17 | Payment Status Reference | Stores standardized payment status values |
| D18 | Shop Status Reference | Stores standardized shop approval status values |
| D19 | Fit Methods | Stores fitting method definitions |

---

## 5. Outputs Generated

| Output | Description |
|---|---|
| Authentication Session | Confirms that the user is logged in and authorized |
| Shop Listings | Displays approved tailoring shops and services |
| Order Confirmation | Confirms that an order has been created or updated |
| Quotation | Provides the computed order price and related order information |
| Appointment Schedule | Shows the scheduled fitting or service date |
| Payment Receipt / Printout | Displays payment confirmation and printable receipt data |
| Payment Status Update | Indicates whether payment is pending, partial, or paid |
| Rework Response | Confirms the status of a rework request |
| Complaint Status Update | Shows report submission or investigation status |
| Shop Approval Notice | Confirms approval, rejection, or review of a shop |
| Notification | Sends alerts and reminders to users |
| Audit Log Entry | Records significant administrative or system action |

*Items such as Excel sales reports or a separate job-order module were not included because no corresponding implementation was identified in the current system.*

---

## 6. Integrated Data Flow Description

The system begins when the **Customer** interacts with **1 Authentication and Account Control** by submitting registration or login data. The process validates the information against **D1 Users** and **D2 User Profiles**, then returns an authenticated session or access decision.

After authentication, the customer may interact with **2 Shop Browsing and Inquiry** to view approved tailoring shops. This process reads from **D3 Tailoring Shops**, **D4 Services**, and **D5 Shop Attributes** and returns shop listings and shop details.

The customer then proceeds to **4 Order Processing** by sending order details, selected services, and order preferences. The process creates or updates records in **D6 Orders** and **D7 Order Items**, then issues an order confirmation or quotation. Shop owners or store admins also access the same process to review the order and update its status.

For measurement-related transactions, the customer sends measurement values to **5 Measurement and Appointment Handling**. The process stores the measurement information in **D8 Measurements** and appointment information in **D9 Appointments**, then outputs the measurement record or appointment schedule.

If the customer decides to pay, **6 Payment Processing** receives payment details and any proof or gateway response. The process stores the transaction in **D10 Payments**, updates the payment status reference, and produces a payment receipt or payment status update. The payment gateway serves as an external entity that returns payment confirmation data to the system.

When a customer is dissatisfied with the finished output, **7 Rework Handling** receives the correction request and stores it in **D11 Rework Requests**. The shop owner or store admin reviews the request and returns a rework response, which may indicate approval, ongoing work, or completion.

If the customer files a complaint, **8 Report Management** receives the complaint details and the related order reference. The report is stored in **D12 Reports** and linked to the order record when applicable. The super admin then reviews the report and changes its investigation status as needed.

The **Super Admin** also uses **3 Shop Onboarding and Approval** to review shop documents stored in **D13 Shop Documents**, then updates the shop record in **D3 Tailoring Shops** and **D18 Shop Status Reference**. The same admin role may use **9 User and Shop Administration** to update user status, suspend access, or manage shop records.

Across all processes, **10 Notification and Log Generation** records system activity in **D14 Notifications** and **D15 Audit Logs**. Notifications are sent whenever important events occur, such as order creation, quotation generation, payment confirmation, rework decisions, report updates, or shop approval.

In one integrated DFD structure, the information flow can be summarized as follows:

- **Customer** → Authentication and Account Control → **Users / User Profiles**
- **Customer** → Shop Browsing and Inquiry → **Tailoring Shops / Services / Shop Attributes**
- **Customer + Shop Owner / Store Admin** → Order Processing → **Orders / Order Items / Order Status Reference**
- **Customer + Shop Owner / Store Admin** → Measurement and Appointment Handling → **Measurements / Appointments**
- **Customer + Payment Gateway** → Payment Processing → **Payments / Payment Status Reference**
- **Customer + Shop Owner / Store Admin** → Rework Handling → **Rework Requests**
- **Customer + Super Admin** → Report Management → **Reports**
- **Super Admin** → Shop Onboarding and Approval → **Shop Documents / Tailoring Shops / Shop Status Reference**
- **Super Admin** → User and Shop Administration → **Users / Tailoring Shops**
- **All major events** → Notification and Log Generation → **Notifications / Audit Logs**

---

## 7. DFD Layout Recommendation

### LEFT SIDE: External Entities
- Customer
- Shop Owner / Store Admin
- Super Admin
- Payment Gateway

### CENTER: Major Processes
- 1 Authentication and Account Control
- 2 Shop Browsing and Inquiry
- 3 Shop Onboarding and Approval
- 4 Order Processing
- 5 Measurement and Appointment Handling
- 6 Payment Processing
- 7 Rework Handling
- 8 Report Management
- 9 User and Shop Administration
- 10 Notification and Log Generation

### RIGHT SIDE: Data Stores
- D1 Users
- D2 User Profiles
- D3 Tailoring Shops
- D4 Services
- D5 Shop Attributes
- D6 Orders
- D7 Order Items
- D8 Measurements
- D9 Appointments
- D10 Payments
- D11 Rework Requests
- D12 Reports
- D13 Shop Documents
- D14 Notifications
- D15 Audit Logs
- D16 Order Status Reference
- D17 Payment Status Reference
- D18 Shop Status Reference
- D19 Fit Methods

### FAR RIGHT: Outputs
- Authentication Session
- Shop Listings
- Order Confirmation
- Quotation
- Appointment Schedule
- Payment Receipt / Printout
- Payment Status Update
- Rework Response
- Complaint Status Update
- Shop Approval Notice
- Notification
- Audit Log Entry

---

## 8. Diagram Notes

- Use one central DFD diagram only.
- Place external entities on the left and outputs on the right.
- Use clean arrow labels such as "registration data," "order details," "payment confirmation," and "report details."
- Do not add unimplemented outputs such as Excel sales reports or separate job-order modules.
- Keep the diagram business-oriented and suitable for thesis or capstone presentation.
