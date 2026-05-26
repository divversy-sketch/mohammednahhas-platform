import ExamRunnerLegacy, { ExamRunner as NamedExamRunnerLegacy } from './legacy/ExamRunnerLegacy.jsx';

// Phase 6 boundary file for the exam runtime.
export function ExamRunner(props) {
  const Component = NamedExamRunnerLegacy || ExamRunnerLegacy;
  return <Component {...props} />;
}

export default ExamRunner;
