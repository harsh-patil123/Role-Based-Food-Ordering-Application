# Slooze Food Ordering Application Backend

This repository contains the NestJS GraphQL backend for the role-based and country-restricted food ordering application.

---

## Architecture Overview

```
                      +-------------------+
                      |   GraphQL Client  |
                      +---------+---------+
                                |
                                | (HTTP POST /graphql)
                                v
                      +-------------------+
                      |   NestJS App      |
                      +----+---------+----+
                           |         |
      (JwtAuthGuard)       |         |   (RolesGuard / RBAC)
      Extracts user jwt    |         |   Validates Role
                           v         v
                      +-------------------+
                      |  Resolvers Layer  |
                      +---------+---------+
                                |
                                | (Calls Service Methods with User Context)
                                v
                      +-------------------+
                      |  Services Layer   | <--- Enforces Re-BAC (Country / Owner Filters)
                      +---------+---------+
                                |
                                | (Prisma Client queries with WHERE clauses)
                                v
                      +-------------------+
                      |  PostgreSQL DB    |
                      +-------------------+
```

### Access Control Layers
1. **Layer 1: RBAC (Role-Based Access Control)**: Enforced via the `@Roles(...)` decorator and `RolesGuard`. Restricts actions like placing/cancelling orders (Admin/Manager only) and managing payment methods (Admin only).
2. **Layer 2: Re-BAC (Relation/Country-Based Access Control)**: Enforced directly inside the database query boundaries (services). Non-admin users are restricted to viewing and acting on data (restaurants, menu items, orders) associated with their registered country. Non-admin users can only view and edit their own orders.

---

## Prerequisites
- **Node.js**: v20 or later
- **Database**: PostgreSQL (Neon, Supabase, or local instance)

---

## Local Setup

1. **Clone and Install Dependencies**:
   ```bash
   git clone <repository-url>
   cd slooze-backend
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the details:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to supply:
   - `DATABASE_URL` (Your PostgreSQL connection string)
   - `JWT_SECRET` (A strong random secret)

3. **Apply Database Migrations**:
   ```bash
   npx prisma db push
   ```

4. **Seed Mock Data**:
   ```bash
   npm run seed
   ```

5. **Start the Application**:
   ```bash
   npm run start:dev
   ```
   The GraphQL playground will be available at `http://localhost:3000/graphql`.

---

## Running Tests

- **Unit Tests**:
  ```bash
  npm run test
  ```
- **End-to-End (E2E) Tests**:
  ```bash
  npm run test:e2e
  ```

---

## Vercel Deployment

1. Install the Vercel CLI: `npm i -g vercel`.
2. Link your project to Vercel: `vercel`.
3. Add your environment variables in the Vercel Dashboard (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`).
4. Deploy: `vercel --prod`.

---

## Seeded User Credentials (password: `password123`)

| Name | Role | Country | Email |
|------|------|---------|-------|
| Nick Fury | `ADMIN` | Global (`null`) | `nickfury@shield.gov` |
| Captain Marvel | `MANAGER` | `INDIA` | `captainmarvel@shield.gov` |
| Captain America | `MANAGER` | `AMERICA` | `captainamerica@shield.gov` |
| Thanos | `MEMBER` | `INDIA` | `thanos@shield.gov` |
| Thor | `MEMBER` | `INDIA` | `thor@shield.gov` |
| Travis | `MEMBER` | `AMERICA` | `travis@shield.gov` |

---

## Sample GraphQL Operations

### 1. Register User
```graphql
mutation {
  register(
    name: "Tony Stark"
    email: "tony@shield.gov"
    password: "password123"
    role: MEMBER
    country: AMERICA
  ) {
    token
    user {
      id
      email
      role
      country
    }
  }
}
```

### 2. Login User
```graphql
mutation {
  login(email: "captainmarvel@shield.gov", password: "password123") {
    token
    user {
      id
      name
      role
      country
    }
  }
}
```

### 3. Query Restaurants (Filtered by User Country)
```graphql
query {
  restaurants {
    id
    name
    country
    menuItems {
      id
      name
      price
    }
  }
}
```

### 4. Create Order
```graphql
mutation {
  createOrder(restaurantId: "restaurant-uuid-here") {
    id
    status
    totalAmount
  }
}
```

### 5. Add Item to Order
```graphql
mutation {
  addItemToOrder(
    orderId: "order-uuid-here"
    menuItemId: "menu-item-uuid-here"
    qty: 2
  ) {
    id
    totalAmount
    orderItems {
      id
      quantity
      unitPrice
      menuItem {
        name
      }
    }
  }
}
```

### 6. Place Order (Manager/Admin Only)
```graphql
mutation {
  placeOrder(
    orderId: "order-uuid-here"
    paymentMethodId: "payment-method-uuid-here"
  ) {
    id
    status
  }
}
```

### 7. Add Payment Method (Admin Only)
```graphql
mutation {
  addPaymentMethod(type: CARD, label: "Visa ending 9999") {
    id
    type
    label
    isDefault
  }
}
```
