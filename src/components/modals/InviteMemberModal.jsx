import React, { useState } from 'react';
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CONTROL_SELECT_ARROW,
} from "@/constants/ui";
import { useInviteMember } from "@/services/memberService";
import { toast } from "sonner";

/**
 * Invite someone into the current organisation.
 *
 * The form used to be built from the DashCode `<Textinput>` / `<Select>`
 * wrappers, which carry their own `.form-label` and `.form-control`
 * geometry — a 14px capitalised label over a ~48px box, inside a dialog
 * whose every other control is 32-36px. The two fields are now plain
 * controls on the app's own scale, and the role explainer is a quiet
 * advisory under the picker rather than a blue card competing with it.
 */

/** Label over a field — the dialog field scale, one step up from SUBTLE_LABEL. */
const LABEL =
  "block text-[11px] font-bold uppercase tracking-[0.14em] " +
  "text-slate-500 dark:text-slate-400 mb-1.5";

/**
 * Field box with no border *colour* — the call site appends exactly one,
 * for the same reason `CONTROL_VALIDATED` in `@/constants/ui` exists: two
 * `border-color` utilities of equal specificity are resolved by their order
 * in the generated stylesheet, not in the attribute.
 */
const FIELD_BASE =
  "w-full h-9 px-2.5 text-[13px] rounded-md border transition-colors " +
  "bg-white dark:bg-slate-900 text-slate-900 dark:text-white " +
  "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
  "focus:outline-none focus:ring-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "disabled:bg-slate-50 dark:disabled:bg-slate-800/60";

const FIELD_OK =
  "border-slate-200 dark:border-slate-700 hover:border-slate-300 " +
  "dark:hover:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20";

const FIELD_ERR =
  "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20";

const fieldClass = (hasError) =>
  `${FIELD_BASE} ${hasError ? FIELD_ERR : FIELD_OK}`;

const InviteMemberModal = ({ isOpen, onClose, organizationId }) => {
  const [formData, setFormData] = useState({
    user_email: "",
    role: "MEMBER",
  });

  const [errors, setErrors] = useState({});
  const { mutateAsync: inviteMember, isPending: isLoading } = useInviteMember();

  const roleOptions = [
    { value: "MEMBER", label: "Member" },
    { value: "ADMIN", label: "Admin" },
  ];

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

  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!formData.user_email) {
      newErrors.user_email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.user_email)) {
      newErrors.user_email = "Please enter a valid email address";
    }

    // Validate role
    if (!formData.role) {
      newErrors.role = "Role is required";
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
      const payload = {
        organizationId,
        organization: organizationId,
        user_email: formData.user_email,
        role: formData.role,
      };

      await inviteMember(payload);

      toast.success("Member invitation sent successfully!");
      handleClose();
    } catch (error) {
      console.error("Invite member error:", error);

      // Parse error message (axios error structure)
      const errorData = error.response?.data;

      // Handle specific error messages from API
      if (errorData?.user_email) {
        setErrors({
          user_email: errorData.user_email[0] || errorData.user_email,
        });
      } else if (errorData?.role) {
        setErrors({ role: errorData.role[0] || errorData.role });
      } else if (errorData?.non_field_errors) {
        toast.error(errorData.non_field_errors[0]);
      } else if (errorData?.detail) {
        toast.error(errorData.detail);
      } else {
        toast.error(
          error.message || "Failed to send invitation. Please try again.",
        );
      }
    }
  };

  const handleClose = () => {
    setFormData({
      user_email: "",
      role: "MEMBER",
    });
    setErrors({});
    onClose();
  };

  const roleError =
    typeof errors.role === "string" ? errors.role : errors.role?.message;

  return (
    <Modal
      title="Invite Member"
      activeModal={isOpen}
      onClose={handleClose}
      className="max-w-md"
      footerContent={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className={BTN_SECONDARY}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={BTN_PRIMARY}
          >
            {isLoading ? (
              <>
                <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Icon icon="heroicons:envelope" className="text-sm" />
                Send Invitation
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
          {/* Email Input */}
          <div className="min-w-0">
            <label className={LABEL} htmlFor="user_email">
              Email address <span className="text-rose-500">*</span>
            </label>
            <input
              id="user_email"
              type="email"
              placeholder="name@company.com"
              value={formData.user_email}
              onChange={(e) => handleInputChange("user_email", e.target.value)}
              disabled={isLoading}
              className={fieldClass(!!errors.user_email)}
            />
            {errors.user_email && (
              <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                {errors.user_email}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="min-w-0">
            <label className={LABEL} htmlFor="role">
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              disabled={isLoading}
              className={`${fieldClass(!!roleError)} pr-8 appearance-none cursor-pointer`}
              style={CONTROL_SELECT_ARROW}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {roleError && (
              <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                {roleError}
              </p>
            )}
          </div>
        </div>

        {/* What each role can do, and where the member lands */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2 text-[12px]">
          <div className="flex items-start gap-2">
            <Icon
              icon="heroicons:information-circle"
              className="text-slate-500 dark:text-slate-400 text-sm shrink-0 mt-0.5"
            />
            <div className="min-w-0 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Member
                </span>{" "}
                — view and manage bills, access reports.
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Admin
                </span>{" "}
                — full access, including members and settings.
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                An invitation is emailed to this address; the member is added to
                your current organisation.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
