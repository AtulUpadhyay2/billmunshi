import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  LABEL_CAPS,
} from "@/constants/ui";
import {
  DEFAULT_TTL_MINUTES,
  SCOPE_FULL,
  SCOPE_READ_ONLY,
  TTL_OPTIONS,
  useMintAccessGrant,
} from "@/services/support/supportAccessService";

/**
 * Minting a support-access grant.
 *
 * The client is on the phone to someone they have never met and is about
 * to read them a key to their books. Three things have to be impossible to
 * get wrong, and they are the only three things this dialog says:
 *
 *   what is being granted — in plain words, not the API's two scope codes
 *   for how long        — an expiry, in minutes, chosen before minting
 *   how to stop it      — stated here, and reachable from the banner and
 *                         the history page
 *
 * Two steps, deliberately not one. Step one is a decision with nothing
 * secret on screen; step two shows the code and nothing else to decide.
 * The code is returned by the server exactly once — only `sha256(code)` is
 * stored — so the reveal step is the one and only place it will ever
 * exist, and the copy says so in those words rather than hinting at it.
 */

/**
 * Controls on this dialog are 36px/13px rather than the app's 32px/12px.
 *
 * Spelled out locally instead of appending an override to `CONTROL_SELECT`
 * from `@/constants/ui`: `h-8` and `h-9` are both height utilities of equal
 * specificity, so which one won would be decided by their order in the
 * generated stylesheet rather than by this file — the same trap the border
 * colours in that module carry a note about. The skin colours below are
 * copied from it so the control still reads as part of the app.
 */
const DIALOG_SELECT =
  "w-full h-9 pl-2.5 pr-8 text-[13px] appearance-none cursor-pointer " +
  "bg-white dark:bg-slate-900 text-slate-900 dark:text-white " +
  "border border-slate-200 dark:border-slate-700 rounded-md transition-colors " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

/**
 * The two scopes, in the words the client needs.
 *
 * "Read only" and "Full" are what the API calls them and mean nothing to
 * someone deciding. What they need to know about `full` is one fact: the
 * stranger can change their accounting data. It is said in the first line
 * of the option, not in small print underneath.
 */
const SCOPES = [
  {
    value: SCOPE_READ_ONLY,
    title: "Read only — support can look, but cannot change anything",
    summary: "They see the account exactly as it is and leave it exactly as it is.",
    points: [
      "They can open your bills, vouchers, ledgers and reports.",
      "They cannot edit, add or delete anything, and cannot post to Tally or Zoho.",
    ],
    icon: "heroicons:eye",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  {
    value: SCOPE_FULL,
    title: "Full access — support can change data in this account",
    summary:
      "Everything above, plus the ability to alter your accounting records.",
    points: [
      "They can edit and delete bills, change ledgers and party mappings, and post vouchers to Tally or Zoho.",
      "Anything they change is recorded in this account's history against their name.",
      "Choose this only if you have been asked to, for a fix you want made.",
    ],
    icon: "heroicons:pencil-square",
    tone: "text-amber-600 dark:text-amber-400",
  },
];

/** Never granted, at either scope — worth saying, because it bounds the ask. */
const NEVER = [
  "change your password, email or two-factor settings",
  "invite, remove or re-role members",
  "create or delete API keys",
  "touch billing, or delete the organisation",
  "grant themselves access, or extend what you grant",
];

const formatWhen = (value) => {
  if (!value) return null;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** The server may name the one-shot code any of these. */
const readCode = (payload) =>
  payload?.code ||
  payload?.full_code ||
  payload?.access_code ||
  payload?.grant?.code ||
  null;

/**
 * The code, laid out to be read down a phone line.
 *
 * This is the one place in the app that is deliberately not dense: a
 * monospace face, wide letter spacing, and the four groups kept apart so
 * the reader says "B M dash seven K Q four" and stops, rather than
 * running twelve characters together.
 */
const CodeDisplay = ({ code }) => {
  const groups = String(code).split("-").filter(Boolean);
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 px-3 py-5"
      aria-label={`Access code ${groups.join(" ")}`}
    >
      {groups.map((group, index) => (
        <React.Fragment key={`${group}-${index}`}>
          {index > 0 && (
            <span
              aria-hidden="true"
              className="text-lg text-blue-300 dark:text-blue-800"
            >
              –
            </span>
          )}
          <span className="select-all font-mono text-xl sm:text-2xl font-semibold tracking-[0.22em] text-slate-900 dark:text-white">
            {group}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

const ScopeOption = ({ scope, checked, onChange }) => (
  <label
    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
      checked
        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500/30"
        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
    }`}
  >
    <input
      type="radio"
      name="support-access-scope"
      value={scope.value}
      checked={checked}
      onChange={() => onChange(scope.value)}
      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600 cursor-pointer"
    />
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5">
        <Icon icon={scope.icon} className={`text-sm ${scope.tone}`} aria-hidden="true" />
        <span className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">
          {scope.title}
        </span>
      </span>
      <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
        {scope.summary}
      </span>
      <ul className="mt-1.5 space-y-1">
        {scope.points.map((point) => (
          <li
            key={point}
            className="flex gap-1.5 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400"
          >
            <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">
              •
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </span>
  </label>
);

const GrantAccessDialog = ({
  open,
  onClose,
  ticketId,
  ticketLabel,
  onMinted,
}) => {
  const [scope, setScope] = useState(SCOPE_READ_ONLY);
  const [ttlMinutes, setTtlMinutes] = useState(DEFAULT_TTL_MINUTES);
  const [minted, setMinted] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  // First attempt to dismiss the reveal step warns instead of closing. The
  // code cannot be re-shown, so a stray click on the backdrop must not be
  // the thing that loses it.
  const [warnedOnClose, setWarnedOnClose] = useState(false);

  const mint = useMintAccessGrant({
    onSuccess: (payload) => {
      setMinted(payload || {});
      onMinted?.(payload);
    },
  });

  // Fresh state every time the dialog is opened. Without this, reopening it
  // after a grant would show the previous code — which is both wrong and
  // the exact thing the copy promises cannot happen.
  useEffect(() => {
    if (!open) return;
    setScope(SCOPE_READ_ONLY);
    setTtlMinutes(DEFAULT_TTL_MINUTES);
    setMinted(null);
    setCopied(false);
    setCopyFailed(false);
    setWarnedOnClose(false);
    mint.reset();
    // `mint` is a stable-enough mutation object; depending on it would
    // re-run this on every status change and wipe the revealed code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const code = readCode(minted);
  const revealed = !!code;

  const handleMint = () => {
    if (!ticketId || mint.isPending) return;
    mint.mutate({ ticketId, scope, ttlMinutes });
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyFailed(false);
      return;
    } catch {
      // Clipboard API needs a secure context and a permission; on a plain
      // http origin it throws. Fall back rather than silently doing
      // nothing — the code must be gettable off this screen.
    }
    try {
      const area = document.createElement("textarea");
      area.value = code;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      setCopied(ok);
      setCopyFailed(!ok);
    } catch {
      setCopyFailed(true);
    }
  };

  const dismiss = () => {
    setWarnedOnClose(false);
    onClose?.();
  };

  const handleShellClose = () => {
    if (revealed && !warnedOnClose) {
      setWarnedOnClose(true);
      return;
    }
    dismiss();
  };

  const expiresAt =
    formatWhen(minted?.expires_at) || formatWhen(minted?.grant?.expires_at);
  const ttlLabel =
    TTL_OPTIONS.find((o) => o.minutes === Number(ttlMinutes))?.label ||
    `${ttlMinutes} minutes`;

  const footer = revealed ? (
    <>
      <button type="button" className={BTN_SECONDARY} onClick={handleCopy}>
        <Icon
          icon={copied ? "heroicons:check" : "heroicons:clipboard-document"}
          className="text-sm"
          aria-hidden="true"
        />
        {copied ? "Copied" : "Copy code"}
      </button>
      <button type="button" className={BTN_PRIMARY} onClick={dismiss}>
        I have shared this
      </button>
    </>
  ) : (
    <>
      <button type="button" className={BTN_SECONDARY} onClick={dismiss}>
        Cancel
      </button>
      <button
        type="button"
        className={BTN_PRIMARY}
        onClick={handleMint}
        disabled={!ticketId || mint.isPending}
      >
        {mint.isPending ? "Creating code…" : "Create access code"}
      </button>
    </>
  );

  return (
    <Modal
      activeModal={open}
      onClose={handleShellClose}
      title={revealed ? "Read this code to support" : "Give support access"}
      className="max-w-xl"
      centered
      scrollContent
      footerContent={footer}
    >
      {revealed ? (
        <div className="space-y-3">
          {/* The one-time warning sits ABOVE the code, not below it: it has
              to be read before the code is, because it is the reason the
              client writes the code down instead of coming back for it. */}
          <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
            <p className={LABEL_CAPS}>Shown once</p>
            <p className="mt-1 text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">
              This code is shown once and we do not keep a copy, so it can
              never be shown again. Read it out or copy it now. If you lose
              it, revoke this grant and create a new code.
            </p>
          </div>

          <CodeDisplay code={code} />

          <ul className="space-y-1.5 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
            <li className="flex gap-2">
              <Icon
                icon="heroicons:clock"
                className="mt-0.5 shrink-0 text-sm text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <span>
                It expires {expiresAt ? `at ${expiresAt}` : `in ${ttlLabel}`}.
                After that it stops working, whether or not it has been used.
              </span>
            </li>
            <li className="flex gap-2">
              <Icon
                icon="heroicons:lifebuoy"
                className="mt-0.5 shrink-0 text-sm text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <span>
                It dies when this ticket is resolved or closed. Access cannot
                outlive the reason you gave it.
              </span>
            </li>
            <li className="flex gap-2">
              <Icon
                icon="heroicons:hand-raised"
                className="mt-0.5 shrink-0 text-sm text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <span>
                You can end access at any moment — from the banner that
                appears while support is in the account, or from Settings →
                Support access.
              </span>
            </li>
            <li className="flex gap-2">
              <Icon
                icon="heroicons:user-circle"
                className="mt-0.5 shrink-0 text-sm text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <span>
                Only give it to the agent you are speaking to, on a call you
                started. Nobody from Bill Munshi will ever ask for it by
                email or message.
              </span>
            </li>
          </ul>

          {minted?.code_label && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              This grant is listed as{" "}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {minted.code_label}
              </span>{" "}
              on the Support access page. That short label is safe to say
              out loud; the rest of the code is not.
            </p>
          )}

          {copyFailed && (
            <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">
              Could not copy automatically — select the code above and copy it
              by hand.
            </p>
          )}

          {warnedOnClose && (
            <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">
              The code will not be shown again. Copy it or write it down, then
              choose “I have shared this”.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
            You are about to let a Bill Munshi support agent into this
            account. Nobody gets in unless you create a code here and read it
            to them, and nothing you choose below can be changed by them
            afterwards.
          </p>

          {ticketLabel && (
            <div>
              <p className={LABEL_CAPS}>For ticket</p>
              <p className="mt-1 text-[13px] font-semibold text-slate-900 dark:text-white">
                {ticketLabel}
              </p>
            </div>
          )}

          <div>
            <p className={LABEL_CAPS}>What support may do</p>
            <div className="mt-1.5 space-y-2">
              {SCOPES.map((item) => (
                <ScopeOption
                  key={item.value}
                  scope={item}
                  checked={scope === item.value}
                  onChange={setScope}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="support-access-ttl" className={LABEL_CAPS}>
              How long access lasts
            </label>
            <div className="relative mt-1.5 max-w-xs">
              <select
                id="support-access-ttl"
                className={DIALOG_SELECT}
                value={ttlMinutes}
                onChange={(e) => setTtlMinutes(Number(e.target.value))}
              >
                {TTL_OPTIONS.map((option) => (
                  <option key={option.minutes} value={option.minutes}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon
                icon="heroicons:chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
              The clock starts now, not when support uses the code. Access
              also ends the moment this ticket is resolved or closed, or the
              moment you end it — whichever comes first.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
            <p className={LABEL_CAPS}>Never, at either level</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
              Whatever you choose, support can never {NEVER.join(", ")}.
            </p>
          </div>

          {!ticketId && (
            <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">
              Pick the ticket this is for first — a grant always has a reason
              attached to it.
            </p>
          )}

          {mint.isError && (
            <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">
              {mint.error?.message || "Could not create the code. Try again."}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default GrantAccessDialog;
