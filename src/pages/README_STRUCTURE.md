# هيكلة احترافية مقترحة

هذه النسخة بدأت فصل الخدمات والملفات المساعدة بدون كسر المشروع القديم:

- `src/services/firebase.js`: إعداد Firebase + Auth + Firestore + Push Notifications.
- `src/services/ai.js`: استدعاء AI للأدمن فقط مع Firebase ID Token.
- `src/utils/liveSessions.js`: قواعد ظهور المحاضرات للطالب.
- `src/utils/security.js`: سياسة الأمان العامة.
- `src/components/student/`: مكونات الطالب الجديدة/المحلية.
- `src/components/admin/`: مكان مكونات الأدمن عند استكمال التقسيم.
- `src/components/live/`: مكان مكونات اللايف عند استكمال التقسيم.

تم ترك `App.jsx` كملف جامع مؤقتًا حتى لا ينكسر المشروع، مع فصل Firebase والملفات الجديدة كأساس V2.
