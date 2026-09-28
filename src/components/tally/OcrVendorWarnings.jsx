import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { getOcrVendorWarnings } from "@/utils/gstin";

/**
 * Flags a vendor OCR probably got wrong — name that doesn't fit its
 * GSTIN, vendor = customer, vendor = our own organisation. Advisory only:
 * nothing is blocked, the user checks the bill and fixes the vendor.
 */
const OcrVendorWarnings = ({ analysedData, organization, className = "mt-3" }) => {
  const warnings = useMemo(
    () =>
      getOcrVendorWarnings({
        from: analysedData?.from,
        to: analysedData?.to,
        organization,
      }),
    [analysedData?.from, analysedData?.to, organization],
  );

  if (!warnings.length) return null;

  return (
    <div
      className={`${className} rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <Icon
          icon="heroicons:exclamation-triangle"
          className="text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5"
        />
        <div className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 space-y-1 min-w-0">
          <p className="font-semibold">Check the vendor — OCR may have picked the wrong party</p>
          {warnings.map((w) => (
            <p key={w} className="break-words">{w}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OcrVendorWarnings;
