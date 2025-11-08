# Firebase Storage CORS Configuration

## Problem
When users try to export data with documents, the browser blocks downloading files from Firebase Storage due to CORS (Cross-Origin Resource Sharing) policy.

Error message:
```
Access to fetch at 'https://firebasestorage.googleapis.com/...' from origin 'https://firesafetylog.co.uk'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution
Configure Firebase Storage to allow cross-origin requests from your domain.

## Steps to Fix

### Option 1: Using Firebase Console (Recommended)

Unfortunately, Firebase Console doesn't provide a UI for CORS configuration. You must use `gsutil` (Option 2).

### Option 2: Using gsutil Command Line Tool

1. **Install Google Cloud SDK** (if not already installed)
   - Visit: https://cloud.google.com/sdk/docs/install
   - Download and install the SDK for your operating system
   - Run: `gcloud init` to authenticate

2. **Authenticate with your Firebase project**
   ```bash
   gcloud auth login
   gcloud config set project fire-235c2
   ```

3. **Apply the CORS configuration**

   The CORS configuration file (`firebase-storage-cors.json`) is already in your project root.

   Run this command from your project root:
   ```bash
   gsutil cors set firebase-storage-cors.json gs://fire-235c2.firebasestorage.app
   ```

4. **Verify the CORS configuration**
   ```bash
   gsutil cors get gs://fire-235c2.firebasestorage.app
   ```

   You should see output similar to:
   ```json
   [
     {
       "origin": ["https://firesafetylog.co.uk", "https://www.firesafetylog.co.uk"],
       "method": ["GET", "HEAD"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

## What the Configuration Does

The `firebase-storage-cors.json` file tells Firebase Storage to:
- Allow requests from `https://firesafetylog.co.uk` and `https://www.firesafetylog.co.uk`
- Allow `GET` and `HEAD` HTTP methods (for downloading files)
- Cache the CORS configuration for 1 hour (3600 seconds)

## Temporary Workaround (Until CORS is configured)

The export functionality now includes a fallback:
- When files can't be downloaded due to CORS, the export creates a file called `DOCUMENT-DOWNLOAD-LINKS.txt`
- This file contains direct download links for all documents
- Users can click these links to download files manually
- The links are already authenticated and will work in the browser

## Testing

After applying the CORS configuration:
1. Go to your profile page
2. Click "Export All Data"
3. All documents should now download automatically into the `documents/` folder
4. No `DOCUMENT-DOWNLOAD-LINKS.txt` file should be created

## Troubleshooting

### "gsutil: command not found"
- You haven't installed Google Cloud SDK. Follow step 1 above.

### "AccessDeniedException: 403"
- You don't have permission to modify the storage bucket
- Make sure you're authenticated with an account that has Storage Admin role
- Run: `gcloud auth login` and use an admin account

### "Bucket not found"
- Check the bucket name is correct: `gs://fire-235c2.firebasestorage.app`
- Verify your project ID: `gcloud config get-value project`

### CORS still not working after configuration
- Clear your browser cache and try again
- Wait a few minutes for the configuration to propagate
- Check browser console for different error messages
- Verify the configuration with: `gsutil cors get gs://fire-235c2.firebasestorage.app`

## Security Notes

This CORS configuration:
- ✅ Only allows your specific domains
- ✅ Only allows GET/HEAD methods (read-only)
- ✅ Does not compromise security
- ✅ Files are still protected by Firebase Storage security rules
- ✅ Download URLs still require authentication tokens

## Additional Domains

If you need to add more domains (e.g., staging environment), edit `firebase-storage-cors.json`:

```json
[
  {
    "origin": [
      "https://firesafetylog.co.uk",
      "https://www.firesafetylog.co.uk",
      "https://staging.firesafetylog.co.uk",
      "http://localhost:3000"
    ],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

Then re-run the `gsutil cors set` command.
