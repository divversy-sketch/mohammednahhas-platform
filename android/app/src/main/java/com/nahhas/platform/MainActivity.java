package com.nahhas.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ScreenShieldPlugin.class);
    registerPlugin(AppChromePlugin.class);
    super.onCreate(savedInstanceState);
    // Phones with a large "font size" setting would otherwise blow the text up and push content out of the screen.
    if (getBridge() != null && getBridge().getWebView() != null) {
      getBridge().getWebView().getSettings().setTextZoom(100);
    }
  }
}
