# Admin Access Guide

## Accessing the Admin Panel

The admin panel is located at a non-obvious URL for security:

```
https://yourdomain.com/admin
```

Replace `yourdomain.com` with your actual domain (e.g., `vanillahytaleservers.com`).

## Login

1. Navigate to the admin URL
2. You'll be redirected to the login page if not authenticated
3. Enter the password set in your `ADMIN_PASSWORD` environment variable
4. Click "Login"

## Admin Panel Features

### Content Tab
- Edit meta tags (title, description, OG tags)
- Edit hero section
- Edit server listings
- Toggle server highlight status

### Uploads Tab
- Upload images and assets
- View all uploaded files
- Files are automatically committed to GitHub

### Raw JSON Tab
- Direct JSON editing for advanced users
- Full control over all content fields
- Changes are validated on save

## Publishing Changes

1. Make your edits in any tab
2. Click "Publish to GitHub" button in the top right
3. Changes are committed to your repository
4. Vercel automatically rebuilds the site

## Environment Variables Required

Make sure these are set in your Vercel project:

- `ADMIN_PASSWORD`: Your chosen admin password
- `JWT_SECRET`: A long random string for session security
- `GITHUB_TOKEN`: Classic GitHub token with `repo` scope

## Security Notes

- The admin path is intentionally non-obvious
- Sessions expire after 7 days
- All admin routes require authentication
- The admin path is excluded from `robots.txt`
