import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import useDarkMode from "@/hooks/useDarkMode";
import { RECAPTCHA_CONFIG, isRecaptchaConfigured } from "@/config/recaptcha";

const SCRIPT_CALLBACK = "__billmunshiRecaptchaLoaded";
const SCRIPT_SRC = `https://www.google.com/recaptcha/api.js?onload=${SCRIPT_CALLBACK}&render=explicit`;

// One shared promise for the whole app: every <ReCaptcha> mount awaits
// the same <script> tag instead of appending its own.
let scriptPromise = null;

const loadRecaptchaScript = () => {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.grecaptcha?.render) {
      resolve(window.grecaptcha);
      return;
    }

    // api.js calls this global once grecaptcha is ready to render.
    window[SCRIPT_CALLBACK] = () => resolve(window.grecaptcha);

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      // Drop the cached promise so a later mount can retry the load.
      scriptPromise = null;
      reject(new Error("Failed to load the reCAPTCHA script"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Google reCAPTCHA v2 checkbox.
 *
 * Calls `onChange(token)` when the visitor passes the challenge and
 * `onChange(null)` whenever the token stops being valid — expiry, an
 * internal widget error, or a theme change that forces a re-render.
 * Tokens are single-use, so a form that fails server-side validation
 * must call `ref.current.reset()` before the visitor retries.
 */
const ReCaptcha = forwardRef(({ onChange, error, className = "" }, ref) => {
  const [isDark] = useDarkMode();
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [loadError, setLoadError] = useState("");

  // grecaptcha.render() captures its callbacks once, at render time, so
  // they read the handler through a ref that stays current.
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const reset = useCallback(() => {
    if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch {
        // Widget already torn down — nothing to reset.
      }
    }
    onChangeRef.current?.(null);
  }, []);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  useEffect(() => {
    if (!isRecaptchaConfigured()) return undefined;

    let cancelled = false;
    const container = containerRef.current;

    loadRecaptchaScript()
      .then((grecaptcha) => {
        if (cancelled || !container) return;
        // StrictMode runs mount effects twice in development; a
        // container that already holds a widget must not get a second.
        if (container.childElementCount > 0) return;

        widgetIdRef.current = grecaptcha.render(container, {
          sitekey: RECAPTCHA_CONFIG.SITE_KEY,
          theme: isDark ? "dark" : "light",
          callback: (token) => onChangeRef.current?.(token),
          "expired-callback": () => onChangeRef.current?.(null),
          "error-callback": () => onChangeRef.current?.(null),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(
            "Couldn't load the captcha. Check your connection and reload the page.",
          );
        }
      });

    return () => {
      cancelled = true;
      // A rendered widget can't be re-themed in place, so switching
      // theme tears it down and builds a fresh one — which invalidates
      // any token the visitor had already earned.
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          // Already gone.
        }
      }
      widgetIdRef.current = null;
      if (container) container.innerHTML = "";
      onChangeRef.current?.(null);
    };
  }, [isDark]);

  // No site key: render a hint in development so the gap is visible to
  // whoever is working on the form, and nothing at all in production.
  if (!isRecaptchaConfigured()) {
    if (!import.meta.env.DEV) return null;
    return (
      <p className="flex items-start gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        <Icon icon="heroicons:exclamation-triangle" className="text-xs shrink-0 mt-0.5" />
        <span>
          reCAPTCHA is not configured — set <code>VITE_RECAPTCHA_SITE_KEY</code> to
          show the &ldquo;I&rsquo;m not a robot&rdquo; check.
        </span>
      </p>
    );
  }

  const message = loadError || error;

  return (
    <div className={className}>
      {/* min-height reserves the widget's 78px so the form doesn't jump
          while Google's iframe is still loading. */}
      <div ref={containerRef} className="min-h-[78px]" />
      {message ? (
        <p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
          <Icon icon="heroicons:exclamation-circle" className="text-xs shrink-0 mt-0.5" />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
});

ReCaptcha.displayName = "ReCaptcha";

export default ReCaptcha;
