import ExamRunnerCore, { ExamRunner as NamedExamRunnerCore } from './ExamRunnerCore.jsx';

// The exam runtime. ExamRunnerCore only marks an exam as submitted after the server confirms it,
// keeps time by a deadline (not a ticking counter), reports presence to the admin and queues a failed submit.
export function ExamRunner(props) {
  const Component = NamedExamRunnerCore || ExamRunnerCore;
  return <Component {...props} />;
}

export default ExamRunner;
