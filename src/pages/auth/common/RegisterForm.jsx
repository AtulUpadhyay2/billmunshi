import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterUserMutation } from "@/store/api/auth/authApiSlice";
import Modal from "@/components/ui/Modal";
import ReCaptcha from "@/components/ReCaptcha";
import { isRecaptchaConfigured } from "@/config/recaptcha";

const schema = yup
  .object({
    name: yup.string().required("Full Name is Required"),
    organizationName: yup.string().required("Organization Name is Required"),
    designation: yup.string().required("Designation is Required"),
    accountingSoftware: yup
      .string()
      .required("Accounting Software is Required"),
    email: yup
      .string()
      .email("Invalid email")
      .required("Work Email is Required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
      .required("Please enter password"),
    phone: yup
      .string()
      .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
      .required("Phone number is Required"),
  })
  .required();

const inputBase =
  "w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

const inputError =
  "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800";

const RegForm = () => {
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [checked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const captchaRef = useRef(null);

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token || "");
    if (token) setCaptchaError("");
  };

  const designationOptions = [
    { value: "", label: "Select Designation" },
    { value: "business_owner", label: "Business Owner" },
    { value: "accountant", label: "Accountant" },
    { value: "professional", label: "Professional" },
    { value: "other", label: "Other" },
  ];

  const accountingSoftwareOptions = [
    { value: "", label: "Select Accounting Software" },
    { value: "zoho_books", label: "Zoho Books" },
    { value: "tally", label: "Tally" },
  ];

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const password = watch("password", "");

  React.useEffect(() => {
    if (!password) {
      setPasswordStrength("");
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    if (strength <= 2) setPasswordStrength("Weak");
    else if (strength === 3) setPasswordStrength("Medium");
    else setPasswordStrength("Strong");
  }, [password]);

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    if (!checked) {
      toast.error("Please accept the Terms and Conditions and Privacy Policy");
      return;
    }
    // Only required when a site key is configured — without one the
    // widget isn't rendered and the backend isn't verifying either.
    if (isRecaptchaConfigured() && !captchaToken) {
      setCaptchaError("Please complete the “I’m not a robot” check.");
      return;
    }

    try {
      await registerUser({ ...data, recaptcha_token: captchaToken }).unwrap();
      reset();
      setCaptchaToken("");
      captchaRef.current?.reset();
      navigate("/");
      toast.success("Account created successfully");
    } catch (error) {
      // Google spends a token the moment the server verifies it, so a
      // failed attempt always leaves a dead one in the widget.
      captchaRef.current?.reset();

      // DRF reports validation failures as {"field": ["message", …]},
      // so the captcha message has to be read off its own key before
      // falling back to whatever else the response carried.
      const payload = error?.data || {};
      const captchaMessage = payload.recaptcha_token?.[0];
      if (captchaMessage) setCaptchaError(captchaMessage);

      const errorMessage =
        captchaMessage ||
        payload.message ||
        payload.detail ||
        Object.values(payload)
          .flat()
          .find((m) => typeof m === "string") ||
        "An error occurred. Please try again later.";

      if (errorMessage === "Email is already registered") toast.error(errorMessage);
      else toast.warning(errorMessage);
    }
  };

  const handleAcceptTerms = () => {
    setChecked(true);
    setShowTermsModal(false);
    setShowPrivacyModal(false);
  };

  const Field = ({ label, required, error, icon, children }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <Icon
            icon={icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
          />
        )}
        {children}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          {error.message}
        </p>
      )}
    </div>
  );

  const strengthColor =
    passwordStrength === "Weak"
      ? "bg-rose-500"
      : passwordStrength === "Medium"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field label="Full name" required error={errors.name} icon="heroicons:user">
          <input
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            {...register("name")}
            className={`${inputBase} ${errors.name ? inputError : ""}`}
          />
        </Field>

        <Field
          label="Organization"
          required
          error={errors.organizationName}
          icon="heroicons:building-office"
        >
          <input
            type="text"
            placeholder="Your organization"
            autoComplete="organization"
            {...register("organizationName")}
            className={`${inputBase} ${errors.organizationName ? inputError : ""}`}
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field
          label="Designation"
          required
          error={errors.designation}
          icon="heroicons:briefcase"
        >
          <select
            {...register("designation")}
            className={`${inputBase} pr-10 cursor-pointer appearance-none ${
              errors.designation ? inputError : ""
            }`}
          >
            {designationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon
            icon="heroicons:chevron-down"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
          />
        </Field>

        <Field
          label="Accounting software"
          required
          error={errors.accountingSoftware}
          icon="heroicons:calculator"
        >
          <select
            {...register("accountingSoftware")}
            className={`${inputBase} pr-10 cursor-pointer appearance-none ${
              errors.accountingSoftware ? inputError : ""
            }`}
          >
            {accountingSoftwareOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon
            icon="heroicons:chevron-down"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field label="Work email" required error={errors.email} icon="heroicons:envelope">
          <input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register("email")}
            className={`${inputBase} ${errors.email ? inputError : ""}`}
          />
        </Field>

        <Field label="Phone" required error={errors.phone} icon="heroicons:phone">
          <input
            type="tel"
            placeholder="10-digit phone number"
            autoComplete="tel"
            {...register("phone")}
            className={`${inputBase} ${errors.phone ? inputError : ""}`}
          />
        </Field>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon
            icon="heroicons:lock-closed"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 chars · 1 upper · 1 number · 1 symbol"
            autoComplete="new-password"
            {...register("password")}
            className={`${inputBase} pr-10 ${errors.password ? inputError : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <Icon icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="text-lg" />
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errors.password.message}
          </p>
        )}
        {password && !errors.password && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${strengthColor} transition-all duration-300`}
                style={{
                  width:
                    passwordStrength === "Weak"
                      ? "33%"
                      : passwordStrength === "Medium"
                      ? "66%"
                      : "100%",
                }}
              />
            </div>
            <span
              className={`text-[11px] font-semibold ${
                passwordStrength === "Weak"
                  ? "text-rose-600 dark:text-rose-400"
                  : passwordStrength === "Medium"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {passwordStrength}
            </span>
          </div>
        )}
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          I accept the{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowTermsModal(true);
            }}
            className="text-blue-700 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            Terms and Conditions
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowPrivacyModal(true);
            }}
            className="text-blue-700 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            Privacy Policy
          </button>
        </span>
      </label>

      <ReCaptcha
        ref={captchaRef}
        onChange={handleCaptchaChange}
        error={captchaError}
        className="pt-1"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-200 ring-1 ring-orange-600/20 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            Create account
            <Icon icon="heroicons:arrow-right" className="text-base group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>

      {/* Modals */}
      <Modal
        activeModal={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
        className="max-w-3xl"
        scrollContent={true}
        centered={true}
        footerContent={
          <>
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAcceptTerms}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/25 cursor-pointer"
            >
              Accept
            </button>
          </>
        }
      >
        <LegalContent kind="terms" />
      </Modal>

      <Modal
        activeModal={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        className="max-w-3xl"
        scrollContent={true}
        centered={true}
        footerContent={
          <>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAcceptTerms}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/25 cursor-pointer"
            >
              Accept
            </button>
          </>
        }
      >
        <LegalContent kind="privacy" />
      </Modal>
    </form>
  );
};

const LegalContent = ({ kind }) => {
  const isTerms = kind === "terms";
  const sections = isTerms
    ? [
        { t: "1. Introduction", c: "Welcome to Bill Munshi. By accessing our website and using our services, you agree to be bound by these Terms and Conditions. Please read them carefully." },
        { t: "2. Use of Service", c: "You agree to use our service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website." },
        { t: "3. Account Registration", c: "To access certain features of the service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process." },
        { t: "4. Intellectual Property", c: "The content, organization, graphics, design, compilation, and other matters related to the Site are protected under applicable copyrights, trademarks, and other proprietary rights." },
        { t: "5. Termination", c: "We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever." },
        { t: "6. Changes to Terms", c: "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion." },
        { t: "7. Contact Us", c: "If you have any questions about these Terms, please contact us at support@billmunshi.com." },
      ]
    : [
        { t: "1. Information We Collect", c: "We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us." },
        { t: "2. How We Use Your Information", c: "We use the information to provide, maintain, and improve our services — including processing payments, sending technical notices, responding to your requests, and communicating about products and offers." },
        { t: "3. Information Sharing", c: "We may share information with third party service providers, with the general public if you submit content in a public forum, and with third parties with whom you choose to let us share information." },
        { t: "4. Data Security", c: "We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction." },
        { t: "5. Cookies", c: "We use cookies and similar tracking technologies to track activity on our Service. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent." },
        { t: "6. Changes to This Policy", c: "We may update this privacy policy from time to time. If we make significant changes, we will notify you through the Services or other means, such as email." },
        { t: "7. Contact Us", c: "If you have any questions about this Privacy Policy, please contact us at privacy@billmunshi.com." },
      ];

  return (
    <div className="text-slate-600 dark:text-slate-300 space-y-5 text-sm">
      <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      {sections.map((s, i) => (
        <section key={i}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">{s.t}</h3>
          <p className="leading-relaxed">{s.c}</p>
        </section>
      ))}
    </div>
  );
};

export default RegForm;
