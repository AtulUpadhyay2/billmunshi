import React, { useMemo, useState } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { MenuItem } from "@headlessui/react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedOrganization } from "@/store/api/auth/authSlice";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";

const OrgSwitcher = () => {
  const dispatch = useDispatch();
  const { user, selectedOrganization } = useSelector((s) => s.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    module: "tally",
  });

  const moduleOptions = [
    { value: "tally", label: "Tally" },
    { value: "zoho", label: "Zoho" },
  ];

  const orgs = useMemo(() => Array.isArray(user?.organizations) ? user.organizations : [], [user]);
  if (!orgs || orgs.length === 0) return null;

  const current = selectedOrganization || orgs[0];

  const handleCreateOrganization = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      setCreateLoading(true);
      const response = await apiClient.post(
        "/org/create-with-module/",
        formData
      );

      toast.success(response.data.data.message || "Organization created successfully");
      setShowCreateModal(false);
      setFormData({ name: "", module: "tally" });

      // Optionally reload user data to get updated organizations list
      window.location.reload();
    } catch (error) {
      console.error("Error creating organization:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to create organization";
      toast.error(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const label = (
    <div className="flex items-center px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
      <div className="flex-1">
        <div className="text-slate-700 dark:text-slate-200 text-sm font-medium max-w-[140px] truncate">
          {current?.name || "Organization"}
        </div>
        {current?.role && (
          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
            {current.role}
          </div>
        )}
      </div>
      <span className="text-base ltr:ml-2 rtl:mr-2 text-slate-500">
        <Icon icon="heroicons-outline:chevron-down" />
      </span>
    </div>
  );

  return (
    <>
      <Dropdown label={label} classMenuItems="w-[250px] top-[58px]">
        {orgs.map((o) => (
          <MenuItem key={o.id}>
            {({ isActive }) => (
              <div
                onClick={() => dispatch(setSelectedOrganization(o))}
                className={`${
                  isActive
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-600/50 dark:text-slate-300"
                    : "text-slate-600 dark:text-slate-300"
                } block cursor-pointer px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="block text-sm font-medium truncate">{o.name}</span>
                      {current?.id === o.id && (
                        <span className="text-success-500 text-lg ml-2">
                          <Icon icon="bi:check-lg" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {o.slug && (
                        <div className="text-xs text-slate-400">@{o.slug}</div>
                      )}
                      <div className="flex items-center space-x-2">
                        {o.role && (
                          <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                            o.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            o.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {o.role}
                          </span>
                        )}
                        {o.status && (
                          <span className={`text-xs ${
                            o.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            <Icon icon={o.status === 'ACTIVE' ? 'heroicons:check-circle' : 'heroicons:clock'} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </MenuItem>
        ))}
        
        {/* Add Organization Button */}
        <MenuItem>
          {({ isActive }) => (
            <div
              onClick={() => setShowCreateModal(true)}
              className={`${
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600/50 dark:text-slate-300"
                  : "text-slate-600 dark:text-slate-300"
              } block cursor-pointer px-4 py-3 border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-primary-500">
                  <Icon icon="heroicons:plus-circle" />
                </span>
                <span className="text-sm font-medium">Add Organization</span>
              </div>
            </div>
          )}
        </MenuItem>
      </Dropdown>

      {/* Create Organization Modal */}
      <Modal
        title="Create New Organization"
        labelclassName="btn-outline-dark"
        activeModal={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: "", module: "tally" });
        }}
      >
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <Textinput
            label="Organization Name"
            type="text"
            placeholder="Enter organization name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />

          <Select
            label="Select Module"
            placeholder="Choose module to enable"
            options={moduleOptions}
            value={formData.module}
            onChange={(e) => {
              const selectedValue = e.target ? e.target.value : e;
              setFormData((prev) => ({
                ...prev,
                module: selectedValue,
              }));
            }}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              text="Cancel"
              className="btn-outline-dark"
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: "", module: "tally" });
              }}
            />
            <Button
              text={createLoading ? "Creating..." : "Create Organization"}
              type="submit"
              className="btn-primary"
              disabled={createLoading}
              isLoading={createLoading}
            />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default OrgSwitcher;
