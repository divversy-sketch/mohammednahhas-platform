import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@services/firebase';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { parseQuestionBankLines, readDocxParagraphs } from '@features/question-bank/utils/questionBankImport.js';
import { platformNotify } from '@shared/core/platformShared.jsx';
import './smart-teacher.css';

const branches = ['النحو','البلاغة','الأدب','القصة','القراءة','التعبير'];
const normalizePhone = (value='') => String(value).replace(/\D/g,'').slice(-11);

export default function AdminSmartTeacherManager(){
  const [tab,setTab]=useState('groups');
  const [groups,setGroups]=useState([]); const [students,setStudents]=useState([]);
  const [grades,setGrades]=useState(['3sec']); const [branch,setBranch]=useState('النحو');
  const [lesson,setLesson]=useState(''); const [title,setTitle]=useState(''); const [perSession,setPerSession]=useState(10);
  const [hint,setHint]=useState(''); const [rule,setRule]=useState(''); const [example,setExample]=useState(''); const [commonMistake,setCommonMistake]=useState('');
  const [raw,setRaw]=useState(''); const [parsed,setParsed]=useState([]); const [rejected,setRejected]=useState([]); const [saving,setSaving]=useState(false);
  const [selectedStudent,setSelectedStudent]=useState(''); const [parentName,setParentName]=useState(''); const [parentPhone,setParentPhone]=useState('');

  useEffect(()=>onSnapshot(collection(db,'smart_teacher_groups'),s=>setGroups(s.docs.map(d=>({id:d.id,...d.data()}))),()=>setGroups([])),[]);
  useEffect(()=>onSnapshot(query(collection(db,'users'),where('role','==','student')),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))),()=>setStudents([])),[]);
  const parseLines=(lines)=>{ const result=parseQuestionBankLines(lines,{branchMode:'manual',branch,grade:grades[0]||'3sec',difficulty:'medium',tags:['المعلم الذكي',lesson]}); setParsed(result.questions||[]); setRejected(result.rejected||[]); if(result.warnings?.length) platformNotify(`تم الاستيراد مع ${result.warnings.length} ملاحظة`); };
  const handlePaste=()=>parseLines(raw.split(/\r?\n/).map(text=>({text})));
  const handleFile=async(e)=>{ const file=e.target.files?.[0]; if(!file)return; try{ if(/\.docx$/i.test(file.name)) parseLines(await readDocxParagraphs(file)); else parseLines((await file.text()).split(/\r?\n/).map(text=>({text}))); }catch(err){platformNotify(err.message||'تعذر قراءة الملف','error');} e.target.value=''; };
  const toggleGrade=(g)=>setGrades(v=>v.includes(g)?v.filter(x=>x!==g):[...v,g]);
  const saveGroup=async()=>{ if(!lesson.trim()||!title.trim()||!grades.length||!parsed.length)return platformNotify('أكمل بيانات المجموعة واستورد الأسئلة أولًا','error'); setSaving(true); try{
    const groupRef=await addDoc(collection(db,'smart_teacher_groups'),{title:title.trim(),branch,lesson:lesson.trim(),grades,questionsPerSession:Number(perSession)||10,questionCount:parsed.length,hint:hint.trim(),rule:rule.trim(),example:example.trim(),commonMistake:commonMistake.trim(),status:'published',interactiveVideoEnabled:true,checkpoints:[25,50,75],createdAt:serverTimestamp()});
    let batch=writeBatch(db),count=0; for(const q of parsed){ const ref=doc(collection(db,'question_bank')); batch.set(ref,{...q,grade:grades[0],grades,branch,topic:lesson.trim(),lesson:lesson.trim(),smartTeacherGroupId:groupRef.id,smartTeacher:true,createdAt:serverTimestamp()}); count++; if(count%350===0){await batch.commit();batch=writeBatch(db);} } await batch.commit();
    setRaw('');setParsed([]);setRejected([]);setTitle('');setLesson('');setHint('');setRule('');setExample('');setCommonMistake(''); platformNotify('تم نشر مجموعة المعلم الذكي بنجاح');
  }catch(err){platformNotify(err.message||'تعذر الحفظ','error');}finally{setSaving(false);} };
  const linkParent=async()=>{ const student=students.find(s=>s.id===selectedStudent); const phone=normalizePhone(parentPhone); if(!student||phone.length!==11)return platformNotify('اختر الطالب واكتب رقم ولي أمر صحيح','error'); try{
    const ref=doc(db,'parent_links',phone); const snap=await getDocs(query(collection(db,'parent_links'),where('phone','==',phone))); let ids=[student.id]; if(!snap.empty) ids=[...new Set([...(snap.docs[0].data().studentIds||[]),student.id])];
    await setDoc(ref,{phone,parentName:parentName.trim()||'ولي الأمر',studentIds:ids,updatedAt:serverTimestamp()},{merge:true}); await updateDoc(doc(db,'users',student.id),{parentPhone:phone,parentName:parentName.trim()||'ولي الأمر',updatedAt:serverTimestamp()}); platformNotify('تم ربط ولي الأمر بالطالب برقم الهاتف');
  }catch(err){platformNotify(err.message||'تعذر الربط','error');} };

  return <div className="st-admin" dir="rtl"><div className="st-admin-hero"><div className="st-logo">ن<span>✦</span></div><div><small>منصة النحاس</small><h2>المعلم الذكي</h2><p>بنك أسئلة تكيفي وفيديوهات تفاعلية بدون خدمات مدفوعة.</p></div></div>
    <div className="st-tabs"><button className={tab==='groups'?'active':''} onClick={()=>setTab('groups')}>مجموعات التدريب</button><button className={tab==='help'?'active':''} onClick={()=>setTab('help')}>بطاقة مساعدة الدرس</button><button className={tab==='parents'?'active':''} onClick={()=>setTab('parents')}>ربط ولي الأمر</button></div>
    {tab!=='parents'&&<section className="st-card"><div className="st-grid"><label>عنوان المجموعة<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="تدريبات اسم الفاعل"/></label><label>الفرع<select value={branch} onChange={e=>setBranch(e.target.value)}>{branches.map(x=><option key={x}>{x}</option>)}</select></label><label>اسم الدرس<input value={lesson} onChange={e=>setLesson(e.target.value)} placeholder="اسم الفاعل"/></label><label>عدد أسئلة الجلسة<input type="number" min="1" max="50" value={perSession} onChange={e=>setPerSession(e.target.value)}/></label></div>
      <div className="st-grade-box"><strong>تظهر للصفوف:</strong>{GradeOptions.map(g=><button key={g.value} className={grades.includes(g.value)?'active':''} onClick={()=>toggleGrade(g.value)}>{g.label}</button>)}</div>
      <div className="st-help-grid"><label>التلميح العام<textarea value={hint} onChange={e=>setHint(e.target.value)} placeholder="اسأل نفسك: من الذي قام بالفعل؟"/></label><label>القاعدة المختصرة<textarea value={rule} onChange={e=>setRule(e.target.value)} placeholder="يُصاغ اسم الفاعل..."/></label><label>مثال<textarea value={example} onChange={e=>setExample(e.target.value)} placeholder="كتب ← كاتب"/></label><label>خطأ شائع<textarea value={commonMistake} onChange={e=>setCommonMistake(e.target.value)} placeholder="الخلط بين اسم الفاعل واسم المفعول"/></label></div>
      <div className="st-import"><h3>نفس مستورد بنك الأسئلة</h3><textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder="الصق مجموعة الأسئلة كاملة هنا بنفس التنسيق المعتاد..."/><div><button onClick={handlePaste}>تحليل النص</button><label className="st-file">رفع Word أو TXT<input type="file" accept=".docx,.txt" onChange={handleFile}/></label></div></div>
      {(parsed.length>0||rejected.length>0)&&<div className="st-review"><b>تم التعرف على {parsed.length} سؤال</b><span>{rejected.length} يحتاج مراجعة</span><div className="st-preview">{parsed.slice(0,8).map((q,i)=><article key={i}><strong>{i+1}. {q.text}</strong><small>{q.options?.join(' • ')}</small></article>)}</div></div>}
      <button className="st-publish" disabled={saving} onClick={saveGroup}>{saving?'جاري الحفظ...':'حفظ ونشر المجموعة'}</button></section>}
    {tab==='parents'&&<section className="st-card"><h3>ربط ولي الأمر في خطوة واحدة</h3><p className="st-muted">اختار الطالب واكتب رقم ولي الأمر. لا تحتاج إلى نسخ أي UID.</p><div className="st-grid"><label>الطالب<select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)}><option value="">اختر الطالب</option>{students.map(s=><option key={s.id} value={s.id}>{s.name||s.email} — {getGradeLabel(s.grade)}</option>)}</select></label><label>اسم ولي الأمر<input value={parentName} onChange={e=>setParentName(e.target.value)}/></label><label>رقم الموبايل<input value={parentPhone} onChange={e=>setParentPhone(e.target.value)} placeholder="01xxxxxxxxx"/></label></div><button className="st-publish" onClick={linkParent}>ربط ولي الأمر بالطالب</button></section>}
    <section className="st-card"><h3>المجموعات المنشورة</h3><div className="st-groups">{groups.map(g=><article key={g.id}><b>{g.title}</b><span>{g.branch} • {g.lesson}</span><small>{g.questionCount||0} سؤال — {(g.grades||[]).map(getGradeLabel).join('، ')}</small></article>)}{!groups.length&&<p className="st-muted">لا توجد مجموعات بعد.</p>}</div></section>
  </div>;
}
