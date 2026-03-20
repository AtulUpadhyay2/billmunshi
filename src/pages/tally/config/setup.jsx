import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import ReactSelect from "react-select";
import { useSelector } from "react-redux";
import {
  useGetTallyConfig,
  useCreateOrUpdateTallyConfig,
  useGetParentLedgers,
} from "@/services/tally/tallyApiService";
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
    tds_parents: [],
    vendor_parents: [],
    chart_of_accounts_parents: [],
    chart_of_accounts_expense_parents: [],
    payment_parents: [],
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
        tds_parents: config.tds_parents || [],
        vendor_parents: config.vendor_parents || [],
        chart_of_accounts_parents: config.chart_of_accounts_parents || [],
        chart_of_accounts_expense_parents:
          config.chart_of_accounts_expense_parents || [],
        payment_parents: config.payment_parents || [],
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
        tds_parents: config.tds_parents || [],
        vendor_parents: config.vendor_parents || [],
        chart_of_accounts_parents: config.chart_of_accounts_parents || [],
        chart_of_accounts_expense_parents:
          config.chart_of_accounts_expense_parents || [],
        payment_parents: config.payment_parents || [],
      });
      setCurrentConfigId(config.id);
    } else {
      // No config exists, start with empty form
      setConfigData({
        tally_product_allow_sync: false,
        igst_parents: [],
        cgst_parents: [],
        sgst_parents: [],
        tds_parents: [],
        vendor_parents: [],
        chart_of_accounts_parents: [],
        chart_of_accounts_expense_parents: [],
        payment_parents: [],
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
      tds_parents: [],
      vendor_parents: [],
      chart_of_accounts_parents: [],
      chart_of_accounts_expense_parents: [],
      payment_parents: [],
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
        `Configuration ${config ? "updated" : "created"} successfully!`,
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
    borderColor = "border-slate-200",
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
        minHeight: "44px",
        border: state.isFocused ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        boxShadow: state.isFocused
          ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
          : "none",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        transition: "all 0.2s ease",
        "&:hover": {
          border: state.isFocused ? "2px solid #3b82f6" : "1px solid #9ca3af",
          boxShadow: state.isFocused
            ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
            : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        },
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }),
      menuList: (provided) => ({
        ...provided,
        padding: "4px",
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? "#3b82f6"
          : state.isFocused
            ? "#eff6ff"
            : "transparent",
        color: state.isSelected ? "#ffffff" : "#1f2937",
        borderRadius: "6px",
        margin: "2px 0",
        padding: "10px 12px",
        paddingLeft: state.isSelected ? "36px" : "12px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontWeight: state.isSelected ? "500" : "400",
        fontSize: "14px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        "&:active": {
          backgroundColor: state.isSelected ? "#2563eb" : "#dbeafe",
        },
        "&::before": state.isSelected
          ? {
              content: '"✓"',
              position: "absolute",
              left: "12px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#ffffff",
            }
          : {},
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#1e40af",
        borderRadius: "6px",
        padding: "4px 2px",
        margin: "2px 3px",
        display: "flex",
        alignItems: "center",
        border: "1px solid #1e3a8a",
        maxHeight: "28px",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "500",
        padding: "3px 8px",
        paddingLeft: "8px",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: "#dbeafe",
        borderRadius: "4px",
        padding: "0 6px",
        transition: "all 0.2s ease",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#dc2626",
          color: "#ffffff",
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "#9ca3af",
        fontSize: "14px",
      }),
      input: (provided) => ({
        ...provided,
        color: "#1f2937",
        fontSize: "14px",
      }),
      indicatorSeparator: (provided) => ({
        ...provided,
        backgroundColor: "#e5e7eb",
      }),
      dropdownIndicator: (provided, state) => ({
        ...provided,
        color: state.isFocused ? "#3b82f6" : "#6b7280",
        transition: "all 0.2s ease",
        "&:hover": {
          color: "#3b82f6",
        },
      }),
      clearIndicator: (provided) => ({
        ...provided,
        color: "#6b7280",
        transition: "all 0.2s ease",
        "&:hover": {
          color: "#dc2626",
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
        <label className="flex items-center justify-between text-sm font-semibold text-gray-800 dark:text-gray-200">
          <span>{label}</span>
          <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
            Multiple selection
          </span>
        </label>
        <ReactSelect
          isMulti
          options={parentLedgerOptions}
          value={parentLedgerOptions.filter(
            (option) => value && value.includes(option.value),
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
          components={{
            MultiValue: ({ children, ...props }) => (
              <div
                {...props.innerProps}
                className="inline-flex items-center bg-blue-700 text-white rounded-md pl-3 pr-1 py-1 m-0.5 text-sm font-medium"
                style={{
                  backgroundColor: "#1e40af",
                  border: "1px solid #1e3a8a",
                }}
              >
                {children}
              </div>
            ),
            MultiValueLabel: ({ children, ...props }) => (
              <div
                {...props.innerProps}
                className="text-white"
                style={{
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "500",
                  padding: "2px 4px",
                }}
              >
                {children}
              </div>
            ),
            MultiValueRemove: (props) => (
              <div
                {...props.innerProps}
                className="ml-1 hover:bg-red-600 rounded px-1 cursor-pointer transition-colors flex items-center justify-center"
                style={{
                  color: "#dbeafe",
                  padding: "2px",
                }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            ),
            Option: ({ children, isSelected, isFocused, ...props }) => (
              <div
                {...props.innerProps}
                ref={props.innerRef}
                className={`flex items-center gap-2.5 px-3 py-2.5 mx-1 my-0.5 rounded-md cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white font-medium"
                    : isFocused
                      ? "bg-blue-50 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-all ${
                    isSelected
                      ? "bg-white border-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="flex-1">{children}</span>
              </div>
            ),
          }}
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {value ? value.length : 0} selected
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <Card
        title="Configure Your Tally Ledgers"
        noBorder
        headerSlot={
          <div className="flex gap-3">
            <button
              onClick={handleOpenModal}
              disabled={isLoading || !selectedOrganization?.id}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                config
                  ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {config ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                )}
              </svg>
              {config ? "Edit Config" : "Create Config"}
            </button>
            <button
              onClick={refetch}
              disabled={isLoading || !selectedOrganization?.id}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh configuration"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform duration-300 ${
                  isLoading ? "animate-spin" : ""
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Inventory Accounting Setting
                          </h3>
                          <Tooltip
                            content="Please enable Inventory Accounting if you want to capture inventory details in Tally"
                            placement="right"
                            arrow
                          >
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 hover:scale-110 transition-all duration-200 cursor-help"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                          Enable / Disable Inventory Tracking in Tally
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
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Tax Ledgers
                      </h2>
                      <Tooltip
                        content={
                          <div
                            style={{
                              maxWidth: "350px",
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            Select relevant GST (CGST / SGST / IGST) Input
                            ledgers or TDS Payable ledgers created in Tally.
                          </div>
                        }
                        placement="top"
                        arrow
                      >
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-110 transition-all duration-200 cursor-help"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {renderParentNamesList(
                        config.igst_parent_names,
                        "IGST Input Ledgers",
                        "bg-red-50",
                        "text-red-900",
                        "border-red-200",
                      )}
                      {renderParentNamesList(
                        config.cgst_parent_names,
                        "CGST Input Ledgers",
                        "bg-green-50",
                        "text-green-900",
                        "border-green-200",
                      )}
                      {renderParentNamesList(
                        config.sgst_parent_names,
                        "SGST Input Ledgers",
                        "bg-yellow-50",
                        "text-yellow-900",
                        "border-yellow-200",
                      )}
                      {renderParentNamesList(
                        config.tds_parent_names,
                        "TDS Payable",
                        "bg-orange-50",
                        "text-orange-900",
                        "border-orange-200",
                      )}
                    </div>
                  </div>

                  {/* Tally Ledgers Configuration */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Tally Ledgers Configuration
                      </h2>
                      <Tooltip
                        content={
                          <div
                            style={{
                              maxWidth: "350px",
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            Select relevant ledgers for Vendors, Purchase
                            accounts and all type of Expenses
                          </div>
                        }
                        placement="top"
                        arrow
                      >
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-110 transition-all duration-200 cursor-help"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {renderParentNamesList(
                        config.vendor_parent_names,
                        "Vendor Ledgers",
                        "bg-purple-50",
                        "text-purple-900",
                        "border-purple-200",
                      )}
                      {renderParentNamesList(
                        config.coa_parent_names,
                        "Purchase Parent Ledger",
                        "bg-indigo-50",
                        "text-indigo-900",
                        "border-indigo-200",
                      )}
                      {renderParentNamesList(
                        config.expense_coa_parent_names,
                        "Expense Parent Ledger",
                        "bg-teal-50",
                        "text-teal-900",
                        "border-teal-200",
                      )}
                      {renderParentNamesList(
                        config.payment_parent_names,
                        "Payment Ledgers",
                        "bg-cyan-50",
                        "text-cyan-900",
                        "border-cyan-200",
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
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Product Sync Setting */}
          <div className="flex items-center justify-between p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl transition-all hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Inventory Accounting
                  </h3>
                  <Tooltip
                    content={
                      <div
                        style={{
                          maxWidth: "300px",
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        Please enable Inventory Accounting if you want to
                        capture inventory details in Tally
                      </div>
                    }
                    placement="top"
                    arrow
                  >
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 hover:scale-110 transition-all duration-200 cursor-help"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </Tooltip>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Enable / Disable inventory accounting in Tally
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configData.tally_product_allow_sync}
                onChange={(e) =>
                  handleInputChange(
                    "tally_product_allow_sync",
                    e.target.checked,
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Tax Configuration */}
          <div className="space-y-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
              <svg
                className="w-5 h-5 text-slate-700 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Tax Configuration
              </h3>
              <Tooltip
                content={
                  <div
                    style={{
                      maxWidth: "350px",
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                    }}
                  >
                    Select relevant GST (CGST / SGST / IGST) Input ledgers or
                    TDS Payable ledgers created in Tally.
                  </div>
                }
                placement="top"
                arrow
              >
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 hover:scale-110 transition-all duration-200 cursor-help"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </Tooltip>
            </div>
            <div className="space-y-4">
              {renderMultiSelect(
                "igst_parents",
                "IGST Parent Ledgers",
                configData.igst_parents,
              )}
              {renderMultiSelect(
                "cgst_parents",
                "CGST Parent Ledgers",
                configData.cgst_parents,
              )}
              {renderMultiSelect(
                "sgst_parents",
                "SGST Parent Ledgers",
                configData.sgst_parents,
              )}
              {renderMultiSelect(
                "tds_parents",
                "TDS Payable",
                configData.tds_parents,
              )}
            </div>
          </div>

          {/* Account Configuration */}
          <div className="space-y-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
              <svg
                className="w-5 h-5 text-slate-700 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Account Configuration
              </h3>
              <Tooltip
                content={
                  <div
                    style={{
                      maxWidth: "350px",
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                    }}
                  >
                    Select relevant ledgers for Vendors, Purchase accounts and
                    all type of Expenses
                  </div>
                }
                placement="top"
                arrow
              >
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 hover:scale-110 transition-all duration-200 cursor-help"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </Tooltip>
            </div>
            <div className="space-y-4">
              {renderMultiSelect(
                "vendor_parents",
                "Vendor Parent Ledgers",
                configData.vendor_parents,
              )}
              {renderMultiSelect(
                "chart_of_accounts_parents",
                "Purchase Parent Ledger",
                configData.chart_of_accounts_parents,
              )}
              {renderMultiSelect(
                "chart_of_accounts_expense_parents",
                "Expense Parent Ledger",
                configData.chart_of_accounts_expense_parents,
              )}
              {renderMultiSelect(
                "payment_parents",
                "Payment Parent Ledgers",
                configData.payment_parents,
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createOrUpdateConfigMutation.isPending || isLoadingParentLedgers
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createOrUpdateConfigMutation.isPending
                ? config
                  ? "Updating..."
                  : "Creating..."
                : config
                  ? "Update Configuration"
                  : "Create Configuration"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TallySetup;
