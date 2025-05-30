# NIDrive Migration Guide: UUID & File Privacy Features

This guide explains the recent updates to the NIDrive application, which include switching to UUIDs for better security and adding file privacy features.

## 1. Key Changes

### Database Changes
- Switched from Integer IDs to UUIDs for users and files (improved security)
- Added file privacy features (public/private files)
- Created migration script for seamless transition
- Implemented persistent database storage in Docker

### Backend Changes
- Updated models to use UUIDs
- Added public/private file status
- Added API for toggling file privacy
- Added public file access API

### Frontend Changes
- Updated file list to show privacy status
- Added toggle button for switching file privacy
- Added public URL display and copy function
- Added option to set file privacy during upload

## 2. Running the Migration

To migrate your existing database to the new schema:

1. **Create a backup first**
   ```
   cp backend/NIDriveBot.db backend/NIDriveBot.db.backup
   ```

2. **Run the migration script**
   ```
   cd backend
   python migrations/migrate_to_uuid.py
   ```

3. **Rebuild containers**
   ```
   docker-compose down
   docker-compose up --build -d
   ```

## 3. Data Persistence

The updated docker-compose.yml now includes:
- Persistent volume for the database
- Persistent volume for uploaded files

This ensures your data remains intact when containers are rebuilt.

## 4. Using File Privacy Features

### For Users
- When uploading files, you can check "Make file public"
- In the files list, use the globe/lock icon to toggle file privacy
- For public files, a shareable link is displayed that works without login

### For Developers
- Files have an `is_public` boolean flag
- Public files have a `public_url` for anonymous access
- Private files require authentication to access

## 5. Technical Details

### UUID Implementation
- All IDs are now UUIDs stored as strings
- Improved security and uniqueness
- Better compatibility with distributed systems

### Privacy Features
- Public files accessible via `/public/{public_url_id}/{filename}`
- Private files require JWT authentication
- Toggle privacy with PUT request to `/files/{file_id}/toggle-privacy`

## 6. Troubleshooting

If you encounter issues after migration:
1. Restore from backup
2. Check server logs for specific errors
3. Ensure database volume permissions are correct

For any further assistance, please open an issue on the repository.
