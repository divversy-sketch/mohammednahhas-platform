import ExamRunnerCore, { ExamRunner as NamedExamRunnerCore } from './ExamRunnerCore.jsx';
import { ExamLockGate, needsExamLock } from '@features/native-app/ExamLockGate.jsx';

// The exam runtime. ExamRunnerCore only marks an exam as submitted after the server confirms it,
// keeps time by a deadline (not a ticking counter), reports presence to the admin and queues a failed submit.
// جوه تطبيق الأندرويد: الامتحان ما يبدأش غير بعد ما الطالب يوافق على تثبيت الشاشة.
export function ExamRunner(props) {
  const Component = NamedExamRunnerCore || ExamRunnerCore;
  if (needsExamLock(props)) {
    return <ExamLockGate exam={props.exam} onClose={props.onClose}><Component {...props} examLocked /></ExamLockGate>;
  }
  return <Component {...props} />;
}

export default ExamRunner;
