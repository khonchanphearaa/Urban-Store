# Producion-API

## E-Commerce API (Node.js)

A RESTful Ecommerce Backend API built with Node.js, Express, and MongoDB.
This API powers a modern e-commerce platform including product management, cart, orders, and payment processing with Bakong KHQR integration.

## Producion-API

```bash

production-api/
├── src/
│   ├── app.js               
│   ├── config/              
│   │   ├── bakong.js        
│   │   ├── cloudinary.js    
│   │   ├── db.js            
│   │   └── jwt.js           
│   ├── controllers/         
│   │   ├── auth.controller.js
│   │   ├── cart.controller.js
│   │   ├── category.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   └── product.controller.js
│   ├── jobs/                
│   │   └── payment.poller.js # Periodic checks for Bakong payment status
│   ├── middlewares/         
│   │   ├── admin.middleware.js
│   │   ├── auth.middleware.js
│   │   ├── authLimiter.js   
│   │   ├── upload.js        
│   │   ├── user.middleware.js
│   │   └── validate.js      
│   ├── models/             
│   │   ├── Cart.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/              
│   │   ├── auth.routes.js
│   │   ├── cart.routes.js
│   │   ├── category.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   └── product.routes.js
│   ├── services/           
│   │   └── bakong.service.js 
│   ├── utils/               
│   │   ├── md5.js           
│   │   └── orderResponse.js 
│   └── validators/          
│       └── auth.validator.js
├── adminSeed.js             
├── server.js                
├── package.json             
├── package-lock.json       
├── .gitignore               
├── .env.example             
└── README.md                

```

## How to Run Project
1. Install Dependencies

```bash
npm install
```

2. Setup Enviroment Variables

```bash
PORT=YOUR_PORT  #Example 5051
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/your_db_name
CLOUDINARY_CLOUD_NAME=da...ds2n
CLOUDINARY_API_KEY=74619....7938
CLOUDINARY_API_SECRET=rm4rr.....PszV7Hw
STRIPE_SECRET_KEY=sk_test_51ShuZV.....yyIgI8xHbEjhmGBO2W4
JWT_ACCESS_SECRET=acces....gu_123
JWT_REFRESH_SECRET=refre....et_456

PYTHON_BAKONG_URL=http://localhost:{{PORT}}
# {{PORT}} Is port from bakong-khqr-service

# Admin Authenication must to be create admin
# for create production is role admin
ADMIN_EMAIL=example@gmail.com
ADMIN_PASSWORD=12...234

# Admin expireIn
JWT_ADMIN_SECRET=myS....ey123! 
JWT_EXPRESIN=A_DAY_EXPRESIN

```

3. Start Server

 ```bash
npm run dev
```

## API Testing Postman
- Test Auth APIs
- Copy JWT token
- Add token to Authorization header

## isAdmin running local
file the root project for access provider is ``` Admin ```

```bash
node adminSeed.js
```

## Render deploy server


Render this URL: ``` https://urban-store-6gj1.onrender.com ```

Json running:

```bash
{
  "message": "E-Commerce API running"
}
```

## Several API Endpoints
This endPoint connect with the Base URLs ``` https://urban-store-6gj1.onrender.com ```

| Endpoint             | Method   | Description                             |
| -------------------- | -------- | --------------------------------------- |
| `/api/v1/auth`       | POST/GET | Register, login users                   |
| `/api/v1/products`   | GET      | Get all products                        |
| `/api/v1/products`   | POST     | Create a product (form-data for images) |
| `/api/v1/categories` | GET/POST | Categories                              |
| `/api/v1/cart`       | GET/POST | Cart actions                            |
| `/api/v1/orders`     | GET/POST | Orders                                  |
| `/api/v1/payments`   | POST     | Payment processing [GET] From bakong-khqr-service                    


## Common Issue
- ``` EADDRINUSE ```: Port already is use → stop previous server
- ``` Server error ```: Check MongoDB connection
- ``` Unauthorized ```: Token missing or expired









