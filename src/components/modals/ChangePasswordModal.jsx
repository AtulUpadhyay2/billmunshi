import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useChangePasswordMutation } from "@/store/api/auth/authApiSlice";
import { toast } from "sonner";
import Icon from "@/components/ui/Icon";
import { CONTROL_VALIDATED, FIELD_LABEL } from "@/constants/ui";

/**
 * One field, used three times.
 *
 * Defined at module scope on purpose: declared inside `ChangePasswordModal` it
 * would be a new component type on every render, so React would unmount and
 * remount the input on each keystroke and the field would lose focus.
 *
 * This replaces the template's `<Textinput>`, which shipped at `py-2.5
 * text-sm` and rendered its own error text. The error is rendered here now —
 * dropping `Textinput` without this would have silently removed the validation
 * messages.
 */
const PasswordField = ({
  label,
  value,
  onChange,
  error,
  show,
  onToggle,
  placeholder,
  hint,
  autoFocus,
}) => (
  <div>
    <label className={FIELD_LABEL}>
      {label} <span className="text-rose-500">*</span>
    </label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        // `CONTROL_VALIDATED` carries no border colour, so both branches name
        // one — see the note in @/constants/ui.
        className={`${CONTROL_VALIDATED} pr-8 ${
          error
            ? "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <Icon
          icon={show ? "heroicons:eye-slash" : "heroicons:eye"}
          className="text-xs"
        />
      </button>
    </div>
    {error ? (
      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
        {error}
      </p>
    ) : (
      hint && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )
    )}
  </div>
);

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    old_password: false,
    new_password: false,
    confirm_password: false,
  });

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.old_password) {
      newErrors.old_password = "Current password is required";
    }

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters long";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your new password";
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    if (
      formData.old_password &&
      formData.new_password &&
      formData.old_password === formData.new_password
    ) {
      newErrors.new_password =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await changePassword(formData).unwrap();

      toast.success(result.detail || "Password changed successfully!");

      // Reset form and close modal
      setFormData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setErrors({});
      setShowPasswords({
        old_password: false,
        new_password: false,
        confirm_password: false,
      });
      onClose();
    } catch (error) {
      console.error("Password change error:", error);

      if (error?.data?.old_password) {
        setErrors((prev) => ({
          ...prev,
          old_password: error.data.old_password[0],
        }));
      } else if (error?.data?.new_password) {
        setErrors((prev) => ({
          ...prev,
          new_password: error.data.new_password[0],
        }));
      } else if (error?.data?.non_field_errors) {
        toast.error(error.data.non_field_errors[0]);
      } else {
        toast.error(
          error?.data?.detail || "Failed to change password. Please try again.",
        );
      }
    }
  };

  const handleClose = () => {
    setFormData({
      old_password: "",
      new_password: "",
      confirm_password: "",
    });
    setErrors({});
    setShowPasswords({
      old_password: false,
      new_password: false,
      confirm_password: false,
    });
    onClose();
  };

  return (
    <Modal
      title="Change Password"
      activeModal={isOpen}
      onClose={handleClose}
      className="max-w-md"
      footerContent={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="inline-flex items-center h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                Changing…
              </>
            ) : (
              <>
                <Icon icon="heroicons:key" className="text-sm" />
                Change Password
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <PasswordField
          label="Current Password"
          placeholder="Enter your current password"
          value={formData.old_password}
          onChange={(e) => handleInputChange("old_password", e.target.value)}
          error={errors.old_password}
          show={showPasswords.old_password}
          onToggle={() => togglePasswordVisibility("old_password")}
          autoFocus
        />

        <PasswordField
          label="New Password"
          placeholder="Enter your new password"
          value={formData.new_password}
          onChange={(e) => handleInputChange("new_password", e.target.value)}
          error={errors.new_password}
          show={showPasswords.new_password}
          onToggle={() => togglePasswordVisibility("new_password")}
          hint="Password must be at least 8 characters long"
        />

        <PasswordField
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={formData.confirm_password}
          onChange={(e) => handleInputChange("confirm_password", e.target.value)}
          error={errors.confirm_password}
          show={showPasswords.confirm_password}
          onToggle={() => togglePasswordVisibility("confirm_password")}
        />

        {/* Requirements. Was `bg-blue-50 border-blue-200 text-blue-900` with no
            dark variants, i.e. a light panel with dark text on the dark page. */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 px-3 py-2.5">
          <h4 className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 mb-1">
            Password requirements
          </h4>
          <ul className="text-[11px] text-blue-700 dark:text-blue-400 space-y-0.5 list-disc pl-4">
            <li>At least 8 characters long</li>
            <li>Different from your current password</li>
            <li>Should be strong and unique</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
