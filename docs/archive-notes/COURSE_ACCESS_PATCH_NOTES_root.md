# Course Landing + Access Codes Patch

## What changed

- Published courses now appear to students as large hero cards with a big cover image, teacher, grade, price, description, and access status.
- Course details page now has a large cover image and a course access panel.
- Admin can open a course manually for a specific student through `enrollments`.
- Admin can generate course access codes in `courseAccessCodes`.
- Student can enter an access code from inside the course page to unlock the course.
- Existing lesson unlock rules, YouTube tracking, anti-skip, PDF, exams, and lesson progress remain in place.

## Firestore Rules addition required

Add this block before the final catch-all rule:

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

The existing `enrollments` rules should also allow students to create their own enrollment when `userId == request.auth.uid`, which was included in the previous course rules.
