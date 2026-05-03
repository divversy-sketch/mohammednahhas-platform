# Firebase content upload + in-platform HTML viewer patch

## What changed

- General content uploads from the Admin Content page now use Firebase Storage, not Cloudinary.
- Course uploads still use Cloudinary through `src/services/cloudinaryUpload.js`.
- Uploaded HTML files in general content are stored as Firebase Storage download URLs and open inside the platform using the existing `InteractiveViewer` iframe.
- Uploaded files auto-detect content type:
  - `.html` / `.htm` / `text/html` => `type: 'html'`
  - `.pdf` => `type: 'file'`
  - video mime types => `type: 'video'`
  - everything else => `type: 'file'`
- Firestore content documents now also keep:
  - `storageProvider: 'firebase'`
  - `firebaseStoragePath`
  - `mimeType`
  - `fileName`
  - `fileSize`

## New file

- `src/services/firebaseContentUpload.js`

## Important setup

Firebase Storage must be enabled in the Firebase console for the same Firebase project used by the website.

For development, make sure `VITE_FIREBASE_STORAGE_BUCKET` exists in `.env` and in Vercel Environment Variables.

## Suggested Firebase Storage rules

Adjust as needed, but this is a simple authenticated-user version:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /content/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

For stricter production, restrict writes to admins only using custom claims or Firestore role checks.
