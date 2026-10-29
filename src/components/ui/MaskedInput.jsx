import React, { Suspense, lazy } from "react";

/**
 * The masked-input field, loaded only when one is actually rendered.
 *
 * `Textinput` and `InputGroup` are base components imported across most
 * of the app, and both imported cleave.js at the top of the file — so
 * every client downloaded 64 kB of masking library, plus a **US phone
 * number** addon, in the entry chunk of an Indian GST product. Nothing
 * in the app passes `isMask`, so none of it was ever used.
 *
 * Kept rather than deleted because the prop is part of these
 * components' interface and a form may want it later. Behind a lazy
 * import it costs nothing until something sets `isMask`.
 */

const Cleave = lazy(async () => {
  const [module] = await Promise.all([
    import("cleave.js/react"),
    // The addon registers a phone format on the global Cleave object;
    // it has no export, so it only has to be loaded alongside.
    import("cleave.js/dist/addons/cleave-phone.us"),
  ]);
  return module;
});

/**
 * Renders an unmasked input while the library loads, so the field is
 * usable immediately and does not shift the form around.
 */
const MaskedInput = ({ fallbackClassName = "", ...props }) => (
  <Suspense
    fallback={
      <input
        type="text"
        placeholder={props.placeholder}
        className={fallbackClassName || props.className}
        readOnly
      />
    }
  >
    <Cleave {...props} />
  </Suspense>
);

export default MaskedInput;
