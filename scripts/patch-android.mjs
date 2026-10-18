/**
 * patch-android.mjs
 * ------------------------------------------------------------------
 * Applies the small native tweaks that Capacitor does not configure on
 * its own. Everything here is idempotent, so the script can be run on
 * every CI build without ever double-patching anything.
 *
 *   1. MainActivity - pinch zoom, wide viewport, stable 100 % text size
 *   2. Manifest     - allow the device to rotate in every orientation and
 *                     resize properly when the keyboard opens
 *
 * Run:  node scripts/patch-android.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const android = resolve(root, 'android');

if (!existsSync(android)) {
  console.error('android/ not found. Run:  npx cap add android');
  process.exit(1);
}

const done = [];

/* --------------------------------------------------------- find helper --- */
function findFile(dir, name) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const hit = findFile(full, name);
      if (hit) return hit;
    } else if (entry.name === name) {
      return full;
    }
  }
  return null;
}

/* ------------------------------------------------------ 1. MainActivity ---- */
const javaPath = findFile(resolve(android, 'app/src/main/java'), 'MainActivity.java');

if (javaPath) {
  writeFileSync(javaPath, `package in.bca.sem5.assignment;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * The assignment is an ordinary web page, so the native work is only to make
 * it behave like a proper document reader:
 *
 *   - true edge-to-edge drawing, with the status and navigation bars hidden
 *     (a swipe from the edge brings them back, and they fade out again)
 *   - pinch zoom, real screen width, text pinned at 100 %
 *   - no blue "glow" overscroll that a PDF reader never shows
 */
public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    enterImmersiveMode();
    tuneWebView();
  }

  @Override
  public void onResume() {
    super.onResume();
    enterImmersiveMode();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) enterImmersiveMode();
  }

  /** Draw behind the system bars and hide them until the user swipes. */
  private void enterImmersiveMode() {
    try {
      WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
      WindowInsetsControllerCompat controller =
          WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
      controller.setSystemBarsBehavior(
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
      controller.hide(WindowInsetsCompat.Type.systemBars());
    } catch (Throwable ignored) {
      // immersive mode is a nicety, never a reason to fail to start
    }
  }

  private void tuneWebView() {
    try {
      WebView webView = getBridge() != null ? getBridge().getWebView() : null;
      if (webView == null) return;

      WebSettings s = webView.getSettings();

      // pinch-to-zoom in, built-in control so the on-screen + / - is gone
      s.setSupportZoom(true);
      s.setBuiltInZoomControls(true);
      s.setDisplayZoomControls(false);

      // real screen width, shrink to fit when the page is wider
      s.setUseWideViewPort(true);
      s.setLoadWithOverviewMode(true);

      // keep text at exactly 100 % - the CSS handles any scaling
      s.setTextZoom(100);

      s.setMediaPlaybackRequiresUserGesture(true);

      // no overscroll glow, like a real document reader
      webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    } catch (Throwable ignored) {
      // never let a nicety stop the app from starting
    }
  }
}
`);
  done.push('MainActivity.java   -> immersive full screen, pinch zoom, no overscroll glow');
} else {
  console.warn('! MainActivity.java not found - zoom and full screen tweaks skipped');
}

/* ------------------------------------------------------- 2. AndroidManifest */
const manifest = resolve(android, 'app/src/main/AndroidManifest.xml');
if (existsSync(manifest)) {
  let m = readFileSync(manifest, 'utf8');

  if (!m.includes('android:screenOrientation')) {
    const before = m;
    m = m.replace(
      /(<activity\b[^>]*?android:name="\.MainActivity")/,
      '$1\n        android:screenOrientation="fullUser"\n        android:windowSoftInputMode="adjustResize"'
    );
    if (m !== before) {
      writeFileSync(manifest, m, 'utf8');
      done.push('AndroidManifest.xml -> screenOrientation="fullUser" + adjustResize');
    } else {
      console.warn('! could not locate the MainActivity entry in AndroidManifest.xml');
    }
  } else {
    done.push('AndroidManifest.xml -> already patched, left untouched');
  }
} else {
  console.warn('! AndroidManifest.xml not found');
}

/* --------------------------------------------------------------- summary -- */
console.log('android project patched:');
for (const line of done) console.log('  + ' + line);