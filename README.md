# SelfCast Dynamic - MongoDB Edition

A modernized API for the SelfCast Dynamic project, transitioning from Supabase key-value storage to MongoDB document-based architecture.

## Overview

This project provides a simplified MVP implementation that:

1. Maintains compatibility with existing frontend code
2. Improves backend architecture using MongoDB
3. Simplifies deployment with Node.js/Express
4. Preserves the project_id tracking system

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/selfcast
CORS_ORIGIN=http://localhost:5500
NODE_ENV=development
```

4. Start the server:

```bash
npm start
```

### Loading Sample Data

To load the sample hypnotherapy project data:

```bash
node src/utils/import-sample-data.js
```

## 📋 API Endpoints

### Projects

- **GET /api/projects** - Get a list of all project IDs
- **GET /api/projects/:projectId** - Get a specific project with its content
- **GET /api/projects/:projectId/content** - Get content for a specific project in Supabase-compatible format
- **POST /api/projects/:projectId/content** - Update content for a project
- **POST /api/projects** - Create a new project

## 🔌 Integration Guide

This API is designed to be a drop-in replacement for the Supabase backend used by the Content-Editor-5-4-25.html file.

### Using the Supabase Adapter

1. Add the adapter script to your HTML file:

```html
<script src="http://localhost:3000/supabase-adapter.js"></script>
```

2. The adapter automatically intercepts calls to Supabase and redirects them to our API

### Testing Integration

An integration example is provided at:

```
http://localhost:3000/integration-example.html
```

This page demonstrates how the adapter works and provides testing tools.

## 📦 Project Structure

```
selfcast-api/
├── .env                 # Environment variables
├── .env.example         # Example environment file
├── package.json         # Project dependencies
├── sample-data.json     # Sample project data
├── README.md            # This file
├── public/              # Static files
│   ├── integration-example.html  # Integration demo page
│   └── supabase-adapter.js       # Adapter for Supabase to MongoDB
└── src/                 # Source files
    ├── app.js           # Express application setup
    ├── index.js         # Server entry point
    ├── models/          # MongoDB models
    │   └── Project.js   # Project model definition
    ├── routes/          # API routes
    │   └── projects.js  # Project routes
    └── utils/           # Utility scripts
        └── import-sample-data.js # Data import utility
```

## 🚀 Deployment

Detailed deployment instructions are available in the [DEPLOYMENT.md](./DEPLOYMENT.md) file.

### MongoDB Atlas Setup

1. Create a free [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (free tier is sufficient)
3. Create a database user with read/write permissions
4. Configure network access to allow connections from anywhere (for development) or your specific servers
5. Get your connection string from the Atlas dashboard

### Render Deployment

Two options are available for deploying to Render:

#### Option 1: Manual Deployment

1. Create a [Render account](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the build command to `npm install`
5. Set the start command to `npm start`
6. Add environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `PORT` - Defaults to 10000 on Render
   - `CORS_ORIGIN` - URL of your frontend
   - `NODE_ENV` - Set to `production`
7. Deploy your service

#### Option 2: Blueprint Deployment (Recommended)

1. Use the provided `render.yaml` file in the repository
2. In your Render dashboard, create a new Blueprint
3. Connect your GitHub repository
4. Render will automatically detect the configuration and set up your services
5. Review and apply the configuration

### Production Configuration

The project includes production-ready configuration files:

- `.env.production` - Environment variables for production
- `render.yaml` - Render Blueprint configuration
- `public/config.js` - Auto-detects environment and sets correct API URLs

## 📝 Next Steps

- [ ] Add authentication
- [ ] Add user management
- [ ] Implement enhanced analytics
- [ ] Add more advanced document modeling
- [ ] Create admin dashboard

## 📜 License

Copyright © 2025 SelfCast Dynamic
