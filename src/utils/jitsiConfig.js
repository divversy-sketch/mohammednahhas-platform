// إعدادات Jitsi احترافية لمنع الضوضاء والتشويش

export const getJitsiConfig = () => {
  return {
    startWithAudioMuted: true, // كل الطلاب يدخلوا سايلنت
    startWithVideoMuted: true,

    enableNoiseCancellation: true,
    enableNoAudioDetection: true,
    enableNoisyMicDetection: true,

    disableDeepLinking: true,

    prejoinPageEnabled: false,

    resolution: 720,

    constraints: {
      video: {
        height: {
          ideal: 720,
          max: 720,
          min: 240
        }
      }
    },

    audioQuality: {
      stereo: false
    },

    enableLayerSuspension: true,
    disableSimulcast: false
  };
};

export const getJitsiInterfaceConfig = () => {
  return {
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    TOOLBAR_BUTTONS: [
      'microphone',
      'camera',
      'fullscreen',
      'hangup'
    ]
  };
};