import ExamRunnerCore, { ExamRunner as NamedExamRunnerCore } from './ExamRunnerCore.jsx';

// Phase 6 boundary file for the exam runtime.
export function ExamRunner(props) {
  const Component = NamedExamRunnerCore || ExamRunnerCore;
  return <Component {...props} />;
}

export default ExamRunner;
