package com.nahhas.platform;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * قفل الامتحان: بيثبّت التطبيق على الشاشة (App Pinning) طول الامتحان.
 * وهو متثبّت: زرار الهوم والتطبيقات الأخيرة بيقفوا، شريط الإشعارات ما بينزلش،
 * والإشعارات اللي بتطلع فوق الشاشة ما بتظهرش.
 * أندرويد بيطلب موافقة الطالب أول مرة (ده إجباري من النظام لأي تطبيق عادي).
 */
@CapacitorPlugin(name = "ExamLock")
public class ExamLockPlugin extends Plugin {

  private String stateName() {
    ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
    if (am == null) return "none";
    int s = am.getLockTaskModeState();
    if (s == ActivityManager.LOCK_TASK_MODE_PINNED) return "pinned";
    if (s == ActivityManager.LOCK_TASK_MODE_LOCKED) return "locked";
    return "none";
  }

  private JSObject stateResult() {
    JSObject r = new JSObject();
    String s = stateName();
    r.put("state", s);
    r.put("active", !"none".equals(s));
    return r;
  }

  @PluginMethod
  public void start(PluginCall call) {
    Activity activity = getActivity();
    activity.runOnUiThread(() -> {
      try {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if ("none".equals(stateName())) activity.startLockTask();
        call.resolve(stateResult());
      } catch (Exception e) {
        call.reject("startLockTask failed: " + e.getMessage());
      }
    });
  }

  @PluginMethod
  public void stop(PluginCall call) {
    Activity activity = getActivity();
    activity.runOnUiThread(() -> {
      try {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (!"none".equals(stateName())) activity.stopLockTask();
      } catch (Exception ignored) { }
      call.resolve(stateResult());
    });
  }

  @PluginMethod
  public void getState(PluginCall call) {
    call.resolve(stateResult());
  }
}
