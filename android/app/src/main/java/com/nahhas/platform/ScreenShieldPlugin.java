package com.nahhas.platform;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenShield")
public class ScreenShieldPlugin extends Plugin {
  private static volatile boolean examLockActive = false;

  public static boolean isExamLockActive() {
    return examLockActive;
  }

  @SuppressWarnings("deprecation")
  public static void applyImmersiveExamUi(Activity activity, boolean enabled) {
    if (activity == null) return;
    Window window = activity.getWindow();
    if (window == null) return;

    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    if (enabled) {
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    } else {
      window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowInsetsController controller = window.getInsetsController();
      if (controller != null) {
        if (enabled) {
          controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
          controller.setSystemBarsBehavior(
              WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        } else {
          controller.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
        }
      }
    }

    View decorView = window.getDecorView();
    if (decorView != null) {
      if (enabled) {
        int flags =
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
        decorView.setSystemUiVisibility(flags);
      } else {
        decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
      }
    }
  }

  @SuppressWarnings("deprecation")
  public static boolean isAppPinned(Activity activity) {
    if (activity == null) return false;
    try {
      ActivityManager am = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
      if (am == null) return false;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        return am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
      }
      return am.isInLockTaskMode();
    } catch (Exception ignored) {
      return false;
    }
  }

  public static void setExamLockState(Activity activity, boolean enabled, boolean pinScreen) {
    examLockActive = enabled;
    if (activity == null) return;
    activity.runOnUiThread(
        () -> {
          applyImmersiveExamUi(activity, enabled);
          if (enabled && pinScreen) {
            try {
              if (!isAppPinned(activity)) {
                activity.startLockTask();
              }
            } catch (Exception ignored) {
              // Lock task not permitted by current device state
            }
          } else if (!enabled) {
            try {
              if (isAppPinned(activity)) {
                activity.stopLockTask();
              }
            } catch (Exception ignored) {
              // Already unpinned
            }
          }
        });
  }

  @PluginMethod
  public void enable(PluginCall call) {
    boolean examMode = Boolean.TRUE.equals(call.getBoolean("examMode", false));
    boolean pinScreen = Boolean.TRUE.equals(call.getBoolean("pinScreen", examMode));
    Activity activity = getActivity();
    if (activity != null) {
      if (examMode) {
        setExamLockState(activity, true, pinScreen);
      } else {
        activity.runOnUiThread(
            () -> activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE));
      }
    }
    JSObject result = new JSObject();
    result.put("enabled", true);
    result.put("examMode", examLockActive);
    result.put("pinned", isAppPinned(activity));
    call.resolve(result);
  }

  @PluginMethod
  public void disable(PluginCall call) {
    Activity activity = getActivity();
    if (activity != null) {
      setExamLockState(activity, false, false);
    }
    JSObject result = new JSObject();
    result.put("enabled", true);
    result.put("examMode", false);
    result.put("pinned", false);
    call.resolve(result);
  }

  @PluginMethod
  public void startExamLock(PluginCall call) {
    boolean pinScreen = Boolean.TRUE.equals(call.getBoolean("pinScreen", true));
    Activity activity = getActivity();
    setExamLockState(activity, true, pinScreen);
    JSObject result = new JSObject();
    result.put("enabled", true);
    result.put("examMode", true);
    result.put("pinned", isAppPinned(activity));
    call.resolve(result);
  }

  @PluginMethod
  public void stopExamLock(PluginCall call) {
    Activity activity = getActivity();
    setExamLockState(activity, false, false);
    JSObject result = new JSObject();
    result.put("enabled", true);
    result.put("examMode", false);
    result.put("pinned", false);
    call.resolve(result);
  }
}
