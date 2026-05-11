export function registerPWAUpdate() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      const showUpdateBanner = (waitingWorker) => {
        if (!waitingWorker) return;

        const existing = document.getElementById("pwa-update-banner");
        if (existing) return;

        const banner = document.createElement("div");
        banner.id = "pwa-update-banner";
        banner.dir = "rtl";
        banner.style.cssText = `
          position: fixed;
          left: 16px;
          right: 16px;
          bottom: 16px;
          z-index: 999999;
          background: #0f172a;
          color: white;
          border: 1px solid rgba(245, 158, 11, .6);
          box-shadow: 0 20px 40px rgba(0,0,0,.25);
          border-radius: 18px;
          padding: 14px;
          font-family: Cairo, Arial, sans-serif;
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          max-width: 560px;
          margin: auto;
        `;

        banner.innerHTML = `
          <div>
            <div style="font-weight: 900; font-size: 15px;">تحديث جديد متاح للمنصة</div>
            <div style="opacity:.8; font-size: 12px; margin-top: 2px;">اضغط تحديث للحصول على آخر نسخة واللوجو الجديد.</div>
          </div>
          <button id="pwa-update-now" style="
            background:#d97706;
            color:white;
            border:0;
            border-radius:12px;
            padding:10px 16px;
            font-weight:900;
            cursor:pointer;
            white-space:nowrap;
          ">تحديث الآن</button>
        `;

        document.body.appendChild(banner);

        document.getElementById("pwa-update-now")?.addEventListener("click", () => {
          waitingWorker.postMessage({ type: "SKIP_WAITING" });
        });
      };

      if (registration.waiting) {
        showUpdateBanner(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateBanner(newWorker);
          }
        });
      });

      // Check for updates every 60 minutes while app is open.
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);

    } catch (error) {
      console.warn("SW registration failed:", error);
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
