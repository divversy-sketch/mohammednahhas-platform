import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { MessageCircle, MessageSquare, Send } from '../../shared/icons/lucide-shim.jsx';
import { db } from '../../services/firebase';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const AdminStudentMessaging = ({ users = [], adminGradeFilter = 'all' }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetMode, setTargetMode] = useState('student');
  const [targetGrade, setTargetGrade] = useState(adminGradeFilter === 'all' ? '3sec' : adminGradeFilter);
  const [messageText, setMessageText] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);

  const students = useMemo(() => (users || [])
    .filter(u => u.role !== 'admin')
    .filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter)
    .sort((a, b) => String(a.name || a.displayName || '').localeCompare(String(b.name || b.displayName || ''), 'ar')), [users, adminGradeFilter]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'student_chats'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setConversations(rows);
    }, (error) => { console.warn('student_chats listener blocked:', error?.message); setConversations([]); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedStudentId || typeof selectedStudentId !== 'string') { setThreadMessages([]); return; }
    const qRef = query(collection(db, 'student_chats', selectedStudentId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qRef, (snap) => {
      setThreadMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDoc(doc(db, 'student_chats', selectedStudentId), { unreadForAdmin: 0 }, { merge: true }).catch(() => {});
    }, (error) => { console.warn('student chat messages blocked:', error?.message); setThreadMessages([]); });
    return () => unsub();
  }, [selectedStudentId]);

  const sendToStudent = async (student, textValue) => {
    if (!student?.id || typeof student.id !== 'string' || !textValue.trim()) return;
    await setDoc(doc(db, 'student_chats', student.id), {
      studentId: student.id,
      studentName: student.name || student.displayName || student.email || 'طالب',
      studentEmail: student.email || '',
      grade: student.grade || '',
      lastMessage: textValue.trim(),
      lastSender: 'admin',
      unreadForStudent: increment(1),
      forcePopup: true,
      needsStudentAction: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await addDoc(collection(db, 'student_chats', student.id, 'messages'), {
      text: textValue.trim(),
      senderId: 'admin',
      senderRole: 'admin',
      senderName: 'الإدارة',
      createdAt: serverTimestamp(),
      readByStudent: false,
      readByAdmin: true
    });
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return alert('اكتب نص الرسالة أولاً.');
    let targets = [];
    if (targetMode === 'student') {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student) return alert('اختار طالب أولاً.');
      targets = [student];
    } else if (targetMode === 'grade') {
      targets = students.filter(s => s.grade === targetGrade);
      if (targets.length === 0) return alert('لا يوجد طلاب في هذا الصف.');
    } else {
      targets = students;
      if (targets.length === 0) return alert('لا يوجد طلاب.');
    }
    if (targets.length > 20 && !window.confirm(`سيتم إرسال الرسالة إلى ${targets.length} طالب. هل أنت متأكد؟`)) return;
    try {
      await Promise.all(targets.map(student => sendToStudent(student, messageText)));
      setMessageText('');
      alert(`تم إرسال الرسالة إلى ${targets.length} طالب.`);
    } catch (error) {
      console.error('send student message error:', error);
      alert('تعذر إرسال الرسالة. راجع صلاحيات Firestore.');
    }
  };

  const selectedConversation = conversations.find(c => (c.studentId || c.id) === selectedStudentId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 glass-panel rounded-2xl p-4">
        <h2 className="font-black text-xl text-slate-800 mb-4 flex items-center gap-2"><MessageCircle className="text-amber-600"/> رسائل الطلاب</h2>
        <div className="space-y-3 mb-5 bg-amber-50 border border-amber-100 rounded-2xl p-3">
          <select className="w-full border rounded-xl p-3" value={targetMode} onChange={e => setTargetMode(e.target.value)}>
            <option value="student">طالب محدد</option>
            <option value="grade">صف كامل</option>
            <option value="all">كل الطلاب</option>
          </select>
          {targetMode === 'student' && (
            <select className="w-full border rounded-xl p-3" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
              <option value="">اختار الطالب</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name || s.displayName || s.email} - {getGradeLabel(s.grade)}</option>)}
            </select>
          )}
          {targetMode === 'grade' && (
            <select className="w-full border rounded-xl p-3" value={targetGrade} onChange={e => setTargetGrade(e.target.value)}><GradeOptions/></select>
          )}
          <textarea className="w-full border rounded-xl p-3 min-h-[100px]" placeholder="اكتب رسالتك..." value={messageText} onChange={e => setMessageText(e.target.value)} />
          <button onClick={sendMessage} className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition flex items-center justify-center gap-2"><Send size={18}/> إرسال</button>
        </div>
        <h3 className="font-bold text-slate-700 mb-2">المحادثات</h3>
        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {conversations.filter(c => adminGradeFilter === 'all' || c.grade === adminGradeFilter).map(c => (
            <button key={c.id} onClick={() => setSelectedStudentId(c.studentId || c.id)} className={`w-full text-right p-3 rounded-xl border transition ${selectedStudentId === (c.studentId || c.id) ? 'bg-amber-100 border-amber-300' : 'bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 truncate">{c.studentName || c.studentEmail || 'طالب'}</span>
                {safeNumber(c.unreadForAdmin, 0) > 0 && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">{c.unreadForAdmin}</span>}
              </div>
              <p className="text-xs text-slate-500 truncate mt-1">{c.lastMessage || 'لا توجد رسائل'}</p>
            </button>
          ))}
          {conversations.length === 0 && <p className="text-center text-slate-400 py-6 text-sm">لا توجد محادثات بعد.</p>}
        </div>
      </div>
      <div className="lg:col-span-2 glass-panel rounded-2xl p-4 flex flex-col min-h-[680px]">
        {selectedStudentId ? (
          <>
            <div className="border-b pb-3 mb-3">
              <h3 className="font-black text-xl text-slate-800">{selectedConversation?.studentName || students.find(s=>s.id===selectedStudentId)?.name || 'محادثة طالب'}</h3>
              <p className="text-xs text-slate-500">{selectedConversation?.studentEmail || students.find(s=>s.id===selectedStudentId)?.email || ''}</p>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-4 space-y-3">
              {threadMessages.map(m => (
                <div key={m.id} className={`flex ${m.senderRole === 'admin' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${m.senderRole === 'admin' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap text-sm font-bold">{m.text}</p>
                    <p className={`text-[10px] mt-1 ${m.senderRole === 'admin' ? 'text-amber-100' : 'text-slate-400'}`}>{m.senderName || (m.senderRole === 'admin' ? 'الإدارة' : 'الطالب')}</p>
                  </div>
                </div>
              ))}
              {threadMessages.length === 0 && <p className="text-center text-slate-400 py-10">ابدأ المحادثة مع الطالب.</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-slate-400">
            <div><MessageSquare size={64} className="mx-auto mb-4 opacity-40"/><p className="font-bold">اختار طالب من القائمة أو أرسل رسالة جماعية.</p></div>
          </div>
        )}
      </div>
    </div>
  );
};


export const StudentMessagesPanel = ({ user, userData, compact = false, onAfterReply = null }) => {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const studentId = user?.uid;

  useEffect(() => {
    if (!studentId || typeof studentId !== 'string') return;
    const qRef = query(collection(db, 'student_chats', studentId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qRef, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.warn('student messages listener blocked:', error?.message);
      setMessages([]);
    });
    return () => unsub();
  }, [studentId]);

  const markSeen = async () => {
    if (!studentId) return;
    try {
      await setDoc(doc(db, 'student_chats', studentId), {
        unreadForStudent: 0,
        forcePopup: false,
        needsStudentAction: false,
        lastStudentSeenAt: serverTimestamp()
      }, { merge: true });
      if (onAfterReply) onAfterReply();
    } catch (error) {
      console.warn('mark seen failed:', error);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !studentId || typeof studentId !== 'string') return;
    try {
      await setDoc(doc(db, 'student_chats', studentId), {
        studentId,
        studentName: userData?.name || user?.displayName || user?.email || 'طالب',
        studentEmail: user?.email || '',
        grade: userData?.grade || '',
        lastMessage: reply.trim(),
        lastSender: 'student',
        unreadForAdmin: increment(1),
        unreadForStudent: 0,
        forcePopup: false,
        needsStudentAction: false,
        lastStudentSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'student_chats', studentId, 'messages'), {
        text: reply.trim(),
        senderId: studentId,
        senderRole: 'student',
        senderName: userData?.name || user?.displayName || 'طالب',
        createdAt: serverTimestamp(),
        readByStudent: true,
        readByAdmin: false
      });
      setReply('');
      if (onAfterReply) onAfterReply();
    } catch (error) {
      console.error('student reply error:', error);
      alert('تعذر إرسال الرسالة. حاول مرة أخرى.');
    }
  };

  return (
    <div className={`${compact ? '' : 'glass-panel rounded-2xl p-4 md:p-6'}`}>
      {!compact && <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><MessageCircle className="text-amber-600"/> رسائل الإدارة</h2>}
      <div className={`bg-slate-50 rounded-2xl p-4 ${compact ? 'min-h-[260px] max-h-[360px]' : 'min-h-[420px] max-h-[520px]'} overflow-y-auto space-y-3 border`}>
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.senderRole === 'student' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${m.senderRole === 'student' ? 'bg-white border text-slate-800 rounded-tr-none' : 'bg-amber-600 text-white rounded-tl-none'}`}>
              <p className="whitespace-pre-wrap text-sm font-bold">{m.text}</p>
              <p className={`text-[10px] mt-1 ${m.senderRole === 'student' ? 'text-slate-400' : 'text-amber-100'}`}>{m.senderRole === 'student' ? 'أنت' : 'الإدارة'}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-slate-400 py-20 font-bold">لا توجد رسائل بعد.</p>}
      </div>
      <div className="mt-4 flex flex-col md:flex-row gap-3">
        <input className="flex-1 border rounded-xl p-3" placeholder="اكتب ردك للإدارة..." value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>{ if(e.key === 'Enter') sendReply(); }} />
        <button onClick={sendReply} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Send size={18}/> إرسال</button>
        <button onClick={markSeen} className="bg-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold hover:bg-slate-300">تم الاطلاع</button>
      </div>
    </div>
  );
};

export const StudentAdminMessagePopup = ({ user, userData }) => {
  const [chatState, setChatState] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const studentId = user?.uid;

  useEffect(() => {
    if (!studentId) return;
    const unsub = onSnapshot(doc(db, 'student_chats', studentId), (snap) => {
      if (snap.exists()) {
        setChatState({ id: snap.id, ...snap.data() });
        setDismissed(false);
      } else {
        setChatState(null);
      }
    }, (error) => {
      console.warn('student chat popup listener blocked:', error?.message);
      setChatState(null);
    });
    return () => unsub();
  }, [studentId]);

  const hasUnreadAdminMessage =
    chatState &&
    chatState.lastSender === 'admin' &&
    (safeNumber(chatState.unreadForStudent, 0) > 0 || chatState.forcePopup || chatState.needsStudentAction) &&
    !dismissed;

  if (!hasUnreadAdminMessage) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-t-8 border-amber-500 overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2"><MessageCircle className="text-amber-400"/> رسالة مهمة من الإدارة</h2>
            <p className="text-slate-300 text-sm mt-1">يرجى قراءة الرسالة قبل متابعة استخدام المنصة.</p>
          </div>
          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-black animate-pulse">جديدة</span>
        </div>

        <div className="p-5">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-4">
            <p className="font-black mb-1">آخر رسالة:</p>
            <p className="font-bold whitespace-pre-wrap">{chatState.lastMessage}</p>
          </div>

          <StudentMessagesPanel
            user={user}
            userData={userData}
            compact={true}
            onAfterReply={() => setDismissed(true)}
          />
        </div>
      </div>
    </div>
  );
};
