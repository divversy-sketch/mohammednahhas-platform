# E2E Real Smoke Specification

Generated: 2026-05-11T22:04:06.762Z

| Area | Status |
| --- | --- |
| src/shared/platformParts/ExamRunner.jsx | ok |
| src/shared/platformParts/PaymentRequestStudentPanel.jsx | ok |
| src/admin/parts/AdminPaymentRequestsPanel.jsx | ok |
| src/admin/components/AdminSystemHealthPanel.jsx | ok |
| src/admin/components/AdminCommandCenter.jsx | ok |
| src/services/platformData/index.js | ok |

Manual browser flow after deploy:
1. Student login -> course -> lesson.
2. Exam start -> refresh -> resume -> submit -> result visible.
3. Student sends payment request -> admin approves -> subscription updates.
4. Admin sends notification -> student receives targeted message.
5. Student opens support ticket -> admin replies and closes.
6. Admin checks System Health for errors, metrics, QA and backup reports.
