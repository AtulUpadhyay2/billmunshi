import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import { useChangePasswordMutation } from "@/store/api/auth/authApiSlice";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    old_password: false,
    new_password: false,
    confirm_password: false
  });

  const [changePassword, { isLoading }] = useChangePasswordMutation();

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
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

    if (formData.old_password && formData.new_password && formData.old_password === formData.new_password) {
      newErrors.new_password = "New password must be different from current password";
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
        confirm_password: ""
      });
      setErrors({});
      setShowPasswords({
        old_password: false,
        new_password: false,
        confirm_password: false
      });
      onClose();
      
    } catch (error) {
      console.error("Password change error:", error);
      
      if (error?.data?.old_password) {
        setErrors(prev => ({ ...prev, old_password: error.data.old_password[0] }));
      } else if (error?.data?.new_password) {
        setErrors(prev => ({ ...prev, new_password: error.data.new_password[0] }));
      } else if (error?.data?.non_field_errors) {
        toast.error(error.data.non_field_errors[0]);
      } else {
        toast.error(error?.data?.detail || "Failed to change password. Please try again.");
      }
    }
  };

  const handleClose = () => {
    setFormData({
      old_password: "",
      new_password: "",
      confirm_password: ""
    });
    setErrors({});
    setShowPasswords({
      old_password: false,
      new_password: false,
      confirm_password: false
    });
    onClose();
  };

  return (
    <Modal
      title="Change Password"
      labelClass="btn-outline-dark"
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
            text={isLoading ? "Changing..." : "Change Password"}
            btnClass="btn-dark"
            onClick={handleSubmit}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="form-label" htmlFor="old_password">
            Current Password *
          </label>
          <div className="relative">
            <Textinput
              type={showPasswords.old_password ? "text" : "password"}
              placeholder="Enter your current password"
              value={formData.old_password}
              onChange={(e) => handleInputChange("old_password", e.target.value)}
              error={errors.old_password ? { message: errors.old_password } : null}
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => togglePasswordVisibility("old_password")}
            >
              <Icon 
                icon={showPasswords.old_password ? "heroicons:eye-slash" : "heroicons:eye"} 
                className="w-5 h-5" 
              />
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="form-label" htmlFor="new_password">
            New Password *
          </label>
          <div className="relative">
            <Textinput
              type={showPasswords.new_password ? "text" : "password"}
              placeholder="Enter your new password"
              value={formData.new_password}
              onChange={(e) => handleInputChange("new_password", e.target.value)}
              error={errors.new_password ? { message: errors.new_password } : null}
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => togglePasswordVisibility("new_password")}
            >
              <Icon 
                icon={showPasswords.new_password ? "heroicons:eye-slash" : "heroicons:eye"} 
                className="w-5 h-5" 
              />
            </button>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Password must be at least 8 characters long
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="form-label" htmlFor="confirm_password">
            Confirm New Password *
          </label>
          <div className="relative">
            <Textinput
              type={showPasswords.confirm_password ? "text" : "password"}
              placeholder="Confirm your new password"
              value={formData.confirm_password}
              onChange={(e) => handleInputChange("confirm_password", e.target.value)}
              error={errors.confirm_password ? { message: errors.confirm_password } : null}
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => togglePasswordVisibility("confirm_password")}
            >
              <Icon 
                icon={showPasswords.confirm_password ? "heroicons:eye-slash" : "heroicons:eye"} 
                className="w-5 h-5" 
              />
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Different from your current password</li>
            <li>• Should be strong and unique</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;