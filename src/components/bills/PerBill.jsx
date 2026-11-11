import React from "react";
import { useParams } from "react-router-dom";

/**
 * Give a detail page a fresh mount for every bill it shows.
 *
 * Next and Back navigate between two bills on the *same* route, so React
 * keeps the page component mounted and only the `:id` param changes.
 * Every `useRef` on the page therefore survives the move, and these
 * pages are full of them — one-shot guards that stop a hydration effect
 * running twice.
 *
 * The vendor bill reset six of its refs when new data arrived and left
 * four behind, and the worst of those was `interStateRef`, which holds
 * the IGST-vs-CGST decision deliberately steady "for the rest of the
 * session". Walking from an IGST bill to one whose `gst_type` is not
 * set handed the second bill the first one's answer, which swaps the
 * tax heads across the whole voucher with nothing on screen saying so.
 * `lineTaxNormalisedRef` left the new bill's lines un-normalised, and
 * `userClearedLedgersRef` carried one bill's cleared ledgers onto the
 * next.
 *
 * Resetting each ref by hand fixes today's list and silently breaks
 * again the next time someone adds one. Keying on the id makes the
 * problem structural instead: a different bill is a different mount, so
 * no state can cross between them, and the fix cannot be forgotten.
 *
 * The cost is that moving between bills remounts rather than updates.
 * That is the behaviour we want — the data is refetched for the new bill
 * either way, and nothing on these pages is worth preserving across a
 * change of record.
 */
const PerBill = ({ children }) => {
  const { id } = useParams();
  return <React.Fragment key={id}>{children}</React.Fragment>;
};

export default PerBill;
