package com.nahhas.platform;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.view.WindowManager;
import androidx.core.content.ContextCompat;
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

  // آخر مرة الشاشة اتقفلت (زرار الباور): عشان قفل الشاشة ما يتحسبش خروج من الامتحان.
  private long lastScreenOffAt = 0;
  private long lastScreenOnAt = 0;
  private BroadcastReceiver screenReceiver;

  @Override
  public void load() {
    screenReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) lastScreenOffAt = System.currentTimeMillis();
        else if (Intent.ACTION_SCREEN_ON.equals(intent.getAction())) lastScreenOnAt = System.currentTimeMillis();
      }
    };
    IntentFilter filter = new IntentFilter();
    filter.addAction(Intent.ACTION_SCREEN_OFF);
    filter.addAction(Intent.ACTION_SCREEN_ON);
    try {
      ContextCompat.registerReceiver(getContext(), screenReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
    } catch (Exception ignored) { }
  }

  @Override
  protected void handleOnDestroy() {
    try { if (screenReceiver != null) getContext().unregisterReceiver(screenReceiver); } catch (Exception ignored) { }
  }

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
    r.put("lastScreenOffAt", lastScreenOffAt);
    r.put("lastScreenOnAt", lastScreenOnAt);
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
