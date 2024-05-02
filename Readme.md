
# Real-Time Chat Application Backend

This project implements a comprehensive backend for a real-time chat application using the MERN stack. It focuses on user authentication, real-time messaging, message storage, user online status, and integration with a language model API.

## Setup Instructions
1. Clone the repository:   git clone https://github.com/Aditya20743/HQ-ChatApplication.git

2. Navigate to the project directory:  cd server

3. Install dependencies:   npm install

4. Configure environment variables: Create a .env file in the root directory and add the variables given in .sampleEnv

MONGO_URI
JWT_SECRET
OPENAI_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

5. Run the server: node index.js or nodemon index.js or npm run start

### Functionality: 
1. User Authentication Using JWT,
2. Real time Chat Functionality Using Socket.io
3. Message Storage in MongoDB
4. User Online Status Implemented
5. LLM Integration done but GPT API credits finished
6. Basic Frontend
 
### Folder Structure: 
1. ├── constants         ────── Constant files
1. ├── controllers       ────── Controllers handling business logic
2. ├── middleware        ────── Middleware functions
3. ├── models            ────── MongoDB schema models
4. ├── routes            ────── API routes
5. ├── seeders           ────── Used for generating test data
5. ├── utils             ────── Utility functions
6. └── index.js          ────── Entry point of the application

The code is modularized into separate files based on their functionality.
Each file focuses on a specific aspect of the application, promoting code reusability and maintainability.
Error handling is implemented consistently throughout the codebase.
Used Express Validator for validating incoming request data.


## API Routes

### User Routes

1. POST /api/v1/user/new 
2. POST /api/v1/user/login
3. GET /api/v1/user/logout
4. GET /api/v1/user/search
5. PATCH /api/v1/user/:userId/status

### Chat Routes

1. POST /api/v1/chat/message
2. GET /api/v1/chat/message/:id
3. GET /api/v1/chat/:id

## Database design
Used references (ObjectIds) for relationships between collections, like sender in messages or members in chats.
Embedding documents can be considered for small, fixed-size data, but it can lead to data duplication and maintenance issues when our users grow.

Any Feedback is Appreciated 






