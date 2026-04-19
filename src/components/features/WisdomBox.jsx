import React, { useState, useEffect } from 'react';
import { query, collection, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase'; // استدعاء قاعدة البيانات
import { Quote, Feather } from 'lucide-react';

const WisdomBox = () => {
  const [idx, setIdx] = useState(0);
  const [quotes, setQuotes] = useState([
    { text: "النجاح مش صدفة، النجاح عزيمة وإصرار", source: "تحفيز" }, 
    { text: "ذاكر صح، مش تذاكر كتير.. ركز يا بطل", source: "نصيحة" }, 
    { text: "حلمك يستاهل تعبك، متوقفش", source: "تحفيز" }, 
    { text: "وَمَا نَيْلُ الْمَطَالِبِ بِالتَّمَنِّي ... وَلَكِنْ تُؤْخَذُ الدُّنْيَا غِلَابَا", source: "شعر" }
  ]);

  useEffect(() => {
      const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => { if (!snap.empty) setQuotes(snap.docs.map(d => d.data())); });
      return () => unsub();
  }, []);

  useEffect(() => { 
      const t = setInterval(() => setIdx(i => (i+1)%quotes.length), 6000); 
      return () => clearInterval(t); 
  }, [quotes]);

  if (quotes.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-600 to-amber-800 text-white p-8 rounded-2xl shadow-xl mb-8 overflow-hidden z-20 border-2 border-amber-400/30">
      <div className="absolute top-0 right-0 p-4 opacity-10"><Feather size={100} /></div>
      <Quote className="absolute top-4 left-4 text-amber-300 opacity-40 w-12 h-12" />
      <div className="relative z-10 text-center">
        <p className="text-2xl font-arabic font-bold mb-3 drop-shadow-md transition-opacity duration-500">"{quotes[idx].text}"</p>
        <span className="bg-black/20 px-4 py-1 rounded-full text-sm font-bold border border-white/20 text-amber-200">- {quotes[idx].source}</span>
      </div>
    </div>
  );
};

export default WisdomBox;