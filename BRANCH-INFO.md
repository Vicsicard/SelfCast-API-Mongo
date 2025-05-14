# SelfCast API MongoDB Branch Information

## Branch Structure

This project uses the following branch structure:

- **main**: The main production branch
- **render-subhost**: Original branch for Render deployment (deprecated)
- **added-image-banners**: Branch with image banner functionality
- **combined**: Current production branch that combines all features

## Current Deployment

The application is currently deployed from the **combined** branch, which includes:

1. All fixes for social media titles and content display
2. Image banner functionality
3. Improved error handling and site generation
4. Custom domain support (user.selfcaststudios.com)

## Deployment Instructions

When deploying to Render:

1. Make sure the deployment is set to use the **combined** branch
2. Verify all environment variables are correctly set in Render
3. Check that the MongoDB connection string is valid

## Troubleshooting

If you encounter issues with the Content Editor:

1. Check the browser console for errors
2. Verify the API URL is correctly set to use the custom domain
3. Make sure the MongoDB connection is working
4. Check that the site generation process is completing successfully

Last updated: 2025-05-14
