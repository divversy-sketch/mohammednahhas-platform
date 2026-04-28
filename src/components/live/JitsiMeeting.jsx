import React, { useEffect, useRef } from "react";

export default function JitsiMeeting({ roomName, user, isAdmin, onClose }) {
  const jitsiRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    const domain = "meet.jit.si";

    const options = {
      roomName,

      parentNode: jitsiRef.current,

      width: "100%",
      height: "100%",

      userInfo: {
        displayName: user?.displayName || "طالب",
        email: user?.email || ""
      },

      configOverwrite: {
        startWithAudioMuted: !isAdmin,
        startWithVideoMuted: true,

        enableNoiseCancellation: true,
        enableNoAudioDetection: true,
        enableNoisyMicDetection: true,

        disableDeepLinking: true,
        prejoinPageEnabled: false,

        // 🔥 يمنع الكل يفتح المايك إلا المدرس
        startAudioOnly: true,
        enableTalkWhileMuted: false,

        // جودة أفضل
        resolution: 720,
        constraints: {
          video: {
            height: {
              ideal: 720,
              max: 720,
              min: 240
            }
          }
        }
      },

      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,

        TOOLBAR_BUTTONS: isAdmin
          ? [
              "microphone",
              "camera",
              "desktop",
              "fullscreen",
              "hangup"
            ]
          : [
              "fullscreen",
              "hangup"
            ]
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    // 🔥 Mute إجباري للطلاب
    api.addEventListener("videoConferenceJoined", () => {
      if (!isAdmin) {
        api.executeCommand("toggleAudio");
      }
    });

    // 🔥 أي حد يفتح مايك → يتقفل تلقائي
    api.addEventListener("audioMuteStatusChanged", (e) => {
      if (!isAdmin && e.muted === false) {
        api.executeCommand("toggleAudio");
      }
    });

    // 🔥 خروج
    api.addEventListener("readyToClose", () => {
      onClose?.();
    });

    return () => {
      api.dispose();
    };
  }, [roomName, user, isAdmin, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-[100]" dir="rtl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 text-white p-3 flex justify-between items-center z-50">
        <span className="font-bold">محاضرة مباشرة</span>

        <button
          onClick={onClose}
          className="bg-red-600 px-4 py-1 rounded-lg font-bold"
        >
          خروج
        </button>
      </div>

      {/* Jitsi Container */}
      <div
        ref={jitsiRef}
        className="w-full h-full"
        style={{ marginTop: "50px" }}
      />
    </div>
  );
}