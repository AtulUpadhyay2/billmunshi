import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import Icon from "@/components/ui/Icon";
import { BACKDROP, BTN_BASE_SHAPE } from "@/constants/ui";

/**
 * The dialog shell every modal in the app is built in.
 *
 * It was written twice in one file — the uncontrolled branch and the
 * controlled branch held the same sixty lines of panel markup, so a fix
 * to one silently left the other behind. One `Panel` now, rendered by
 * both.
 *
 * The look changed with it. The header was a solid dark bar with white
 * text (`bg-slate-900 dark:bg-slate-800`), which made every dialog —
 * a confirm, a file picker, an invite — announce itself like an alert,
 * and gave the title more weight than the thing being asked. It is now
 * a title on a hairline, the same way the record pages head a section.
 * The body was `px-6 py-8`; a dialog asking one question does not need
 * 32px above and below it.
 *
 * `themeClass` is still accepted so no caller breaks, but it is applied
 * to the header's border rather than filling it.
 */

const Panel = ({ title, onClose, children, footerContent, scrollContent, themeClass }) => (
  <DialogPanel
    className={
      "w-full transform overflow-hidden rounded-xl text-left align-middle " +
      "bg-white dark:bg-slate-900 shadow-2xl " +
      "ring-1 ring-slate-200 dark:ring-slate-800 transition-all"
    }
  >
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 ${
        themeClass || ""
      }`}
    >
      <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <Icon icon="heroicons-outline:x" className="text-base" />
      </button>
    </div>

    <div className={`px-4 py-4 ${scrollContent ? "overflow-y-auto max-h-[60vh]" : ""}`}>
      {children}
    </div>

    {footerContent && (
      <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
        {footerContent}
      </div>
    )}
  </DialogPanel>
);

const Modal = ({
  activeModal,
  onClose,
  noFade,
  disableBackdrop,
  className = "max-w-xl",
  children,
  footerContent,
  centered,
  scrollContent,
  themeClass = "",
  title = "Basic Modal",
  uncontrol,
  label = "Basic Modal",
  labelClass,
  ref,
}) => {
  const [showModal, setShowModal] = useState(false);
  const closeModal = () => setShowModal(false);
  const openModal = () => setShowModal((v) => !v);
  const returnNull = () => null;

  const shell = (open, handleClose) => (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-99999" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter={noFade ? "" : "duration-200 ease-out"}
          enterFrom={noFade ? "" : "opacity-0"}
          enterTo={noFade ? "" : "opacity-100"}
          leave={noFade ? "" : "duration-150 ease-in"}
          leaveFrom={noFade ? "" : "opacity-100"}
          leaveTo={noFade ? "" : "opacity-0"}
        >
          {disableBackdrop ? <span /> : <div className={BACKDROP} />}
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={`flex min-h-full justify-center text-center p-4 sm:p-6 ${
              centered ? "items-center" : "items-start"
            }`}
          >
            <TransitionChild
              as={Fragment}
              enter={noFade ? "" : "duration-200 ease-out"}
              enterFrom={noFade ? "" : "opacity-0 scale-95"}
              enterTo={noFade ? "" : "opacity-100 scale-100"}
              leave={noFade ? "" : "duration-150 ease-in"}
              leaveFrom={noFade ? "" : "opacity-100 scale-100"}
              leaveTo={noFade ? "" : "opacity-0 scale-95"}
            >
              <div className={`w-full ${className}`}>
                <Panel
                  title={title}
                  onClose={handleClose}
                  footerContent={footerContent}
                  scrollContent={scrollContent}
                  themeClass={themeClass}
                >
                  {children}
                </Panel>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  if (!uncontrol) return shell(activeModal, onClose);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`${BTN_BASE_SHAPE} ${labelClass}`}
      >
        {label}
      </button>
      {shell(showModal, disableBackdrop ? returnNull : closeModal)}
    </>
  );
};

export default Modal;
