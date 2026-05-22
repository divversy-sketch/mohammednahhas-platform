import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, limit } from 'firebase/firestore';
import { db } from '@services/firebase';
import { BarChart3, ClipboardList, CreditCard, Download, Lock, MessageSquare, PlayCircle, Save, Send, Shield, Sparkles, Target, Users, Wand2 } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';
import { platformNotify } from '@shared/core/platformShared.jsx';
import PageHeader from '@shared/ui/PageHeader.jsx';
import EmptyState from '@shared/ui/EmptyState.jsx';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));
const clean = (v) => String(v || '').trim();
const arabicDate = (v) => {
  const date = v?.toDate ? v.toDate() : v ? new Date(v) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString('ar-EG') : '—';
};
const resultPercent = (result, exam) => {
  const explicit = Number(result?.percentage ?? result?.percent ?? result?.scorePercentage);
  if (Number.isFinite(explicit) && explicit > 0) return clamp(explicit);
  const score = Number(result?.score ?? result?.totalScore ?? 0);
  const total = Number(result?.total ?? result?.maxScore ?? 0) || flattenExamQuestions(exam).reduce((s, q) => s + Number(q.maxScore || q.mark || 1), 0) || 1;
  return clamp((score / total) * 100);
};
const flattenExamQuestions = (exam) => (exam?.questions || []).flatMap((group) => group?.subQuestions || []);
const questionScore = (q) => Number(q?.maxScore || q?.mark || 1) || 1;
const pickRandom = (items, count) => [...items].sort(() => Math.random() - 0.5).slice(0, count);
const downloadText = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const topicOf = (item) => clean(item?.topic || item?.lesson || item?.branch || 'عام');
const branchOf = (item) => clean(item?.branch || 'عام');

function StatCard({ title, value, hint, tone = 'slate' }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-900 border-slate-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    red: 'bg-red-50 text-red-800 border-red-100',
  }[tone] || 'bg-slate-50 text-slate-900 border-slate-100';
  return <div className={`rounded-3xl border p-5 ${toneClass}`}><p className="text-xs font-black opacity-70 mb-2">{title}</p><p className="text-3xl font-black">{value}</p>{hint && <p className="text-xs font-bold opacity-70 mt-2">{hint}</p>}</div>;
}

export function buildWeaknessMap({ exams = [], examResults = [], mistakes = [] }) {
  const examById = new Map(exams.map((e) => [e.id, e]));
  const buckets = {};
  const ensure = (branch, topic) => {
    const key = `${branch || 'عام'}__${topic || 'عام'}`;
    buckets[key] = buckets[key] || { branch: branch || 'عام', topic: topic || 'عام', attempts: 0, correct: 0, total: 0, mistakes: 0, average: 0 };
    return buckets[key];
  };
  examResults.filter((r) => r.status === 'completed').forEach((r) => {
    const exam = examById.get(r.examId);
    const questions = flattenExamQuestions(exam);
    const answers = r.answers || {};
    if (!questions.length) {
      const b = ensure(r.branch || 'امتحانات', r.examTitle || exam?.title || 'عام');
      b.attempts += 1;
      b.total += 100;
      b.correct += resultPercent(r, exam);
      return;
    }
    questions.forEach((q, index) => {
      const branch = branchOf(q);
      const topic = topicOf(q);
      const b = ensure(branch, topic);
      b.attempts += 1;
      b.total += 1;
      const answer = answers[q.id] ?? answers[index] ?? answers[String(index)];
      const isRight = answer !== undefined && Number(answer) === Number(q.correctIdx ?? q.answerIndex ?? q.correctAnswerIndex ?? -999);
      if (isRight) b.correct += 1;
      else b.mistakes += 1;
    });
  });
  mistakes.forEach((m) => {
    const b = ensure(branchOf(m.question || m), topicOf(m.question || m));
    b.mistakes += 1;
    b.total += 1;
  });
  return Object.values(buckets).map((b) => ({ ...b, average: b.total ? Math.round((b.correct / b.total) * 100) : 0 })).sort((a, b) => (b.mistakes - a.mistakes) || (a.average - b.average));
}
