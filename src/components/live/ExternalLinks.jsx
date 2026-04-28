import React from "react";

export default function ExternalLinks({ session }) {
  if (!session) return null;

  const openLink = (url) => {
    if (!url) return alert("الرابط غير متوفر");
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-700">

      <h3 className="text-white font-black text-lg">
        دخول المحاضرة
      </h3>

      {/* Zoom */}
      {session.zoomLink && (
        <button
          onClick={() => openLink(session.zoomLink)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
        >
          دخول Zoom
        </button>
      )}

      {/* Discord */}
      {session.discordLink && (
        <button
          onClick={() => openLink(session.discordLink)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl"
        >
          دخول Discord
        </button>
      )}

      {/* Google Meet */}
      {session.meetLink && (
        <button
          onClick={() => openLink(session.meetLink)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl"
        >
          دخول Google Meet
        </button>
      )}

      {/* Jitsi (لو موجود) */}
      {session.jitsiRoom && (
        <button
          onClick={() =>
            window.open(`https://meet.jit.si/${session.jitsiRoom}`, "_blank")
          }
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl"
        >
          دخول Jitsi
        </button>
      )}

    </div>
  );
}