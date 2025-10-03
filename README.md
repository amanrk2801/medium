Of course\! Here is the corrected and properly formatted version of your Markdown file. I've cleaned up the indentation, spacing, and list formatting to ensure it renders correctly.

```markdown
# Medium Clone - Complete MERN Stack

A full-featured Medium clone built with the MERN stack (MongoDB, Express.js, React, and Node.js). This application provides a complete, production-ready blogging platform with modern features, a robust backend, and a responsive user interface.

-----

## 🚀 Features

### Backend Features

- ✅ **Authentication & Authorization**: Secure JWT-based authentication with password hashing (bcrypt).
- ✅ **User Management**: Full profile management, avatar uploads, and a follow/unfollow system.
- ✅ **Article CRUD**: Complete create, read, update, and delete operations for articles.
- ✅ **Advanced Article Features**: Draft/publish states, featured images, categories, and tags.
- ✅ **Engagement System**: Like/unlike, commenting, and bookmarking functionality.
- ✅ **Image Uploads**: Seamless integration with Cloudinary for optimized image storage and delivery, with a local storage fallback.
- ✅ **Search & Discovery**: Full-text search, filtering by tags, categories, and authors, plus a trending articles algorithm.
- ✅ **Bulk Operations**: Perform bulk updates (e.g., publish) and deletes on multiple articles at once.
- ✅ **User Dashboard**: API endpoints for article and user statistics.
- ✅ **Security**: Rate limiting, security headers (Helmet), CORS protection, and server-side input validation.

### Frontend Features

- ✅ **Modern Tech Stack**: Built with React 18, TypeScript, and Vite for a fast development experience.
- ✅ **Responsive Design**: Mobile-first, clean UI styled with Tailwind CSS, including dark mode support.
- ✅ **Efficient Data Handling**: Uses React Query for data fetching, caching, and state management.
- ✅ **Article Editor**: A rich text editor that supports Markdown with a real-time preview.
- ✅ **User Dashboard**: A comprehensive interface for users to manage their profiles, articles, and view stats.
- ✅ **Interactive UI**: Seamless liking, commenting, and bookmarking interactions with toast notifications for user feedback.

-----

## 🛠️ Tech Stack

| Area       | Technology          | Description                               |
| :--------- | :------------------ | :---------------------------------------- |
| **Backend** | **Node.js** | JavaScript runtime environment            |
|            | **Express.js** | Web application framework                 |
|            | **MongoDB** | NoSQL database                            |
|            | **Mongoose** | Object Data Modeling (ODM) library        |
|            | **JWT** | Token-based authentication                |
|            | **Cloudinary** | Cloud-based image management              |
|            | **Multer** | Middleware for handling file uploads      |
| **Frontend** | **React 18** | JavaScript library for building UIs       |
|            | **TypeScript** | Superset of JavaScript for type safety    |
|            | **Vite** | Next-generation frontend build tool       |
|            | **Tailwind CSS** | Utility-first CSS framework               |
|            | **React Query** | Data fetching and state synchronization   |
|            | **React Router** | Declarative routing for React             |
|            | **React Hook Form** | Performant, flexible form validation      |

-----

## 📁 Project Structure

```

medium-clone-mern/
├── backend/                 \# Node.js/Express API
│   ├── config/              \# Database & Cloudinary config
│   ├── models/              \# MongoDB models (User.js, Article.js)
│   ├── routes/              \# API routes (auth.js, articles.js)
│   ├── middleware/          \# Custom middleware (auth.js, upload.js)
│   ├── .env                 \# Environment variables
│   └── server.js            \# Express server entry point
├── frontend/                \# React application
│   ├── src/
│   │   ├── components/      \# Reusable UI components
│   │   ├── contexts/        \# React contexts for state management
│   │   ├── pages/           \# Page components
│   │   ├── services/        \# API service layer
│   │   └── main.tsx         \# App entry point
│   └── vite.config.ts
├── package.json             \# Root package.json with concurrent scripts
└── README.md

````

-----

## 🚀 Getting Started: Complete Setup Guide

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 16 or higher.
- **MongoDB**: A local installation or a free MongoDB Atlas account.
- **Git**: For cloning the repository.
- **Code Editor**: VS Code is recommended.

### 2. Installation

First, clone the repository and navigate into the project directory.

```bash
git clone <repository-url>
cd medium-clone-mern
````

Then, run the setup script from the root directory. This will install dependencies for the root, backend, and frontend concurrently.

```bash
npm run setup
```

### 3\. Database Setup

You can use either a local MongoDB instance or a cloud-hosted one with MongoDB Atlas.

  - **Option A: Local MongoDB**

      - Install MongoDB Community Edition for your operating system.
      - Start the MongoDB service. On macOS, this is typically `brew services start mongodb-community`.

  - **Option B: MongoDB Atlas (Recommended)**

    1.  Create a free account on [MongoDB Atlas](https://www.mongodb.com/atlas).
    2.  Create a new cluster.
    3.  Get your connection string and whitelist your current IP address.

### 4\. Environment Configuration

The project uses `.env` files for managing environment variables.

  - **Backend (`backend/.env`)**

    1.  Navigate to the `backend` directory: `cd backend`
    2.  Copy the example file: `cp .env.example .env`
    3.  Edit the new `.env` file with your specific configuration:
        ```env
        PORT=5000
        MONGODB_URI=mongodb://localhost:27017/medium-clone
        # OR for Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/medium-clone
        JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_random
        NODE_ENV=development

        # Add Cloudinary credentials below (see next section)
        CLOUDINARY_CLOUD_NAME=
        CLOUDINARY_API_KEY=
        CLOUDINARY_API_SECRET=
        ```

  - **Frontend (`frontend/.env`)**

      - The frontend is pre-configured to connect to the backend at `http://localhost:5000/api`. No changes are needed for local development.

### 5\. Cloudinary Setup (For Image Uploads)

For handling image uploads, the application uses Cloudinary, which provides generous free-tier limits, optimization, and a CDN.

  - **Local Fallback**: If Cloudinary is not configured, the app will fall back to storing images locally in the `backend/uploads` folder. However, **Cloudinary is strongly recommended for all environments, including development.**

  - **Setup Steps**:

    1.  Create a free account at [cloudinary.com](https://cloudinary.com).
    2.  From your account dashboard, find and copy your **Cloud Name**, **API Key**, and **API Secret**.
    3.  Paste these credentials into your `backend/.env` file:
        ```env
        CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
        CLOUDINARY_API_KEY=your_actual_api_key
        CLOUDINARY_API_SECRET=your_actual_api_secret
        ```

  - **Free Tier**: The free tier includes 25 GB of storage, 25 GB of monthly bandwidth, and 1,000 transformations per month, which is ample for most small-to-medium applications.

### 6\. Start the Application

Return to the root directory and run the development script:

```bash
# From the root directory
npm run dev
```

This command concurrently starts both the backend and frontend servers:

  - **Backend API**: `http://localhost:5000`
  - **Frontend App**: `http://localhost:3000`

-----

## 🔧 Available Scripts

You can run these scripts from the project's root directory:

| Script          | Description                                            |
| :-------------- | :----------------------------------------------------- |
| `npm run dev`   | Starts both backend (with nodemon) and frontend servers  |
| `npm run server`| Starts only the backend server                         |
| `npm run client`| Starts only the frontend development server            |
| `npm run setup` | Installs all dependencies in root, backend, and frontend |
| `npm run build` | Builds the frontend application for production         |

-----

## 🧪 API Endpoints

The backend provides a comprehensive set of RESTful API endpoints. Authentication is required for protected routes.

#### Authentication

| Method | Endpoint             | Description                        |
| :----- | :------------------- | :--------------------------------- |
| `POST` | `/api/auth/register` | Register a new user                |
| `POST` | `/api/auth/login`    | Log in a user                      |
| `GET`  | `/api/auth/me`       | Get the current authenticated user |

#### Article Operations

| Method   | Endpoint                         | Description                                |
| :------- | :------------------------------- | :----------------------------------------- |
| `POST`   | `/api/articles`                  | Create a new article                       |
| `GET`    | `/api/articles`                  | Get all articles with pagination & filtering |
| `GET`    | `/api/articles/:id`              | Get a single article by its ID             |
| `PUT`    | `/api/articles/:id`              | Update an article (author only)            |
| `DELETE` | `/api/articles/:id`              | Delete an article (author only)            |
| `GET`    | `/api/articles/user/my-articles` | Get articles created by the current user   |
| `GET`    | `/api/articles/trending`         | Get trending articles                      |

#### Interaction & Media Operations

| Method   | Endpoint                              | Description                              |
| :------- | :------------------------------------ | :--------------------------------------- |
| `POST`   | `/api/articles/:id/image`             | Upload a featured image for an article   |
| `POST`   | `/api/articles/:id/like`              | Toggle like/unlike on an article         |
| `POST`   | `/api/articles/:id/bookmark`          | Toggle bookmark/unbookmark on an article |
| `POST`   | `/api/articles/:id/comments`          | Add a comment to an article              |
| `DELETE` | `/api/articles/:id/comments/:commentId` | Delete a comment                         |

#### Bulk & Stats Operations

| Method   | Endpoint                       | Description                                  |
| :------- | :----------------------------- | :------------------------------------------- |
| `DELETE` | `/api/articles/bulk/delete`    | Delete multiple articles in bulk             |
| `PUT`    | `/api/articles/bulk/update`    | Update multiple articles in bulk             |
| `GET`    | `/api/articles/stats/overview` | Get statistics for the current user's articles |

-----

## 🚀 Deployment

### Backend (Node.js)

  - **Hosting**: Deploy to services like Heroku, Railway, or a DigitalOcean Droplet.
  - **Database**: Use MongoDB Atlas in production for reliability and scalability.
  - **Environment**: Ensure all `.env` variables (especially `NODE_ENV=production`, `JWT_SECRET`, and Cloudinary keys) are set in your hosting provider's dashboard.
  - **Process Management**: Use a process manager like PM2 to keep the application running.

### Frontend (React)

  - **Hosting**: Deploy to a static hosting provider like Vercel or Netlify for the best performance.
  - **Build**: Run `npm run build` to create a production-optimized build of the frontend.
  - **Environment**: Update the `VITE_API_URL` environment variable in your hosting provider's settings to point to your live backend URL.

-----

## 🚨 Troubleshooting

### Backend Issues

  - **Server won't start**:
      - Ensure your MongoDB service is running or that your Atlas IP is whitelisted.
      - Verify that the `backend/.env` file exists and that all variables, especially `MONGODB_URI`, are correct.
      - Check if port 5000 is being used by another application.
  - **Image upload fails**:
      - Double-check your Cloudinary credentials in `backend/.env`.
      - Ensure the `backend/uploads` folder exists if using the local fallback.
      - Check file size (under 5MB) and format (JPG, PNG, GIF, WebP).

### Frontend Issues

  - **Can't connect to backend**:
      - Make sure the backend server is running on port 5000.
      - Check the browser's developer console for network or CORS errors.

### General Solution

If you encounter persistent issues, try a clean reinstall:

```bash
# 1. Stop all running servers (Ctrl+C)
# 2. Remove all node_modules folders and lock files
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf package-lock.json backend/package-lock.json frontend/package-lock.json

# 3. Reinstall all dependencies
npm run setup

# 4. Restart the development server
npm run dev
```

-----

## 🔐 Security Notes

  - **JWT Secret**: Always change the `JWT_SECRET` in `.env` to a long, complex, and random string.
  - **Environment Variables**: Never commit `.env` files to version control. Use them for all sensitive data.
  - **Production Database**: Enable authentication and strong access controls on your production MongoDB instance.
  - **Dependencies**: Regularly update dependencies to patch security vulnerabilities.
  - **CORS**: For production, configure CORS in the backend to only allow requests from your frontend's domain.

-----

## 🤝 Contributing

Contributions are welcome\! Please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/amazing-feature`).
3.  Make your changes and commit them (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

-----

## 📝 License

This project is licensed under the MIT License.

```
```
