import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Icon from "@/components/ui/Icon";
import { useInviteMember } from "@/hooks/api/memberService";
import { toast } from "react-toastify";

const InviteMemberModal = ({ isOpen, onClose, organizationId }) => {
  const [formData, setFormData] = useState({
    user_email: "",
    role: "MEMBER"
  });
  
  const [errors, setErrors] = useState({});
  const { mutateAsync: inviteMember, isPending: isLoading } = useInviteMember();

  const roleOptions = [
    { value: "MEMBER", label: "Member" },
    { value: "ADMIN", label: "Admin" }
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
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
        role: formData.role
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
        setErrors({ user_email: errorData.user_email[0] || errorData.user_email });
      } else if (errorData?.role) {
        setErrors({ role: errorData.role[0] || errorData.role });
      } else if (errorData?.non_field_errors) {
        toast.error(errorData.non_field_errors[0]);
      } else if (errorData?.detail) {
        toast.error(errorData.detail);
      } else {
        toast.error(error.message || "Failed to send invitation. Please try again.");
      }
    }
  };

  const handleClose = () => {
    setFormData({
      user_email: "",
      role: "MEMBER"
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      title="Invite Member"
      activeModal={isOpen}
      onClose={handleClose}
      footerContent={
        <div className="flex justify-end space-x-3">
          <Button
            text="Cancel"
            btnClass="btn-outline-secondary"
            onClick={handleClose}
            disabled={isLoading}
          />
          <Button
            text={isLoading ? "Sending..." : "Send Invitation"}
            btnClass="btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
            isLoading={isLoading}
            icon="heroicons:envelope"
          />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="form-label" htmlFor="user_email">
            Email Address *
          </label>
          <Textinput
            type="email"
            placeholder="Enter member's email address"
            value={formData.user_email}
            onChange={(e) => handleInputChange("user_email", e.target.value)}
            error={errors.user_email ? { message: errors.user_email } : null}
            icon="heroicons:envelope"
            disabled={isLoading}
          />
          <p className="text-xs text-slate-500 mt-1">
            An invitation will be sent to this email address
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="form-label" htmlFor="role">
            Role *
          </label>
          <Select
            options={roleOptions}
            value={roleOptions.find(option => option.value === formData.role)}
            onChange={(selectedOption) => handleInputChange("role", selectedOption.value)}
            placeholder="Select role"
            error={errors.role}
            disabled={isLoading}
          />
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon icon="heroicons:information-circle" className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-1">Role Permissions:</div>
                <ul className="space-y-1">
                  <li><strong>Member:</strong> Can view and manage bills, access reports</li>
                  <li><strong>Admin:</strong> Full access including member management and settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="heroicons:building-office-2" className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Organization
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This member will be added to your current organization
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;