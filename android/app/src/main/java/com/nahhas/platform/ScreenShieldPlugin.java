package com.nahhas.platform;

import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "ScreenShield")
public class ScreenShieldPlugin extends Plugin {
  @PluginMethod
  public void enable(PluginCall call) {
    getActivity().runOnUiThread(() -> getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE));
    JSObject result = new JSObject();
    result.put("enabled", true);
    call.resolve(result);
  }

  @PluginMethod
  public void disable(PluginCall call) {
    getActivity().runOnUiThread(() -> getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE));
    JSObject result = new JSObject();
    result.put("enabled", false);
    call.resolve(result);
  }
}
