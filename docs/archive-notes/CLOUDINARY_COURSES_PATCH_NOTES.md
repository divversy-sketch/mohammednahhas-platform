# Cloudinary + Courses Patch Notes

## Cloudinary

Added `src/services/cloudinaryUpload.js`.

Configured values in `.env` and `.env.example`:

```env
VITE_CLOUDINARY_CLOUD_NAME=df7wxvb0a
VITE_CLOUDINARY_UPLOAD_PRESET=nahhas-platform
```

Do not add `API_SECRET` to React/Vite. Keep it private.

## Uploads now using Cloudinary

- Course cover image
- Lesson image/icon image field
- Lesson PDF upload
- Essay answer images in exams
- Assignment answer images
- General content file/image upload in admin content manager

Firestore now stores Cloudinary URLs instead of Base64 for the patched upload areas.

## Courses system

Uses the agreed Firestore structure:

- `courses`
- `courses/{courseId}/modules`
- `courses/{courseId}/modules/{moduleId}/lessons`
- `enrollments`
- `lessonProgress`
- `examResults`
- `lessonUnlockOverrides`

## Lesson experience

When the student clicks a lesson image/card inside the course, a lesson panel opens with tabs:

- شرح الدرس
- PDF
- الامتحان

The exam button remains locked until the student reaches the configured watch percentage, default 75%.

## YouTube tracking + Anti-skip

The YouTube IFrame Player API tracks:

- current watch time
- video duration
- max watched seconds
- watch percentage
- exam unlock state

Anti-skip prevents jumping far ahead beyond the last watched point.

## Admin override

Admins can add a lesson unlock override for a specific student so the lesson/exam can open even if the normal conditions are not completed.
