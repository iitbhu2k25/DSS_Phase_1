'use client'
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectDropdownProps {
  id: string;
  label: string;
  options: Option[];
  selectedOptions: string[];
  selectedNames: string[];
  placeholder: string;
  disabled?: boolean;
  onSelectionChange: (selectedIds: string[], selectedNames: string[]) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id,
  label,
  options,
  selectedOptions,
  selectedNames,
  placeholder,
  disabled = false,
  onSelectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter options based on search text
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Calculate the displayed button text
  const buttonText = selectedNames.length > 0
    ? (selectedNames.length <= 2 
        ? selectedNames.join(', ') 
        : `${selectedNames.length} ${label} Selected`)
    : placeholder;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchText('');
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (optionId: string, optionName: string) => {
    const isSelected = selectedOptions.includes(optionId);
    let newSelectedOptions: string[];
    let newSelectedNames: string[];

    if (isSelected) {
      // Remove from selection
      newSelectedOptions = selectedOptions.filter(id => id !== optionId);
      newSelectedNames = selectedNames.filter(name => name !== optionName);
    } else {
      // Add to selection
      newSelectedOptions = [...selectedOptions, optionId];
      newSelectedNames = [...selectedNames, optionName];
    }

    onSelectionChange(newSelectedOptions, newSelectedNames);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allOptionIds = filteredOptions.map(option => option.id);
      const allOptionNames = filteredOptions.map(option => option.name);
      onSelectionChange(allOptionIds, allOptionNames);
    } else {
      onSelectionChange([], []);
    }
  };

  // Check if all filtered options are selected
  const areAllSelected = filteredOptions.length > 0 && 
    filteredOptions.every(option => selectedOptions.includes(option.id));

  return (
    <div className="w-full" ref={dropdownRef}>
      <label htmlFor={id} className="form-label block text-sm font-bold mb-1">
        {label}:
      </label>
      
      <div className="relative">
        <button
          id={id}
          className={`flex justify-between items-center w-full px-3 py-2 text-sm font-medium 
            border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light 
            ${disabled 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'bg-white hover:bg-gray-50 text-gray-700'} 
            ${isOpen ? 'ring-2 ring-primary-light' : 'border-gray-300'}`}
          onClick={toggleDropdown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          type="button"
        >
          <span className="truncate">{buttonText}</span>
          <svg 
            className={`w-5 h-5 ml-2 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isOpen && (
          <div 
            className="absolute z-dropdown mt-1 w-full bg-white shadow-card rounded-md max-h-dropdown overflow-y-auto border border-gray-200"
            role="listbox"
          >
            <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
              <input
                ref={searchRef}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            
            <div className="p-2 border-b border-gray-200">
              <div className="flex items-center px-2 py-1 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  id={`select-all-${id}`}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                  checked={areAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <label
                  htmlFor={`select-all-${id}`}
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Select All
                </label>
              </div>
            </div>
            
            <div className="py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div
                    key={option.id}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={`option-${option.id}`}
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                      checked={selectedOptions.includes(option.id)}
                      onChange={() => handleCheckboxChange(option.id, option.name)}
                    />
                    <label
                      htmlFor={`option-${option.id}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer overflow-hidden overflow-ellipsis whitespace-nowrap"
                    >
                      {option.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No matching {label.toLowerCase()} found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;