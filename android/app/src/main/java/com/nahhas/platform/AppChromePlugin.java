package com.nahhas.platform;

import android.graphics.Color;
import android.view.Window;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Paints the window behind the system bars with the screen colour so no stripe shows on any phone. */
@CapacitorPlugin(name = "AppChrome")
public class AppChromePlugin extends Plugin {
  @PluginMethod
  public void setColor(PluginCall call) {
    final String value = call.getString("color", "#0B0908");
    getActivity().runOnUiThread(() -> {
      try {
        int color = Color.parseColor(value);
        Window window = getActivity().getWindow();
        window.getDecorView().setBackgroundColor(color);
        if (getBridge() != null && getBridge().getWebView() != null) {
          getBridge().getWebView().setBackgroundColor(color);
        }
        call.resolve();
      } catch (Exception e) {
        call.reject("bad color");
      }
    });
  }
}
