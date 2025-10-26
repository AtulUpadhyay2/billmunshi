import React, { useState, useRef, useEffect } from 'react';

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
    optionLabelKey = "label",
    optionValueKey = "value",
    renderOption = null,
    noOptionsMessage = "No options found",
    loadingMessage = "Loading..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
        const label = typeof option === 'string' ? option : option[optionLabelKey];
        return label?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Find selected option
    const selectedOption = options.find(option => {
        const optionValue = typeof option === 'string' ? option : option[optionValueKey];
        // Handle both string and number comparisons, and ensure we don't match empty/null values
        return value && optionValue && (optionValue === value || String(optionValue) === String(value));
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled && !loading) {
            setIsOpen(!isOpen);
            setSearchTerm('');
        }
    };

    const handleOptionSelect = (option) => {
        const optionValue = typeof option === 'string' ? option : option[optionValueKey];
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        } else if (event.key === 'Enter' && filteredOptions.length === 1) {
            handleOptionSelect(filteredOptions[0]);
        }
    };

    const getDisplayText = () => {
        if (loading) return loadingMessage;
        if (selectedOption) {
            return typeof selectedOption === 'string' ? selectedOption : selectedOption[optionLabelKey];
        }
        // Only show placeholder if no valid selectedOption is found
        return placeholder;
    };

    const getOptionDisplay = (option) => {
        if (renderOption) {
            return renderOption(option);
        }
        return typeof option === 'string' ? option : option[optionLabelKey];
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onClear) {
            onClear();
        } else {
            onChange(null);
        }
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled || loading}
                className={`w-full px-3 py-2 text-sm text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    selectedOption ? 'text-gray-900' : 'text-gray-500'
                }`}
            >
                <span className="block truncate pr-6">{getDisplayText()}</span>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {selectedOption && !loading && (
                        <div
                            onClick={handleClear}
                            className="mr-1 p-0.5 rounded-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Clear selection"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                    <div className="pointer-events-none">
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </div>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={searchPlaceholder}
                                className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                {searchTerm ? `No results for "${searchTerm}"` : noOptionsMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const optionValue = typeof option === 'string' ? option : option[optionValueKey];
                                const isSelected = optionValue === value;
                                
                                return (
                                    <button
                                        key={optionValue || index}
                                        type="button"
                                        onClick={() => handleOptionSelect(option)}
                                        className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                                            isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="truncate">{getOptionDisplay(option)}</span>
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
