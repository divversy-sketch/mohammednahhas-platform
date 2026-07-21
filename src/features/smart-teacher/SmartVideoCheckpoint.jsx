import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import './smart-teacher.css';
export default function SmartVideoCheckpoint({video,videoRef,user}){
 const [group,setGroup]=useState(null),[questions,setQuestions]=useState([]),[show,setShow]=useState(false),[qIndex,setQIndex]=useState(0),[wrong,setWrong]=useState(0); const passed=useRef(new Set());
 useEffect(()=>{let alive=true;(async()=>{const lesson=video?.lesson||video?.topic||video?.title;if(!lesson)return;const s=await getDocs(query(collection(db,'smart_teacher_groups'),where('lesson','==',lesson)));const g=s.docs.map(d=>({id:d.id,...d.data()})).find(x=>x.status!=='disabled');if(!g||!alive)return;setGroup(g);const qs=await getDocs(query(collection(db,'question_bank'),where('smartTeacherGroupId','==',g.id)));if(alive)setQuestions(qs.docs.map(d=>({id:d.id,...d.data()})).sort(()=>Math.random()-.5));})();return()=>{alive=false};},[video?.id,video?.lesson,video?.title]);
 useEffect(()=>{const el=videoRef?.current;if(!el||!group||!questions.length)return;const fn=()=>{const pct=el.duration?Math.round(el.currentTime/el.duration*100):0;const cp=(group.checkpoints||[25,50,75]).find(x=>pct>=x&&!passed.current.has(x));if(cp){passed.current.add(cp);el.pause();setShow(true);setQIndex((qIndex+1)%questions.length);}};el.addEventListener('timeupdate',fn);return()=>el.removeEventListener('timeupdate',fn);},[videoRef,group,questions,qIndex]);
 if(!show||!questions[qIndex])return null;const q=questions[qIndex];const answer=(i)=>{if(i===q.correctIdx){setShow(false);setWrong(0);videoRef.current?.play?.();}else{setWrong(v=>v+1);setQIndex(v=>(v+1)%questions.length);}};
 return <div className="st-video-gate" dir="rtl"><div><span className="st-mini-logo">ن✦</span><h3>سؤال سريع قبل استكمال الشرح</h3><p>{q.text}</p><div>{(q.options||[]).map((op,i)=><button key={i} onClick={()=>answer(i)}>{op}</button>)}</div>{wrong>=1&&group.hint&&<small>💡 {group.hint}</small>}{wrong>=2&&group.rule&&<small>📘 {group.rule}</small>}</div></div>;
}
