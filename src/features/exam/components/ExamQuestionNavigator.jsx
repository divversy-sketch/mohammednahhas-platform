import React from 'react';

function isQuestionAnswered(question, answers) {
  const value = answers?.[question.id];
  return value !== undefined && value !== '' && value !== null;
}

function getQuestionStatusClass({ question, answers, isSubmitted }) {
  const isAnswered = isQuestionAnswered(question, answers);

  if (isSubmitted) {
    if (question.type === 'essay') {
      return isAnswered ? 'bg-blue-100 text-blue-700 border-blue-500 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
    }
    if (answers?.[question.id] === question.correctIdx) {
      return 'bg-green-100 text-green-700 border-green-500 shadow-sm';
    }
    if (isAnswered) {
      return 'bg-red-100 text-red-700 border-red-500 shadow-sm';
    }
    return 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
  }

  if (isAnswered) {
    return question.type === 'essay' ? 'bg-purple-100 text-purple-700 border-purple-400 shadow-sm' : 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm';
  }

  return 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent';
}

export default function ExamQuestionNavigator({
  displayQuestions = [],
  flatQuestions = [],
  answers = {},
  flagged = {},
  isSubmitted,
  currentQIndex,
  onSelectQuestion,
}) {
  return (
    <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto shadow-inner scrollbar-hide">
      <div className="grid grid-cols-1 gap-3">
        {displayQuestions.map((question, idx) => {
          const statusClass = getQuestionStatusClass({ question, answers, isSubmitted });
          const originalIndex = flatQuestions.findIndex((origQ) => origQ.id === question.id) + 1;
          return (
            <button
              key={question.id || idx}
              onClick={() => onSelectQuestion(idx)}
              className={`aspect-square rounded-xl font-bold text-base transition-all relative ${currentQIndex === idx ? 'ring-4 ring-amber-500 ring-offset-2 scale-105 z-10' : ''} ${statusClass}`}
            >
              {originalIndex}
              {flagged[question.id] && !isSubmitted && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
