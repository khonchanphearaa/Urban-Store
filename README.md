# Ecommerce-API

A REST API, Full-featured E-Commerce REST API built with Node.js, Express, MongoDB, and JWT authentication. This project covers the complete e-commerce flow including authentication, products, cart, orders, payments, and admin management. And design using real-world architecture, security practices, and scalable strcuture. This API servers as the backend for web or mobile-app ecommerce applications.

## Project Overview

This backend API is design tp support a modern e-commerce application (Web/Mobile). It follow clean architecture principles and real-world e-commerce logic.

### Main Goals:
- Secure user authentication
- Product & Category management
- Shopping cart system
- Cart & Order processing
- Payment intergration (Bakong static khqr)
- Admin control $ role-based access
- Admin & user roles
- Rate limiting & validation
- Image uploads with cloud-base media ``` Cloudinary.com ```
- Database store multi-cloud database service ``` MongoDB Atlas ```
- Cloud deployment application platform ``` Render.com ```

## Tech Stack
### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4DB33D?style=for-the-badge&logo=mongodb&logoColor=white)

### Security
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![bcrypt](https://img.shields.io/badge/bcrypt-Password%20Hashing-blue?style=for-the-badge&logo=npm&logoColor=white)
![RBAC](https://img.shields.io/badge/Role--Based%20Access-Control-orange?style=for-the-badge&logo=auth0&logoColor=white)
![Rate Limit](https://img.shields.io/badge/Rate-Limiting-red?style=for-the-badge&logo=cloudflare&logoColor=white)
![Validation](https://img.shields.io/badge/Input-Validation-green?style=for-the-badge&logo=checkmarx&logoColor=white)

### Third-Party Services
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white)
![Bakong KHQR](https://img.shields.io/badge/Bakong-KHQR%20Payment-005BAC?style=for-the-badge&logo=google-pay&logoColor=white)

### Deployment
![Render](https://img.shields.io/badge/Render-Deployment-0466C8?style=for-the-badge&logo=render&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4DB33D?style=for-the-badge&logo=mongodb&logoColor=white)

### Testing project API
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=Postman&logoColor=white)



## Authentication Flow
### 1.Register User
- User submit name, email, password
- Password is hashed using bcrypt
- User is saved in MongoDB
- JWT token is generated

### 2.Login User
- Email & Password validation
- Password comparison
- JWT token returned

### 3.Authirization
- Token send via header:

    ```bash
    Authorization: Bearer <token>
    ```

- Middleware verifies token
- User data attached to req.user

## User Role
| Role  | Permissions                    |
| :---- | :----------------------------- |
| User  | Browse, cart, order, pay       |
| Admin | Manage products, users, orders |

Role-based access is endforced via middleware.

## Product Flow
### Admin Actions

1. Create products
2. Upload image (Cloudinary)
3. Update product
4. Delete products

### User Actions
1. View product list
2. View product details
3. Search & fillter products

## Cart & Order Flow
- Cart stored on frontend or database
- User selects product & quantity

## Order Creation Flow
1. User submit cart
2. Backend validation stock
3. Order is created
4. Stock is reduced (After payment success)
5. Order status = ``` pending ```

## Payment Flow (Bakong Khqr)

### Payment Process
1. Create payment intent
2. User completes payment (generate khqr)
3. Payment confirmation
4. Order status updated

### Payment Status
- pending
- paid
- failed

## E-Commerce Lifecycle

```bash
Product(Stock) → Cart(Quantity) → Order(Addrees) → Payment(Bakong Khqr) 
```

## Development
This project is for learning REST API & development ecommerce-api real-world project application .