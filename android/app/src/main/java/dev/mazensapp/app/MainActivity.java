package dev.mazensapp.app;

import android.os.Build;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onResume() {
    super.onResume();

    // Requires API 28+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      this.getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;

      View decorView = this.getWindow().getDecorView();

      decorView.setSystemUiVisibility(
          View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          // Set the content to appear under the system bars so that the
          // content doesn't resize when the system bars hide and show.
          | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          // Hide the nav bar and status bar
          // | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          // | View.SYSTEM_UI_FLAG_FULLSCREEN
      );
    }
  }
}
