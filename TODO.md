# TODO List

## Task: Update Home.jsx with ViewProfile Modal and Order Button

### Steps:
1. [x] Read Home.jsx file
2. [x] Add useAuth hook to check user login status
3. [x] Add modal state variables (showModal, selectedShop, modalLoading)
4. [x] Add handleViewProfile function to check auth and open modal
5. [x] Replace "View profile" Link with button that calls handleViewProfile
6. [x] Add modal with shop details and "Place Order" button

### Changes Made:
- Added authentication check using useAuth hook
- If user is not logged in: redirects to /login page
- If user is logged in: opens modal with shop details
- Modal displays: shop name, contact info, services, attributes
- "Place Order" button positioned at bottom right of modal
- Modal has close button and loading states
- Also added "Place Order" button to Shop.jsx (ViewProfile) page
