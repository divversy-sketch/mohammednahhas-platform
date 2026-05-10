# Course Control + Bulk Actions Patch

## Added
- Lesson cards inside courses now use large images (`h-72 / lg:h-80`) like course hero images.
- Admin can edit full course data after creation:
  - title
  - description
  - price
  - teacher
  - cover image
  - grade
  - publish status
  - unlock mode
  - visibility start/end time
  - default access duration
  - permanent access toggle
- Admin can delete one course deeply, including modules, lessons, enrollments, progress, overrides, and course access codes.
- Admin can delete all courses.
- Course access codes can now be permanent or time-limited by days.
- Manual student enrollment can now be permanent or time-limited by days.
- Student course list respects course visibility window (`visibleFrom`, `visibleUntil`).
- Student access respects enrollment expiry (`expiresAt`).
- Admin exams page now has tabs: Manage Exams / Results.
- Bulk delete buttons added for:
  - Content
  - Exams + exam results
  - Results
  - Assignments / smart homework / submissions / homework results
  - Student mistakes bank

## Firestore Rules
No brand-new collection is required beyond the previous patch, but make sure these collections are writable/deletable by admin:

```js
match /courseAccessCodes/{codeId} {
  allow read: if signedIn();
  allow create, delete: if isAdmin();
  allow update: if isAdmin()
    || (
      signedIn()
      && resource.data.isUsed == false
      && request.resource.data.isUsed == true
      && request.resource.data.usedBy == request.auth.uid
    );
}
```

The previous course rules should already include admin delete for:
- courses
- courses/{courseId}/modules
- courses/{courseId}/modules/{moduleId}/lessons
- enrollments
- lessonProgress
- lessonUnlockOverrides
- examResults

Your old rules already allow admin writes/deletes on content, exams, assignments, smart_homeworks, homework_results, student_mistakes, and exam_results.
