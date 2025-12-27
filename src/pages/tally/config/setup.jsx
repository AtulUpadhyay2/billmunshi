import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ReactSelect from "react-select";
import { useSelector } from "react-redux";
import {
  useGetTallyConfig,
  useCreateOrUpdateTallyConfig,
  useGetParentLedgers,
} from "@/hooks/api/tally/tallyApiService";
import { globalToast } from "@/utils/toast";

const TallySetup = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState(null);
  const [configData, setConfigData] = useState({
    tally_product_allow_sync: false,
    igst_parents: [],
    cgst_parents: [],
    sgst_parents: [],
    vendor_parents: [],
    chart_of_accounts_parents: [],
    chart_of_accounts_expense_parents: [],
  });

  const {
    data: configResponse,
    isLoading,
    error,
    refetch,
  } = useGetTallyConfig(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });

  const { data: parentLedgersData, isLoading: isLoadingParentLedgers } =
    useGetParentLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  const createOrUpdateConfigMutation = useCreateOrUpdateTallyConfig();

  // Extract the config from response
  const config = configResponse?.data;

  // Transform parent ledgers data for Select options
  const parentLedgerOptions =
    parentLedgersData?.results?.map((ledger) => ({
      value: ledger.id,
      label: ledger.parent,
    })) || [];

  useEffect(() => {
    if (config) {
      setConfigData({
        tally_product_allow_sync: config.tally_product_allow_sync || false,
        igst_parents: config.igst_parents || [],
        cgst_parents: config.cgst_parents || [],
        sgst_parents: config.sgst_parents || [],
        vendor_parents: config.vendor_parents || [],
        chart_of_accounts_parents: config.chart_of_accounts_parents || [],
        chart_of_accounts_expense_parents:
          config.chart_of_accounts_expense_parents || [],
      });
      setCurrentConfigId(config.id);
    }
  }, [config]);

  const handleOpenModal = () => {
    if (config) {
      // Config exists, populate form for editing
      setConfigData({
        tally_product_allow_sync: config.tally_product_allow_sync || false,
        igst_parents: config.igst_parents || [],
        cgst_parents: config.cgst_parents || [],
        sgst_parents: config.sgst_parents || [],
        vendor_parents: config.vendor_parents || [],
        chart_of_accounts_parents: config.chart_of_accounts_parents || [],
        chart_of_accounts_expense_parents:
          config.chart_of_accounts_expense_parents || [],
      });
      setCurrentConfigId(config.id);
    } else {
      // No config exists, start with empty form
      setConfigData({
        tally_product_allow_sync: false,
        igst_parents: [],
        cgst_parents: [],
        sgst_parents: [],
        vendor_parents: [],
        chart_of_accounts_parents: [],
        chart_of_accounts_expense_parents: [],
      });
    }
    setIsConfigModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsConfigModalOpen(false);
    setConfigData({
      tally_product_allow_sync: false,
      igst_parents: [],
      cgst_parents: [],
      sgst_parents: [],
      vendor_parents: [],
      chart_of_accounts_parents: [],
      chart_of_accounts_expense_parents: [],
    });
  };

  const handleInputChange = (field, value) => {
    setConfigData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createOrUpdateConfigMutation.mutateAsync({
        organizationId: selectedOrganization.id,
        ...configData,
      });

      globalToast.success(
        `Configuration ${config ? "updated" : "created"} successfully!`
      );
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error("Error saving config:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.response?.data?.errors ||
        `Failed to save configuration`;
      globalToast.error(errorMessage);
    }
  };

  const renderParentNamesList = (
    parentNames,
    title,
    bgColor = "bg-slate-50",
    textColor = "text-slate-900",
    borderColor = "border-slate-200"
  ) => {
    if (!parentNames || parentNames.length === 0) {
      return (
        <div
          className={`${bgColor} dark:bg-slate-800 ${borderColor} dark:border-slate-700 border rounded-lg p-4`}
        >
          <h3
            className={`text-sm font-medium text-slate-500 dark:text-slate-400 mb-2`}
          >
            {title}
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            No items configured
          </p>
        </div>
      );
    }

    return (
      <div
        className={`${bgColor} dark:bg-slate-800 ${borderColor} dark:border-slate-700 border rounded-lg p-4`}
      >
        <h3
          className={`text-sm font-medium text-slate-500 dark:text-slate-400 mb-3`}
        >
          {title}
        </h3>
        <div className="space-y-2">
          {parentNames.map((name, index) => (
            <div
              key={index}
              className={`${textColor} dark:text-white text-sm font-medium px-3 py-2 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600`}
            >
              {name}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {parentNames.length} item{parentNames.length !== 1 ? "s" : ""}{" "}
            selected
          </span>
        </div>
      </div>
    );
  };

  const renderMultiSelect = (field, label, value) => {
    // Custom styles for react-select with dark mode support
    const customStyles = {
      control: (provided, state) => ({
        ...provided,
        minHeight: "40px",
        border: state.isFocused ? "2px solid #3b82f6" : "1px solid #d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
        backgroundColor: "white",
        "&:hover": {
          border: "1px solid #9ca3af",
        },
        "@media (prefers-color-scheme: dark)": {
          backgroundColor: "#374151",
          borderColor: "#4b5563",
        },
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: "white",
        "@media (prefers-color-scheme: dark)": {
          backgroundColor: "#374151",
        },
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? "#3b82f6"
          : state.isFocused
          ? "#eff6ff"
          : "white",
        color: state.isSelected ? "white" : "#1f2937",
        "&:hover": {
          backgroundColor: state.isSelected ? "#3b82f6" : "#eff6ff",
        },
        "@media (prefers-color-scheme: dark)": {
          backgroundColor: state.isSelected
            ? "#3b82f6"
            : state.isFocused
            ? "#4b5563"
            : "#374151",
          color: state.isSelected ? "white" : "#f9fafb",
        },
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#dbeafe",
        borderRadius: "4px",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: "#1e40af",
        fontSize: "14px",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: "#1e40af",
        "&:hover": {
          backgroundColor: "#bfdbfe",
          color: "#1d4ed8",
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "#9ca3af",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "#1f2937",
        "@media (prefers-color-scheme: dark)": {
          color: "#f9fafb",
        },
      }),
    };

    // Handle loading state
    if (isLoadingParentLedgers) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}{" "}
            <span className="text-xs text-blue-500">
              (Multiple selection allowed)
            </span>
          </label>
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse flex items-center px-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading options...
            </span>
          </div>
        </div>
      );
    }

    // Handle no options available
    if (!parentLedgerOptions || parentLedgerOptions.length === 0) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}{" "}
            <span className="text-xs text-blue-500">
              (Multiple selection allowed)
            </span>
          </label>
          <div className="h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md flex items-center px-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              No parent ledgers available
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}{" "}
          <span className="text-xs text-blue-500">
            (Multiple selection allowed)
          </span>
        </label>
        <ReactSelect
          isMulti
          options={parentLedgerOptions}
          value={parentLedgerOptions.filter(
            (option) => value && value.includes(option.value)
          )}
          onChange={(selectedOptions) => {
            const selectedValues =
              selectedOptions && Array.isArray(selectedOptions)
                ? selectedOptions.map((opt) => opt.value)
                : [];
            handleInputChange(field, selectedValues);
          }}
          placeholder={`Select multiple ${label.toLowerCase()}`}
          isLoading={false}
          noOptionsMessage={() => "No parent ledgers available"}
          isSearchable={true}
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          styles={customStyles}
          className="react-select-container"
          classNamePrefix="react-select"
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: "#3b82f6",
              primary75: "#93c5fd",
              primary50: "#dbeafe",
              primary25: "#eff6ff",
            },
          })}
          menuPlacement="auto"
          menuPosition="fixed"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Selected: {value ? value.length : 0} item
          {!value || value.length !== 1 ? "s" : ""}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <Card
        title="Tally Configuration"
        noBorder
        headerSlot={
          <div className="flex gap-3">
            <Button
              text={config ? "Edit Config" : "Create Config"}
              className={config ? "btn-warning" : "btn-primary"}
              icon={config ? "heroicons:pencil" : "heroicons:plus"}
              onClick={handleOpenModal}
              disabled={isLoading || !selectedOrganization?.id}
            />
            <button
              onClick={refetch}
              disabled={isLoading || !selectedOrganization?.id}
              className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh configuration"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform duration-300 ${
                  isLoading ? "animate-spin" : "group-hover:rotate-180"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-slate-600 dark:text-slate-400">
                    Loading configuration...
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">
                    <svg
                      className="w-12 h-12 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium">
                      Failed to load configuration
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      {error?.data?.message ||
                        error?.message ||
                        "An error occurred while fetching configuration"}
                    </p>
                  </div>
                  <button
                    onClick={refetch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : !config ? (
                <div className="text-center py-12">
                  <div className="text-slate-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium">
                      No configuration found
                    </p>
                    <p className="text-sm mt-2 mb-4">
                      No Tally configuration has been set up for this
                      organization
                    </p>
                    <Button
                      text="Create Configuration"
                      className="btn-primary"
                      icon="heroicons:plus"
                      onClick={handleOpenModal}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-8">
                  {/* Sync Setting */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Product Sync Setting
                        </h3>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                          Allow synchronization of Tally products
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          config.tally_product_allow_sync
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {config.tally_product_allow_sync
                          ? "Enabled"
                          : "Disabled"}
                      </div>
                    </div>
                  </div>

                  {/* Tax Configuration */}
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                      Tax Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {renderParentNamesList(
                        config.igst_parent_names,
                        "IGST Parent Names",
                        "bg-red-50",
                        "text-red-900",
                        "border-red-200"
                      )}
                      {renderParentNamesList(
                        config.cgst_parent_names,
                        "CGST Parent Names",
                        "bg-green-50",
                        "text-green-900",
                        "border-green-200"
                      )}
                      {renderParentNamesList(
                        config.sgst_parent_names,
                        "SGST Parent Names",
                        "bg-yellow-50",
                        "text-yellow-900",
                        "border-yellow-200"
                      )}
                    </div>
                  </div>

                  {/* Account Configuration */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                      Account Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {renderParentNamesList(
                        config.vendor_parent_names,
                        "Vendor Parent Names",
                        "bg-purple-50",
                        "text-purple-900",
                        "border-purple-200"
                      )}
                      {renderParentNamesList(
                        config.coa_parent_names,
                        "COA Parent Names",
                        "bg-indigo-50",
                        "text-indigo-900",
                        "border-indigo-200"
                      )}
                      {renderParentNamesList(
                        config.expense_coa_parent_names,
                        "Expense COA Parent Names",
                        "bg-teal-50",
                        "text-teal-900",
                        "border-teal-200"
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Configuration Modal */}
      <Modal
        title={`${config ? "Edit" : "Create"} Tally Configuration`}
        labelclassName="btn-outline-dark"
        activeModal={isConfigModalOpen}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Sync Setting */}
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Product Sync
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Allow Tally product synchronization
              </p>
            </div>
            <input
              type="checkbox"
              checked={configData.tally_product_allow_sync}
              onChange={(e) =>
                handleInputChange("tally_product_allow_sync", e.target.checked)
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Tax Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Tax Configuration
              </h3>
              {renderMultiSelect(
                "igst_parents",
                "IGST Parent Ledgers",
                configData.igst_parents
              )}
              {renderMultiSelect(
                "cgst_parents",
                "CGST Parent Ledgers",
                configData.cgst_parents
              )}
              {renderMultiSelect(
                "sgst_parents",
                "SGST Parent Ledgers",
                configData.sgst_parents
              )}
            </div>

            {/* Account Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Configuration
              </h3>
              {renderMultiSelect(
                "vendor_parents",
                "Vendor Parent Ledgers",
                configData.vendor_parents
              )}
              {renderMultiSelect(
                "chart_of_accounts_parents",
                "Chart of Accounts Parent Ledgers",
                configData.chart_of_accounts_parents
              )}
              {renderMultiSelect(
                "chart_of_accounts_expense_parents",
                "Expense COA Parent Ledgers",
                configData.chart_of_accounts_expense_parents
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              text="Cancel"
              className="btn-outline-dark"
              type="button"
              onClick={handleCloseModal}
            />
            <Button
              text={
                createOrUpdateConfigMutation.isPending
                  ? config
                    ? "Updating..."
                    : "Creating..."
                  : config
                  ? "Update Configuration"
                  : "Create Configuration"
              }
              type="submit"
              className="btn-primary"
              disabled={
                createOrUpdateConfigMutation.isPending || isLoadingParentLedgers
              }
              isLoading={createOrUpdateConfigMutation.isPending}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TallySetup;
