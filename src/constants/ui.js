/**
 * The app's form-control scale — one definition, used everywhere.
 *
 * The detail pages had drifted into six different control geometries sitting
 * side by side in the same row (`px-2 py-1`, `px-2 py-1.5`, `px-3 py-2`,
 * `text-xs`/`text-sm`/`text-[13px]`, `rounded-md`/`rounded-lg`, some with
 * `shadow-sm`, some with no dark-mode colours at all). Every control now
 * resolves to the same 32px box, which is also the height of the toolbar
 * buttons (`h-8`), so a row of mixed inputs, selects and buttons lines up.
 *
 * Compose with a template literal when a call site needs extra state classes:
 *
 *   className={`${CONTROL} ${hasError ? "border-rose-400" : ""}`}
 *
 * Anything that changes here changes the whole app. Keep the tokens in sync
 * with the button scale in the page components (`h-8 px-2.5 text-xs`).
 */

/**
 * Shape and colours, but no border *colour* and no focus colour.
 *
 * Split out because a control with a validation state has its caller supply
 * exactly one border colour. Baking `border-slate-200` in here and letting the
 * call site append `border-rose-400` would be a coin flip: both are
 * `border-color` utilities of equal specificity, so the winner is decided by
 * their order in the generated stylesheet, not by the order in the attribute.
 */
const SKIN_BASE =
  "bg-white dark:bg-slate-900 text-slate-900 dark:text-white " +
  "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
  "border rounded-md transition-colors " +
  "focus:outline-none focus:ring-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/** Shared skin: `SKIN_BASE` plus the default border / focus / disabled colours. */
const SKIN =
  SKIN_BASE +
  " border-slate-200 dark:border-slate-700" +
  " hover:border-slate-300 dark:hover:border-slate-600" +
  " focus:border-blue-500 focus:ring-blue-500/20" +
  " disabled:bg-slate-50 dark:disabled:bg-slate-800/60";

/** Kills the number-input spinners — they break the 32px box. */
const NO_SPINNER =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none " +
  "[&::-webkit-inner-spin-button]:appearance-none";

/** Single-line text input. */
export const CONTROL = `w-full h-8 px-2 text-xs ${SKIN}`;

/**
 * Same box as `CONTROL`, but the caller must append exactly one border colour
 * and one focus colour. For fields with a validation state (the date inputs).
 */
export const CONTROL_VALIDATED = `w-full h-8 px-2 text-xs ${SKIN_BASE}`;

/** Numeric input — tabular figures, right-aligned, no spinners. */
export const CONTROL_NUM =
  `w-full h-8 px-2 text-xs font-mono tabular-nums text-right ${SKIN} ${NO_SPINNER}`;

/**
 * Native `<select>`. `appearance-none` plus `CONTROL_SELECT_ARROW` (below)
 * because the platform arrow ignores our font size and sits at a different
 * inset in every browser.
 */
export const CONTROL_SELECT =
  `w-full h-8 pl-2 pr-7 text-xs appearance-none cursor-pointer ${SKIN}`;

/**
 * Chevron for `CONTROL_SELECT`, as an inline `style` object. A background
 * image rather than an overlaid element so it can't intercept clicks or shift
 * when the select is inside a table cell.
 */
export const CONTROL_SELECT_ARROW = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
  backgroundPosition: "right 0.375rem center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "0.875rem 0.875rem",
};

/**
 * Multi-line input. No fixed height — `rows` drives it — but the same padding,
 * type scale and skin so it reads as the same family as the single-line boxes.
 */
export const CONTROL_TEXTAREA =
  `w-full px-2 py-1.5 text-xs leading-snug resize-none ${SKIN}`;

/** Read-only / computed field: same box, visibly inert. */
export const CONTROL_READONLY =
  "w-full h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 " +
  "border border-slate-200 dark:border-slate-700 rounded-md cursor-default select-text focus:outline-none";

/**
 * Toolbar search box — same 32px box and type scale as `CONTROL`, with the
 * left padding widened for the magnifying-glass icon that every list page
 * absolutely positions over it. Was duplicated as a local `inputBase` const in
 * seven page files, which is how it drifted to `rounded-lg` while every other
 * input stayed `rounded-md`.
 */
export const CONTROL_SEARCH = `w-full h-8 pl-8 pr-3 text-xs ${SKIN}`;

/** Field label above a control. */
export const FIELD_LABEL =
  "block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1";

/**
 * react-select styles matching the tokens above. react-select renders its own
 * DOM and ignores Tailwind classes on the wrapper, so the geometry has to be
 * restated as inline style functions.
 *
 * `isDark` cannot be read from the CSS cascade here, so the palette is driven
 * off `document.documentElement.classList` at render time by the caller via
 * `reactSelectStyles(isDark)`.
 */
export const reactSelectStyles = (isDark = false) => {
  const bg = isDark ? "#0f172a" : "#ffffff";
  const border = isDark ? "#334155" : "#e2e8f0";
  const borderHover = isDark ? "#475569" : "#cbd5e1";
  const text = isDark ? "#ffffff" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const menuBg = isDark ? "#1e293b" : "#ffffff";
  const optionHover = isDark ? "#334155" : "#f1f5f9";
  const optionActive = isDark ? "#1e3a8a" : "#eff6ff";

  return {
    control: (base, state) => ({
      ...base,
      minHeight: "32px",
      height: "32px",
      fontSize: "12px",
      backgroundColor: bg,
      borderColor: state.isFocused ? "#3b82f6" : border,
      borderRadius: "6px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.2)" : "none",
      transition: "border-color .15s ease",
      "&:hover": { borderColor: state.isFocused ? "#3b82f6" : borderHover },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 6px", height: "30px" }),
    input: (base) => ({ ...base, margin: 0, padding: 0, color: text }),
    singleValue: (base) => ({ ...base, color: text }),
    placeholder: (base) => ({ ...base, color: muted, fontSize: "12px" }),
    indicatorsContainer: (base) => ({ ...base, height: "30px" }),
    dropdownIndicator: (base) => ({ ...base, padding: "0 4px", color: muted }),
    clearIndicator: (base) => ({ ...base, padding: "0 2px", color: muted }),
    indicatorSeparator: () => ({ display: "none" }),
    menu: (base) => ({
      ...base,
      backgroundColor: menuBg,
      fontSize: "12px",
      borderRadius: "8px",
      border: `1px solid ${border}`,
      boxShadow: "0 8px 24px -8px rgba(15,23,42,.18)",
      zIndex: 60,
      overflow: "hidden",
    }),
    menuList: (base) => ({ ...base, padding: "4px", maxHeight: "220px" }),
    option: (base, state) => ({
      ...base,
      fontSize: "12px",
      padding: "5px 8px",
      borderRadius: "4px",
      cursor: "pointer",
      color: state.isSelected ? (isDark ? "#93c5fd" : "#1d4fd7") : text,
      backgroundColor: state.isSelected
        ? optionActive
        : state.isFocused
          ? optionHover
          : "transparent",
      fontWeight: state.isSelected ? 600 : 400,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? "#334155" : "#f1f5f9",
      borderRadius: "4px",
    }),
    multiValueLabel: (base) => ({ ...base, color: text, fontSize: "11px" }),
    noOptionsMessage: (base) => ({ ...base, fontSize: "12px", color: muted }),
  };
};
