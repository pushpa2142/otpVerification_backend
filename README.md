# Phone Verification Full Stack Application
OTP verification through phone numbers by sending them via twilio

# Project Overview

This project is a full-stack phone verification application developed using Angular for the frontend and Node.js/Express for the backend. The application supports OTP-based authentication and integrates MongoDB for data storage.

# Features
User phone number authentication

OTP generation and verification

Angular reactive forms

REST API integration

MongoDB database connection

JWT-based authentication

Environment configuration

Production deployment setup

# Tech Stack
# Frontend
Angular

TypeScript

HTML/CSS
# Backend
Node.js

Express.js

MongoDB

Mongoose

JWT Authentication
# Deployment
Netlify (Frontend)

AWS Lambda + Serverless Framework (Backend)

# Installation
# Frontend
npm install

ng serve
# Backend
npm install

npm run dev
# Environment Variables
Create a .env file in the backend folder and add:

MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_secret_key
# Deployment Status

The application is fully functional in the local environment.

Deployment work has also been implemented using:

Netlify for frontend hosting
AWS Lambda with Serverless Framework for backend APIs

Some deployment-related issues such as CORS handling and environment configuration are currently under debugging and optimization.
