package com.nahhas.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ScreenShieldPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
