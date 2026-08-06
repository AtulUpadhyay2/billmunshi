import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { COOKIE_CATEGORIES } from "@/config/cookies";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Per-category consent panel.
 *
 * Opens from the banner's "Customise" and from any "Cookie settings"
 * link. Optional categories start from whatever the visitor previously
 * chose — never pre-ticked on a first visit, which is the requirement
 * that makes the consent valid in the first place.
 *
 * Closing without saving deliberately changes nothing: an unanswered
 * panel leaves the banner up rather than being taken as agreement.
 */
const CookiePreferences = ({
  initial,
  onSave,
  onAcceptAll,
  onRejectAll,
  onClose,
}) => {
  const [selection, setSelection] = useState(() => ({ ...initial }));
  const [expanded, setExpanded] = useState(null);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const toggle = (id) =>
    setSelection((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Focus trap — a dialog the keyboard can wander out of isn't a
      // dialog as far as assistive tech is concerned.
      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    dialogRef.current?.focus({ preventScroll: true });

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
      // Send focus back where it came from, so a keyboard user isn't
      // dumped at the top of the document.
      restoreFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    // Above the app's own modals (z-99999): this dialog is only ever
    // opened deliberately, and once open it owns the screen.
    <div
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop is inert on click: dismissing by accident must not
          resolve a consent question either way. */}
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        tabIndex={-1}
        className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-3.5">
            <span className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 items-center justify-center">
              <Icon
                icon="heroicons:cog-6-tooth"
                className="text-xl text-blue-600 dark:text-blue-400"
              />
            </span>
            <div>
              <h2
                id="cookie-preferences-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Cookie preferences
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                Choose what we may store on this device. Read the details in our{" "}
                <Link
                  to="/cookie-policy"
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cookie preferences without saving"
            className="shrink-0 p-1.5 -m-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {COOKIE_CATEGORIES.map((category) => {
            const on = category.required || Boolean(selection[category.id]);
            const isOpen = expanded === category.id;
            return (
              <div
                key={category.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
              >
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {category.name}
                      </h3>
                      {category.required && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Always on
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {category.summary}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : category.id)}
                      aria-expanded={isOpen}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isOpen ? "Hide" : "Show"} what&rsquo;s stored
                      <Icon
                        icon="heroicons:chevron-down"
                        className={`text-sm transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Switch — a real checkbox under a styled track, so it
                      is reachable and announced without extra ARIA. */}
                  <label
                    className={`relative shrink-0 mt-0.5 ${category.required ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={on}
                      disabled={category.required}
                      onChange={() => toggle(category.id)}
                      aria-label={`${category.name} cookies`}
                    />
                    <span
                      className={`block w-11 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-900 ${
                        on
                          ? category.required
                            ? "bg-slate-400 dark:bg-slate-600"
                            : "bg-blue-600"
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    />
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : ""}`}
                    />
                  </label>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3">
                    {category.items.length === 0 ? (
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">
                        We don&rsquo;t currently use any {category.name.toLowerCase()}{" "}
                        cookies. Your choice here is recorded and will apply
                        automatically if that ever changes.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {category.items.map((item) => (
                          <li key={item.name} className="text-[12px]">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 break-words">
                              {item.name}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {item.purpose}
                            </p>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-slate-500 dark:text-slate-500">
                              <span>{item.type}</span>
                              <span>·</span>
                              <span>{item.provider}</span>
                              <span>·</span>
                              <span>{item.duration}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onRejectAll}
            className="sm:flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="sm:flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => onSave(selection)}
            className="sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/25 transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:check" className="text-base" />
            Save my choices
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferences;
