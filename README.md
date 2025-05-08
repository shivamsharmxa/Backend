# Message App

A real-time messaging application with social features built using the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- User Authentication (Login/Register)
- Real-time Follow System
- Follow Request Notifications
- Real-time Status Updates
- Modern UI with Tailwind CSS

## Project Structure

```
.
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # React components
│       └── contexts/      # Context providers
└── server/                # Node.js backend
    ├── config/           # Configuration files
    ├── controllers/      # Route controllers
    ├── middleware/       # Custom middleware
    ├── models/          # Database models
    ├── routes/          # API routes
    └── utils/           # Utility functions
```

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a .env file with the following variables:

   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Technologies Used

- **Frontend:**

  - React.js
  - Tailwind CSS
  - Socket.IO Client
  - Axios
  - React Router DOM

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB
  - Socket.IO
  - JWT Authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
