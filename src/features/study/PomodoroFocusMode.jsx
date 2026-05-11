import { useState, useEffect, useRef } from 'react';
import { Headphones, X, CheckCircle, Pause, Play, RefreshCw, PlusCircle, Check } from '../../shared/icons/lucide-shim.jsx';

const PomodoroFocusMode = ({ onClose }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const audioRef = useRef(null);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) { interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000); } 
        else if (timeLeft === 0) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); audio.play();
            if (isBreak) { setIsBreak(false); setTimeLeft(25 * 60); setIsActive(false); } 
            else { setIsBreak(true); setTimeLeft(5 * 60); setIsActive(false); }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak]);

    const toggleTimer = () => {
        setIsActive(!isActive);
        if(!isActive && audioRef.current && !isBreak) { audioRef.current.play().catch(() => {}); } 
        else if(isActive && audioRef.current) { audioRef.current.pause(); }
    };

    const addTask = (e) => { e.preventDefault(); if(newTask.trim()) { setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]); setNewTask(""); } };
    const toggleTask = (id) => { setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)); };

    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
                <div className="flex items-center gap-2 text-2xl font-bold text-amber-400"><Headphones/> وضع التركيز (Pomodoro)</div>
                <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition"><X size={24}/></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row p-6 gap-8 overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/50 rounded-3xl p-8 border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-6 left-6 flex gap-2">
                        <button onClick={() => { setIsBreak(false); setTimeLeft(25 * 60); setIsActive(false); }} className={`px-4 py-1 rounded-full text-sm font-bold transition ${!isBreak ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>مذاكرة (25)</button>
                        <button onClick={() => { setIsBreak(true); setTimeLeft(5 * 60); setIsActive(false); }} className={`px-4 py-1 rounded-full text-sm font-bold transition ${isBreak ? 'bg-green-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>راحة (5)</button>
                    </div>
                    <div className={`text-9xl font-black font-sans my-12 drop-shadow-2xl tracking-widest ${isBreak ? 'text-green-400' : 'text-amber-400'}`}>{m}:{s}</div>
                    <div className="flex items-center gap-6">
                        <button onClick={toggleTimer} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 ${isActive ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-white text-slate-900 shadow-white/20'}`}>
                            {isActive ? <Pause size={40} fill="currentColor"/> : <Play size={40} fill="currentColor" className="ml-2"/>}
                        </button>
                        <button onClick={() => setTimeLeft(isBreak ? 5*60 : 25*60)} className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition text-slate-300"><RefreshCw size={24}/></button>
                    </div>
                    <p className="mt-8 text-slate-400 flex items-center gap-2"><Headphones size={16}/> موسيقى Lo-Fi للتركيز تعمل تلقائياً أثناء جلسة المذاكرة</p>
                </div>
                <div className="w-full lg:w-96 flex flex-col gap-4">
                    <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><CheckCircle className="text-amber-400"/> مهام الجلسة</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                            {tasks.length === 0 ? <p className="text-slate-500 text-center mt-10">أضف مهامك هنا لتركز عليها.</p> : tasks.map(t => (
                                <div key={t.id} onClick={() => toggleTask(t.id)} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${t.done ? 'bg-slate-700/50 border-slate-600 text-slate-500 line-through' : 'bg-slate-700 border-slate-500 text-white'}`}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${t.done ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-400'}`}>
                                        {t.done && <Check size={14} strokeWidth={4}/>}
                                    </div>
                                    <span className="font-bold">{t.text}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addTask} className="flex gap-2">
                            <input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="أضف مهمة جديدة..." className="flex-1 bg-slate-900 border border-slate-600 rounded-xl p-3 outline-none focus:border-amber-500 transition"/>
                            <button type="submit" className="bg-amber-600 text-white p-3 rounded-xl font-bold hover:bg-amber-700"><PlusCircle/></button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default PomodoroFocusMode;
