package com.nahhas.platform;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private final Handler examWatchHandler = new Handler(Looper.getMainLooper());
  private boolean lastDetectedExamDom = false;

  private final Runnable examDomWatcher =
      new Runnable() {
        @Override
        public void run() {
          try {
            if (bridge != null && bridge.getWebView() != null) {
              WebView webView = bridge.getWebView();
              String script =
                  "(function(){"
                      + "if(!window.__nxShieldHooked){"
                      + "window.__nxShieldHooked=true;"
                      + "window.addEventListener('blur',function(e){"
                      + "if(window.__nxPinningGraceUntil&&Date.now()<window.__nxPinningGraceUntil){"
                      + "e.stopImmediatePropagation();"
                      + "}"
                      + "},true);"
                      + "}"
                      + "var fsBtn=document.querySelector('.cxe-band button[title=\"ملء الشاشة\"]');"
                      + "if(fsBtn&&!fsBtn.__nxPinHooked){"
                      + "fsBtn.__nxPinHooked=true;"
                      + "fsBtn.addEventListener('click',function(){"
                      + "window.__nxPinningGraceUntil=Date.now()+6000;"
                      + "window.__nxForcePinRequest=true;"
                      + "});"
                      + "}"
                      + "var inExam=Boolean(document.querySelector('.cxe')&&!document.querySelector('.cxr'));"
                      + "if(inExam&&!window.__nxWasInExam){"
                      + "window.__nxPinningGraceUntil=Date.now()+6000;"
                      + "}"
                      + "window.__nxWasInExam=inExam;"
                      + "if(window.__nxForcePinRequest){window.__nxForcePinRequest=false;return '2';}"
                      + "return inExam?'1':'0';"
                      + "})()";
              webView.evaluateJavascript(
                  script,
                  value -> {
                    boolean forcePin = value != null && value.contains("2");
                    boolean inExam = forcePin || (value != null && value.contains("1"));
                    if (forcePin || inExam != lastDetectedExamDom) {
                      lastDetectedExamDom = inExam;
                      ScreenShieldPlugin.setExamLockState(MainActivity.this, inExam, inExam);
                    } else if (inExam) {
                      ScreenShieldPlugin.applyImmersiveExamUi(MainActivity.this, true);
                    }
                  });
            }
          } catch (Exception ignored) {
          }
          examWatchHandler.postDelayed(this, 1200);
        }
      };

  @Override
  @SuppressWarnings("deprecation")
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ScreenShieldPlugin.class);
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      WindowManager.LayoutParams lp = getWindow().getAttributes();
      lp.layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
      getWindow().setAttributes(lp);
    }

    ScreenShieldPlugin.applySafeWindowInsets(this);

    if (bridge != null && bridge.getWebView() != null) {
      WebSettings settings = bridge.getWebView().getSettings();
      settings.setTextZoom(100);
      settings.setUseWideViewPort(true);
      settings.setLoadWithOverviewMode(true);
    }

    getWindow()
        .getDecorView()
        .setOnSystemUiVisibilityChangeListener(
            visibility -> {
              if (ScreenShieldPlugin.isExamLockActive()) {
                ScreenShieldPlugin.applyImmersiveExamUi(MainActivity.this, true);
              }
            });
  }

  @Override
  public void onResume() {
    super.onResume();
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    ScreenShieldPlugin.applySafeWindowInsets(this);
    if (ScreenShieldPlugin.isExamLockActive()) {
      ScreenShieldPlugin.applyImmersiveExamUi(this, true);
    }
    examWatchHandler.removeCallbacks(examDomWatcher);
    examWatchHandler.postDelayed(examDomWatcher, 800);
  }

  @Override
  public void onPause() {
    examWatchHandler.removeCallbacks(examDomWatcher);
    super.onPause();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus && ScreenShieldPlugin.isExamLockActive()) {
      ScreenShieldPlugin.applyImmersiveExamUi(this, true);
    }
  }

  @Override
  @SuppressWarnings("deprecation")
  public void onBackPressed() {
    if (ScreenShieldPlugin.isExamLockActive()) {
      ScreenShieldPlugin.applyImmersiveExamUi(this, true);
      return;
    }
    super.onBackPressed();
  }
}
