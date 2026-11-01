package com.nahhas.platform;

import android.app.Activity;
import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * تقرير الامتحان: بيفتح شاشة الطباعة بتاعة أندرويد (ومنها «حفظ بتنسيق PDF»)
 * للتقرير اللي المنصة بتجهّزه. PDF حقيقي والعربي سليم.
 */
@CapacitorPlugin(name = "ReportPrint")
public class ReportPrintPlugin extends Plugin {
  private WebView printView;

  @PluginMethod
  public void print(PluginCall call) {
    final String html = call.getString("html", "");
    final String name = call.getString("name", "تقرير");
    final Activity activity = getActivity();
    activity.runOnUiThread(() -> {
      try {
        WebView view = new WebView(activity);
        view.getSettings().setJavaScriptEnabled(false);
        view.setWebViewClient(new WebViewClient() {
          private boolean done = false;
          @Override
          public void onPageFinished(WebView v, String url) {
            if (done) return;
            done = true;
            // مهلة صغيرة عشان الخطوط والصور تخلص تحميل
            v.postDelayed(() -> {
              try {
                PrintManager pm = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter adapter = v.createPrintDocumentAdapter(name);
                PrintAttributes attrs = new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build();
                pm.print(name, adapter, attrs);
                call.resolve();
              } catch (Exception e) {
                call.reject("print failed: " + e.getMessage());
              }
            }, 900);
          }
        });
        view.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
        printView = view; // لازم يفضل محفوظ لحد ما الطباعة تخلص
      } catch (Exception e) {
        call.reject("print failed: " + e.getMessage());
      }
    });
  }
}
