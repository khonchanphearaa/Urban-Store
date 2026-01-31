# Ecommerce-API

A REST API, Full-featured E-Commerce REST API built with Node.js, Express, MongoDB, and JWT authentication. This project covers the complete e-commerce flow including authentication, products, cart, orders, payments, and admin management. And design using real-world architecture, security practices, and scalable strcuture. This API servers as the backend for web or mobile-app ecommerce applications.

## Project Overview

This backend API is design tp support a modern e-commerce application (Web/Mobile). It follow clean architecture principles and real-world e-commerce logic.

### Main Goals:
- Secure user authentication
- Product & Category management
- Shopping cart system
- Cart & Order processing
- Payment intergration Dynamic ```bakong-khqr```
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

## Structur Project

```bash
ecommerce-api/
│
├── README.md
├── LICENSE
│
├── production-api/                     # Node.js Backend
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── adminSeed.js
│   ├── qr.html
│   ├── helper.doc
│   ├── .env
│
│   └── src/
│       ├── app.js
│
│       ├── config/
│       │   ├── bakong.js              # Python service URL
│       │   ├── cloudinary.js
│       │   ├── db.js
│       │   └── jwt.js
│
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── cart.controller.js
│       │   ├── category.controller.js
│       │   ├── order.controller.js
│       │   ├── payment.controller.js  # Calls Python
│       │   └── product.controller.js
│
│       ├── jobs/
│       │   └── bakong.poller.js        # Check payment status
│
│       ├── middlewares/
│       │   ├── admin.middleware.js
│       │   ├── adminSeed.js
│       │   ├── auth.middleware.js
│       │   ├── authLimiter.js
│       │   ├── upload.js
│       │   ├── user.middleware.js
│       │   └── validate.js
│
│       ├── models/
│       │   ├── Cart.js
│       │   ├── Category.js
│       │   ├── Order.js
│       │   ├── Payment.js
│       │   ├── Product.js
│       │   └── User.js
│
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── cart.routes.js
│       │   ├── category.routes.js
│       │   ├── order.routes.js
│       │   ├── payment.routes.js
│       │   └── product.routes.js
│
│       ├── services/
│       │   └── bakong.service.js       # axios → Python
│
│       ├── utils/
│       │   ├── khqr.js                 # (optional legacy)
│       │   ├── md5.js
│       │   └── paginate.js
│
│       └── validators/
│           └── auth.validator.js
│
├── bakong-python-service/              # Python Bakong Service
│   ├── README.md
│   ├── requirements.txt
│   ├── .env
│
│   ├── main.py                         # FastAPI entry
│   ├── bakong.py                       # KHQR logic
│
│   ├── routes/
│   │   ├── qr_routes.py                # /create-qr
│   │   └── payment_routes.py           # /check-payment
│
│   ├── services/
│   │   └── bakong_service.py
│
│   

```


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
5. Order status = ``` PENDING, PAID, FAILED, CANCEL ```

## Payment Flow (Bakong Khqr)

### Payment Process
1. Create payment integration with bakong-khqr
2. User completes payment (khqr-string)
3. Order status updated

### Payment Status
- PENDING
- PAID
- FAILED
- CANCEL

## REST API 
This the base urls
```bash
https://urban-store-6gj1.onrender.com
```

**Note waiting maybe 1-2 minutes it service walking up ....

For Endpoint Read More in README.md ``` production-api ```

This link website generate qrcode ``` https://qr.gov.kh/en/ ```


## E-Commerce Lifecycle

```bash
Product(Stock) → Cart(Quantity) → Order(Addrees) → Payment(Bakong Khqr) 
```

## Development
This project is for learning REST API & development ecommerce-api real-world project application .