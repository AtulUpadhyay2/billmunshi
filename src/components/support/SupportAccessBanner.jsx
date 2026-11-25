import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import { globalToast } from "@/utils/toast";
import {
  SCOPE_FULL,
  useAccessStatus,
  useRevokeAccessGrant,
} from "@/services/support/supportAccessService";

/**
 * The live-session banner.
 *
 * While a support agent is inside the account, every member of that
 * organisation sees this, on every page, and cannot put it away. That is
 * the whole design: a standing capability nobody can see is what this
 * feature exists to avoid, so the one thing the banner must never grow is
 * a close button.
 *
 * Mounted once in `App.jsx`, outside `<Routes>`, so it does not depend on
 * which page is open and does not remount on navigation (which would
 * restart its poll and blink the bar on every route change).
 *
 * It renders nothing at all unless the status endpoint reports a live
 * session, so the cost of it being mounted app-wide is one 30-second poll
 * per signed-in tab.
 *
 * Colour: amber, because support being in the account is a state to be
 * aware of, not a failure. The one rose element is End access — the
 * destructive control — which keeps the single-accent rule honest.
 */

/** "4 min", "1 h 12 min", "under a minute" — never a bare timestamp. */
const remaining = (expiresAt, now) => {
  if (!expiresAt) return null;
  const at = new Date(expiresAt);
  if (Number.isNaN(at.getTime())) return null;
  const ms = at.getTime() - now;
  if (ms <= 0) return "expiring now";
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return "under a minute left";
  if (totalMinutes < 60) return `${totalMinutes} min left`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins ? `${hours} h ${mins} min left` : `${hours} h left`;
};

const clockTime = (expiresAt) => {
  if (!expiresAt) return null;
  const at = new Date(expiresAt);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SupportAccessBanner = () => {
  const { selectedOrganization, accessToken } = useSelector(
    (state) => state.auth,
  );
  const organizationId = selectedOrganization?.id;

  // Redux holds the token on a normal session, but a hard reload restores
  // it from storage before the slice is rehydrated in some paths — checking
  // both keeps the poll off the public pages without missing a real session.
  const signedIn = !!(accessToken || localStorage.getItem("access_token"));

  const { data } = useAccessStatus(organizationId, {
    enabled: !!organizationId && signedIn,
  });

  const sessions = data?.sessions || [];
  const live = !!data?.active && sessions.length > 0;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // One second, and only while the bar is up: the last minute of a grant is
  // exactly when the client is watching the number.
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [live]);

  // Keep the bar off the last row of whatever page is open.
  //
  // Padding `body` would do nothing here: the app shell is a `100dvh`
  // column that never scrolls, and the single scroll container is
  // `.content-wrapper` inside it (see layouts/Layout.jsx). So the padding
  // goes on that element, and is put back on cleanup. It is absent on the
  // public pages, where this component renders nothing anyway.
  useEffect(() => {
    if (!live) return undefined;
    const scroller = document.querySelector(".content-wrapper");
    if (!scroller) return undefined;
    const previous = scroller.style.paddingBottom;
    scroller.style.paddingBottom = "60px";
    return () => {
      scroller.style.paddingBottom = previous;
    };
  }, [live]);

  const revoke = useRevokeAccessGrant();

  const grantIds = useMemo(
    () => [...new Set(sessions.map((s) => s.grant_id).filter(Boolean))],
    [sessions],
  );

  const endAccess = async () => {
    try {
      // Normally one, but if two agents are in on two grants, one press
      // ends both — "End access" has to mean all of it.
      await Promise.all(
        grantIds.map((grantId) => revoke.mutateAsync({ grantId })),
      );
      globalToast.success("Support access ended");
      setConfirmOpen(false);
    } catch (error) {
      globalToast.error(
        error?.message || "Could not end access. Try again.",
      );
    }
  };

  if (!live) return null;

  const first = sessions[0];
  const names = sessions.map((s) => s.agent_name).filter(Boolean);
  const who =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
      : names[0] || "a support agent";
  const canChange = sessions.some((s) => s.scope === SCOPE_FULL);
  const left = remaining(first?.expires_at, now);
  const until = clockTime(first?.expires_at);

  return (
    <>
      {/* `bottom-0` with a mobile bottom pad: the phone nav is also fixed at
          the bottom and sits at a higher z-index, so the padding keeps the
          text and the End button clear of it while the amber still runs to
          the edge of the screen.

          z-9998 is deliberate — above the sticky header (z-999) and the page,
          below ConfirmDialog (z-9999) and Modal (z-99999), so the dialog this
          bar opens is not covered by the bar itself. */}
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 bottom-0 z-[9998] border-t-2 border-amber-600 bg-amber-500 pb-[72px] md:pb-0 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.45)]"
      >
        {/* The right padding is not decoration: the support-chat launcher is
            `fixed bottom-5 right-5` at a higher z-index, so without it that
            bubble sits on top of End access — the one control on this bar
            that has to be reachable. */}
        <div className="mx-auto flex max-w-400 flex-wrap items-center gap-x-3 gap-y-1.5 py-2 pl-3.5 pr-20 md:pl-5 md:pr-24">
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-950/50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-950" />
          </span>

          <Icon
            icon="heroicons:lifebuoy"
            className="shrink-0 text-base text-amber-950"
            aria-hidden="true"
          />

          <p className="min-w-0 text-[13px] font-bold leading-snug text-amber-950">
            Bill Munshi support is in this account — {who}
          </p>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              canChange
                ? "bg-amber-950 text-amber-100"
                : "bg-amber-100 text-amber-900 ring-1 ring-amber-950/20"
            }`}
          >
            {canChange ? "Can change data" : "Read only"}
          </span>

          {/* The expiry, when the status endpoint sends it. When it does
              not, the bar says the two ways access ends that are true
              regardless — it never guesses a time. */}
          <span className="shrink-0 text-[12px] font-semibold text-amber-950/80">
            {until ? `Ends ${until}${left ? ` · ${left}` : ""}` : "Ends when the ticket closes, or when you end it"}
          </span>

          <span className="flex-1" />

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={revoke.isPending || grantIds.length === 0}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-2.5 text-xs font-semibold text-white ring-1 ring-rose-900/30 transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon icon="heroicons:hand-raised" className="text-sm" aria-hidden="true" />
            {revoke.isPending ? "Ending…" : "End access"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={endAccess}
        variant="danger"
        title="End support access now?"
        message="Access ends immediately — the agent is signed out of this account on their next click and the code they used stops working. Nothing they have already changed is undone. You can grant access again from Settings → Support access."
        confirmText="Yes, end access"
        cancelText="Keep access"
        isLoading={revoke.isPending}
      />
    </>
  );
};

export default SupportAccessBanner;
