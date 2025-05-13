# SelfCast API MongoDB Deployment Guide

This guide outlines the steps to deploy the SelfCast API MongoDB application to Render (backend) and Vercel (frontend).

## Prerequisites

- A Render account (https://render.com)
- A Vercel account (https://vercel.com)
- MongoDB Atlas account with a configured cluster
- Git repository with your code

## Backend Deployment to Render

### Option 1: Deploy using the Dashboard

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - Name: `selfcast-api-mongo`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

5. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB connection string
   - `CORS_ORIGIN`: `https://selfcast-dynamic.vercel.app`

6. Click "Create Web Service"

### Option 2: Deploy using render.yaml

1. Ensure the `render.yaml` file is in your repository
2. Log in to your Render account
3. Click on "New" and select "Blueprint"
4. Connect your Git repository
5. Render will automatically detect the `render.yaml` file and configure the services
6. Review the configuration and click "Apply"

## Frontend Deployment to Vercel

1. Log in to your Vercel account
2. Click on "New Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Select appropriate framework (or "Other")
   - Build Command: `npm run build` (if applicable)
   - Output Directory: `public` (or your build output directory)
   - Install Command: `npm install`

5. Add environment variables if needed

6. Click "Deploy"

## Post-Deployment Configuration

1. Update the `config.js` file in your frontend code to point to your Render API URL
2. Test the application by navigating to your Vercel deployment URL
3. Verify that the frontend can communicate with the backend API

## Troubleshooting

- **CORS Issues**: Ensure the `CORS_ORIGIN` environment variable on Render matches your Vercel deployment URL
- **Database Connection**: Verify the MongoDB connection string is correct and the IP is whitelisted in MongoDB Atlas
- **API Errors**: Check Render logs for any backend errors

## Monitoring and Maintenance

- Set up monitoring for your Render service
- Configure automatic deployments from your Git repository
- Regularly backup your MongoDB database

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
