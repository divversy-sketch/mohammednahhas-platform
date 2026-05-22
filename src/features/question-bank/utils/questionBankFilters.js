export const filterQuestionsByGrade = (questions = [], grade = 'all') => (
  grade === 'all' ? questions : questions.filter((question) => question.grade === grade)
);
