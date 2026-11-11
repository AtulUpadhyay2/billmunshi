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
 * Compact `<select>` for the 28px tier — the rows-per-page picker in the
 * table footer. Needs `appearance-none` and `CONTROL_SELECT_ARROW` for the
 * same reason `CONTROL_SELECT` does: without them the browser draws its own
 * control, which on macOS is both taller and a different typeface, so the
 * one unstyled select in the app was the one thing in the footer that did
 * not look like the app.
 */
export const CONTROL_SELECT_SM =
  "h-7 pl-1.5 pr-6 text-[11px] font-semibold appearance-none cursor-pointer " +
  "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 " +
  "border border-slate-200 dark:border-slate-700 rounded-md transition-colors " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

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

/** `CONTROL_SEARCH` box for a field with a validation state — see `CONTROL_VALIDATED`. */
export const CONTROL_SEARCH_VALIDATED = `w-full h-8 pl-8 pr-3 text-xs ${SKIN_BASE}`;

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

/* ---------------------------------------------------------------------------
 * Buttons
 *
 * The geometry was already uniform before this module grew these tokens —
 * ~80 call sites all spelled `h-8 px-2.5 text-xs font-semibold rounded-lg`.
 * What was *not* uniform was everything around it: an audit of those sites
 * found 22 distinct spellings of the same three buttons, differing only in
 * whether they remembered `transition-all`, `cursor-pointer`,
 * `disabled:cursor-not-allowed`, `disabled:opacity-50` vs `-60`, and
 * `shadow-md` vs `shadow-sm`. None of that is a design decision; it is just
 * what happens when a class string is copied by hand. The tokens below are
 * the union of those spellings, so adopting one is never a visual change
 * beyond picking up the state classes a given site had forgotten.
 *
 * Two height tiers, deliberately:
 *
 *   32px (`h-8`)  the default. Matches `CONTROL` above, so a toolbar of mixed
 *                 inputs, selects and buttons sits on one baseline.
 *   28px (`h-7`)  compact. For actions *inside* a table row or a status strip,
 *                 where a 32px control would set the row height. Already in
 *                 use on the account-info and approvals pages; codified here
 *                 rather than removed, because the two tiers read as a
 *                 hierarchy and collapsing them makes table rows taller.
 *
 * Radius is `rounded-lg` (8px) on buttons against `rounded-md` (6px) on
 * inputs. That split is intentional and predates this file: a button is a
 * solid block and reads as rounder than an outlined box of the same radius.
 * Keeping it means the tokens here match the ~80 sites already shipped.
 * ------------------------------------------------------------------------ */

/** Layout + state classes every button shares, with no size and no colour. */
const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 font-semibold " +
  "rounded-lg transition-all cursor-pointer " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

/** 32px tier — the default. */
const BTN_MD = "h-8 px-2.5 text-xs";

/** 28px tier — in-row actions only. See the note above. */
const BTN_SM = "h-7 px-2.5 text-[11px]";

/**
 * Geometry and state only, no colour — for the `<Button>` component and the
 * `<Modal>` trigger, whose callers still supply colour through the legacy
 * `.btn-primary` / `.btn-outline-dark` classes in `app.css`. Those classes
 * only set colours, so pairing them with this is safe; what they were paired
 * with before was `.btn`, which also carried a 48px box and a 2px radius.
 */
export const BTN_BASE_SHAPE = `${BTN_BASE} ${BTN_MD}`;

/** Primary action. One per view, usually the far right of the toolbar. */
export const BTN_PRIMARY =
  `${BTN_BASE} ${BTN_MD} text-white bg-blue-600 hover:bg-blue-700 ` +
  "shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 " +
  "ring-1 ring-blue-700/20";

/** Default action: outlined, sits on the page background. */
export const BTN_SECONDARY =
  `${BTN_BASE} ${BTN_MD} text-slate-700 dark:text-slate-300 ` +
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "hover:bg-slate-50 dark:hover:bg-slate-800";

/** Tinted action — a secondary that still wants to be noticed (Sync, Retry). */
export const BTN_SOFT =
  `${BTN_BASE} ${BTN_MD} text-blue-700 dark:text-blue-400 ` +
  "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 " +
  "hover:bg-blue-100 dark:hover:bg-blue-950/60";

/** Destructive action. Same tinted treatment as `BTN_SOFT`, in rose. */
export const BTN_DANGER =
  `${BTN_BASE} ${BTN_MD} text-rose-700 dark:text-rose-400 ` +
  "bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 " +
  "hover:bg-rose-100 dark:hover:bg-rose-950/60";

/**
 * `BTN_PRIMARY` in a 40px box, for the one full-width submit on a public auth
 * page (sign in, create account, send reset link).
 *
 * The rest of the app is 32px and this is the only deliberate exception. Two
 * reasons, both specific to these pages and to nowhere else:
 *
 *   - It is the *only* control in the viewport, not one of a toolbar row, so
 *     it has no neighbour to line up with. The argument for `h-8` is that a
 *     row of mixed controls shares a baseline; there is no row here.
 *   - It is the primary touch target on a page people reach on a phone. At
 *     `h-8` and full width it measured 32px tall against a ~44px platform
 *     minimum, and read as a thin bar under a 44px page heading.
 *
 * The type scale does not change — still `text-xs`, so it stays on the
 * system; only the box is taller. To collapse this back to one scale, point
 * the four auth forms at `BTN_PRIMARY` and delete this.
 */
export const BTN_PRIMARY_CTA =
  `${BTN_BASE} h-10 px-4 text-xs text-white bg-blue-600 hover:bg-blue-700 ` +
  "shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 " +
  "ring-1 ring-blue-700/20";

/** Icon-only button on the 32px tier — square, so it stays a circle-ish box. */
export const BTN_ICON =
  `${BTN_BASE} h-8 w-8 p-0 text-slate-600 dark:text-slate-400 ` +
  "hover:bg-slate-100 dark:hover:bg-slate-800 " +
  "hover:text-slate-900 dark:hover:text-white";

/** 28px versions. Only the geometry differs. */
export const BTN_SECONDARY_SM =
  `${BTN_BASE} ${BTN_SM} text-slate-700 dark:text-slate-300 ` +
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "hover:bg-slate-50 dark:hover:bg-slate-800";

export const BTN_SOFT_SM =
  `${BTN_BASE} ${BTN_SM} text-blue-700 dark:text-blue-400 ` +
  "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 " +
  "hover:bg-blue-100 dark:hover:bg-blue-950/60";

/* ---------------------------------------------------------------------------
 * Type scale
 *
 * Three roles, and only three. Each was already the majority spelling at its
 * role before being named here; the point of naming them is that the minority
 * spellings (`tracking-[0.12em]` on a section heading, `text-sm` on an
 * eyebrow, `text-[12px]` on a card title) stop being reachable by copy-paste.
 * ------------------------------------------------------------------------ */

/**
 * The one `<h1>` on a page — the screen's name in the content area.
 * Responsive because the sidebar eats horizontal room below `md`.
 */
export const PAGE_TITLE =
  "text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white";

/**
 * Heading of a card or a panel section. Wide-tracked small caps rather than a
 * larger size, so a page of six cards doesn't read as six page titles.
 */
export const SECTION_TITLE =
  "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300";

/**
 * Title of a card — the bordered box a page is built out of, usually with a
 * 28px icon chip to its left. Sentence case and only one step above body
 * text, because a page shows six of these at once. Was spelled three ways
 * (`text-sm`, `text-xs`, `text-[12px]`, all with the same weight and
 * tracking) across the config, account-info and dashboard pages.
 */
export const CARD_TITLE =
  "text-sm font-bold tracking-tight text-slate-900 dark:text-white";

/**
 * One step below `SECTION_TITLE`: the label over a field group, or a column
 * group header. Muted and a point smaller — it labels content rather than
 * announcing a section, and the two have to be told apart at a glance.
 */
export const SUBTLE_LABEL =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400";

/* ---------------------------------------------------------------------------
 * Dropdown menus
 *
 * The header chrome (`Profile`, `OrgSwitcher`) came from the DashCode template
 * and kept its `px-4 py-2 text-sm` menu rows — a ~38px row and a 14px label
 * hanging off a 32px header. These two put those rows on the same scale as
 * the rest of the app, so the menu that drops out of the header matches the
 * page it drops onto.
 * ------------------------------------------------------------------------ */

/** A clickable row in a dropdown menu. 32px, like every other control. */
export const MENU_ITEM =
  "block w-full px-3 py-2 text-xs font-medium cursor-pointer transition-colors";

/** The non-clickable identity block at the top of a menu. */
export const MENU_HEADER =
  "px-3 py-2 border-b border-slate-100 dark:border-slate-700";

/* ---------------------------------------------------------------------------
 * Tables and badges
 * ------------------------------------------------------------------------ */

/**
 * `<th>` and `<td>` padding. `px-3 py-2` won the audit outright (61 of 70
 * headers, 57 of 77 cells); the stragglers were `px-4 py-3.5` / `px-4 py-4`,
 * which made one table on the org picker visibly looser than every other
 * table in the app.
 */
export const TH =
  "px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] " +
  "text-slate-500 dark:text-slate-400 " +
  "border-b border-slate-200 dark:border-slate-800";

export const TD = "px-3 py-2 text-xs text-slate-700 dark:text-slate-300";

/**
 * Status pill. Colour is the caller's — a badge is always coloured by what it
 * reports — so this is geometry and weight only.
 */
export const BADGE =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full " +
  "text-[10px] font-semibold";
