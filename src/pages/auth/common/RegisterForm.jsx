import React, { useState } from "react";
import { toast } from "sonner";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterUserMutation } from "@/store/api/auth/authApiSlice";
import Modal from "@/components/ui/Modal";

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

const RegForm = () => {
  const [registerUser, { isLoading, isError, error, isSuccess }] =
    useRegisterUserMutation();

  const [checked, setChecked] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

  // Calculate password strength
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

    if (strength <= 2) {
      setPasswordStrength("Weak");
    } else if (strength === 3) {
      setPasswordStrength("Medium");
    } else {
      setPasswordStrength("Strong");
    }
  }, [password]);

  const navigate = useNavigate();
  const onSubmit = async (data) => {
    if (!checked) {
      toast.error("Please accept the Terms and Conditions and Privacy Policy");
      return;
    }
    try {
      const response = await registerUser(data);
      if (response.error) {
        throw new Error(response.error.message);
      }
      reset();
      navigate("/");
      toast.success("Add Successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred. Please try again later.";

      if (errorMessage === "Email is already registered") {
        toast.error(errorMessage);
      } else {
        toast.warning(errorMessage);
      }
    }
  };

  const handleAcceptTerms = () => {
    setChecked(true);
    setShowTermsModal(false);
    setShowPrivacyModal(false);
  };

  const TermsContent = () => (
    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4 text-sm">
      <p className="text-xs text-slate-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          1. Introduction
        </h3>
        <p>
          Welcome to Bill Munshi. By accessing our website and using our
          services, you agree to be bound by these Terms and Conditions. Please
          read them carefully.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          2. Use of Service
        </h3>
        <p>
          You agree to use our service only for lawful purposes and in a way
          that does not infringe the rights of, restrict or inhibit anyone
          else's use and enjoyment of the website.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          3. Account Registration
        </h3>
        <p>
          To access certain features of the service, you may be required to
          register for an account. You agree to provide accurate, current, and
          complete information during the registration process.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          4. Intellectual Property
        </h3>
        <p>
          The content, organization, graphics, design, compilation, and other
          matters related to the Site are protected under applicable copyrights,
          trademarks, and other proprietary rights.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          5. Termination
        </h3>
        <p>
          We reserve the right to terminate or suspend your account and access
          to the Service immediately, without prior notice or liability, for any
          reason whatsoever.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          6. Changes to Terms
        </h3>
        <p>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. What constitutes a material change will be
          determined at our sole discretion.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          7. Contact Us
        </h3>
        <p>
          If you have any questions about these Terms, please contact us at
          support@billmunshi.com.
        </p>
      </section>
    </div>
  );

  const PrivacyContent = () => (
    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4 text-sm">
      <p className="text-xs text-slate-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          1. Information We Collect
        </h3>
        <p>
          We collect information you provide directly to us, such as when you
          create or modify your account, request on-demand services, contact
          customer support, or otherwise communicate with us. This information
          may include: name, email, phone number, postal address, profile
          picture, payment method, items requested (for delivery services),
          delivery notes, and other information you choose to provide.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          2. How We Use Your Information
        </h3>
        <p>
          We use the information we collect to provide, maintain, and improve
          our services, such as to:
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Process payments and facilitate your transactions</li>
          <li>
            Send you technical notices, updates, security alerts, and support
            messages
          </li>
          <li>Respond to your comments, questions, and requests</li>
          <li>
            Communicate with you about products, services, offers, promotions,
            and events
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          3. Information Sharing
        </h3>
        <p>
          We may share the information we collect about you as described in this
          Statement or as described at the time of collection or sharing,
          including as follows:
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>
            With third party service providers to enable them to provide the
            Services we request
          </li>
          <li>
            With the general public if you submit content in a public forum
          </li>
          <li>
            With third parties with whom you choose to let us share information
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          4. Data Security
        </h3>
        <p>
          We take reasonable measures to help protect information about you from
          loss, theft, misuse and unauthorized access, disclosure, alteration
          and destruction.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          5. Cookies
        </h3>
        <p>
          We use cookies and similar tracking technologies to track the activity
          on our Service and hold certain information. You can instruct your
          browser to refuse all cookies or to indicate when a cookie is being
          sent.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          6. Changes to This Policy
        </h3>
        <p>
          We may update this privacy policy from time to time. If we make
          significant changes, we will notify you of the changes through the
          Services or through others means, such as email.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          7. Contact Us
        </h3>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          at privacy@billmunshi.com.
        </p>
      </section>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 ">
      <Textinput
        name="name"
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        register={register}
        error={errors.name}
        className="h-[48px]"
      />
      <Textinput
        name="organizationName"
        label="Name of Organization"
        type="text"
        placeholder="Enter your organization name"
        register={register}
        error={errors.organizationName}
        className="h-[48px]"
      />
      <Select
        name="designation"
        label="Designation"
        register={register}
        options={designationOptions}
        error={errors.designation}
        className="h-[48px]"
      />
      <Select
        name="accountingSoftware"
        label="Accounting Software"
        register={register}
        options={accountingSoftwareOptions}
        error={errors.accountingSoftware}
        className="h-[48px]"
      />
      <Textinput
        name="email"
        label="Work Email"
        type="email"
        placeholder="Enter your work email"
        register={register}
        error={errors.email}
        className="h-[48px]"
      />
      <div>
        <Textinput
          name="password"
          label="Set Password"
          type="password"
          placeholder="Enter your password"
          register={register}
          error={errors.password}
          className="h-[48px]"
        />
        {password && (
          <div className="mt-2">
            <span
              className={`text-sm font-medium ${
                passwordStrength === "Weak"
                  ? "text-red-500"
                  : passwordStrength === "Medium"
                    ? "text-yellow-500"
                    : "text-green-500"
              }`}
            >
              Password Strength: {passwordStrength}
            </span>
          </div>
        )}
      </div>
      <Textinput
        name="phone"
        label="Phone"
        type="text"
        placeholder="Enter your phone number"
        register={register}
        error={errors.phone}
        className="h-[48px]"
      />
      <Checkbox
        label={
          <span>
            You accept our{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTermsModal(true);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Privacy Policy
            </button>
          </span>
        }
        value={checked}
        onChange={() => setChecked(!checked)}
      />
      <Button
        type="submit"
        text="Create an account"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
      />

      {/* Terms and Conditions Modal */}
      <Modal
        activeModal={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
        className="max-w-3xl"
        scrollContent={true}
        centered={true}
        footerContent={
          <>
            <Button
              text="Close"
              className="btn btn-secondary"
              onClick={() => setShowTermsModal(false)}
            />
            <Button
              text="Accept"
              className="btn btn-primary"
              onClick={handleAcceptTerms}
            />
          </>
        }
      >
        <TermsContent />
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        activeModal={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        className="max-w-3xl"
        scrollContent={true}
        centered={true}
        footerContent={
          <>
            <Button
              text="Close"
              className="btn btn-secondary"
              onClick={() => setShowPrivacyModal(false)}
            />
            <Button
              text="Accept"
              className="btn btn-primary"
              onClick={handleAcceptTerms}
            />
          </>
        }
      >
        <PrivacyContent />
      </Modal>
    </form>
  );
};

export default RegForm;
