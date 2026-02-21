# NeuroBridge API

A B2B SaaS API for neurodiverse education collaboration between schools and tutor centres in South Africa.

## 🌟 Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 🏫 **Institution Management** - School and tutor centre profiles
- 👥 **Learner Case Management** - Comprehensive learner profiles with case notes
- 🔄 **Case Transfers** - Seamless learner transfers between institutions
- 💬 **Secure Messaging** - Encrypted communication between institutions
- 🔍 **Discovery & Search** - Advanced search and filtering capabilities
- 📊 **Audit Logging** - Complete audit trail for compliance
- 📈 **Analytics & Reports** - Comprehensive reporting system

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport
- **Documentation:** Swagger/OpenAPI
- **Validation:** class-validator
- **Security:** Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/neurobridge-api.git
cd neurobridge-api
```

## 🧑‍💻 Developer Bootstrap (Invite Flow)

This API uses an invite-only flow for first-time developer access. Follow these steps to obtain a `SUPER_ADMIN` account for local testing.

> ⚠️ The `POST /dev/invite-super-admin` endpoint is **disabled in production** (`NODE_ENV=production`).

### Step 1 – Create a SUPER_ADMIN invite

Ensure the API is running locally (`NODE_ENV=development`), then call:

```http
POST http://localhost:3001/api/v1/auth/dev/invite-super-admin
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

**Response:**
```json
{
  "token": "<raw-invite-token>",
  "inviteLink": "http://localhost:3001/api/v1/auth/accept-invite?token=<raw-invite-token>",
  "expiresAt": "2026-02-24T12:00:00.000Z"
}
```

Copy the `token` value for the next step.

### Step 2 – Accept the invite and set a password

```http
POST http://localhost:3001/api/v1/auth/accept-invite
Content-Type: application/json

{
  "token": "<raw-invite-token>",
  "password": "SecurePassword123!",
  "firstName": "Admin",
  "lastName": "User"
}
```

**Response:**
```json
{
  "accessToken": "<JWT access token>",
  "refreshToken": "<JWT refresh token>",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "super_admin"
  }
}
```

### Step 3 – Use the Bearer token

Copy the `accessToken` from the response and add it as a Bearer token header in Postman or any HTTP client:

```
Authorization: Bearer <accessToken>
```

You now have full `SUPER_ADMIN` access to the API.

### Step 4 – (Optional) Login again

```http
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```