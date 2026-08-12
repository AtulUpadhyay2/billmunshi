import React, { useState, useRef, useEffect } from "react";

/**
 * Trigger geometry per size.
 *
 * Both sizes are the same 32px box now — the same box as `CONTROL` in
 * `@/constants/ui` and as the toolbar buttons. `md` used to be
 * `px-3 py-2 text-sm rounded-lg shadow-sm` (38px) while `sm` was 30px, so a
 * form row that mixed a vendor picker, a ledger picker and an amount input
 * showed three different control heights. `size` now only varies the icon
 * scale; it is kept as a prop so the ~40 existing call sites don't have to
 * change.
 */
const SIZE_STYLES = {
  md: {
    label: "pr-6",
    icons: "pr-1.5",
    chevron: "w-3.5 h-3.5",
    clear: "w-3 h-3",
  },
  sm: {
    label: "pr-5",
    icons: "pr-1.5",
    chevron: "w-3 h-3",
    clear: "w-2.5 h-2.5",
  },
};

/**
 * Trigger skin. Mirrors the `SKIN` constant in `@/constants/ui` — this
 * component predates that module and is a `<button>`, not an `<input>`, so the
 * disabled/placeholder states are spelled out rather than using the `disabled:`
 * and `placeholder:` variants. Notably this used to be `border-gray-300` /
 * `text-gray-900` with **no dark-mode colours at all**, which is why the
 * dropdowns rendered as white boxes on the dark detail pages.
 */
const TRIGGER =
  "w-full h-8 pl-2 flex items-center text-left text-xs rounded-md " +
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 " +
  "transition-colors hover:border-slate-300 dark:hover:border-slate-600 " +
  "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "disabled:bg-slate-50 dark:disabled:bg-slate-800/60";

const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  onClear,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  disabled = false,
  loading = false,
  className = "",
  // Extra classes for the trigger button itself (``className`` lands on
  // the positioning wrapper). Used to square off the trailing corners
  // when the dropdown is the first half of an input group.
  triggerClassName = "",
  size = "md",
  optionLabelKey = "label",
  optionValueKey = "value",
  renderOption = null,
  noOptionsMessage = "No options found",
  loadingMessage = "Loading...",
}) => {
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const label = typeof option === "string" ? option : option[optionLabelKey];
    return label?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Find selected option
  const selectedOption = options.find((option) => {
    const optionValue =
      typeof option === "string" ? option : option[optionValueKey];
    // Handle both string and number comparisons, and ensure we don't match empty/null values
    return (
      value &&
      optionValue &&
      (optionValue === value || String(optionValue) === String(value))
    );
  });

  // Close dropdown when clicking outside and handle scroll/resize
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Calculate optimal dropdown position
  const calculateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      // Search row (48) + option list (max-h-55 = 220) + padding/border.
      const dropdownHeight = 276;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Open upward if insufficient space below but sufficient space above
      const shouldOpenUpward =
        spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
      setOpenUpward(shouldOpenUpward);
    }
  };

  const handleToggle = () => {
    if (!disabled && !loading) {
      if (!isOpen) {
        calculateDropdownPosition();
      }
      setIsOpen(!isOpen);
      setSearchTerm("");
    }
  };

  const handleOptionSelect = (option) => {
    const optionValue =
      typeof option === "string" ? option : option[optionValueKey];
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    } else if (event.key === "Enter" && filteredOptions.length === 1) {
      handleOptionSelect(filteredOptions[0]);
    }
  };

  const getDisplayText = () => {
    if (loading) return loadingMessage;
    if (selectedOption) {
      return typeof selectedOption === "string"
        ? selectedOption
        : selectedOption[optionLabelKey];
    }
    return placeholder;
  };

  const getOptionDisplay = (option) => {
    if (renderOption) {
      return renderOption(option);
    }
    return typeof option === "string" ? option : option[optionLabelKey];
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange(null);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      {/* `flex` so the label keeps its line box centred no matter how tight
          the vertical padding gets — the `sm` variant has only 6px to work
          with. The label is the sole flex child; the clear/chevron icons
          stay absolutely positioned over the right edge as before. */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`${TRIGGER} ${
          selectedOption
            ? "text-slate-900 dark:text-white"
            : "text-slate-400 dark:text-slate-500"
        } ${triggerClassName}`}
      >
        <span className={`flex-1 min-w-0 truncate ${sizeStyle.label}`}>
          {getDisplayText()}
        </span>
        <div
          className={`absolute inset-y-0 right-0 flex items-center ${sizeStyle.icons}`}
        >
          {selectedOption && !loading && (
            <div
              onClick={handleClear}
              className="mr-1 p-0.5 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <svg
                className={sizeStyle.clear}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
          <div className="pointer-events-none">
            {loading ? (
              <div
                className={`${sizeStyle.chevron} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`}
              ></div>
            ) : (
              <svg
                className={`${sizeStyle.chevron} text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-[999999] w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-black/40 overflow-hidden ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-7 pr-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <svg
                  className="w-3.5 h-3.5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-55 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : noOptionsMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue =
                  typeof option === "string" ? option : option[optionValueKey];
                const isSelected = optionValue === value;

                return (
                  <button
                    key={optionValue || index}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full px-2 py-1.5 rounded-md text-xs text-left transition-colors focus:outline-none ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 focus:bg-slate-100 dark:focus:bg-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {getOptionDisplay(option)}
                      </span>
                      {isSelected && (
                        <svg
                          className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
