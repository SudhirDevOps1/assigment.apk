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
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * The whole assignment is an ordinary web page, so the only native work
 * needed here is to let the page behave like a real document viewer:
 * pinch zoom, fit-to-width, and a stable 100 % text size.
 */
public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
      WebView webView = getBridge() != null ? getBridge().getWebView() : null;
      if (webView == null) return;

      WebSettings s = webView.getSettings();

      // pinch-to-zoom in, built-in zoom control so the on-screen + / - is gone
      s.setSupportZoom(true);
      s.setBuiltInZoomControls(true);
      s.setDisplayZoomControls(false);

      // let the page use the real screen width and shrink to fit when needed
      s.setUseWideViewPort(true);
      s.setLoadWithOverviewMode(true);

      // keep text at exactly 100 % - the CSS already handles scaling
      s.setTextZoom(100);

      s.setMediaPlaybackRequiresUserGesture(true);
    } catch (Throwable ignored) {
      // never let a nicety stop the app from starting
    }
  }
}
`);
  done.push('MainActivity.java   -> pinch zoom, wide viewport, text zoom 100 %');
} else {
  console.warn('! MainActivity.java not found - zoom tweaks skipped');
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