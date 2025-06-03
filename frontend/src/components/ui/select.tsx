import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value,
  onValueChange,
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className="relative">
      <SelectTrigger
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
      >
        <SelectValue value={value} placeholder={placeholder} />
      </SelectTrigger>
      {isOpen && (
        <SelectContent>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onSelect: (value: string) => {
                  onValueChange?.(value);
                  setIsOpen(false);
                }
              });
            }
            return child;
          })}
        </SelectContent>
      )}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  isOpen?: boolean;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  onClick,
  isOpen
}) => {
  return (
    <button
      className={`w-full h-10 px-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isOpen ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface SelectValueProps {
  value?: string;
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ value, placeholder }) => {
  return (
    <span className="block truncate">
      {value || placeholder}
    </span>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return (
    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
      <div className="py-1 max-h-60 overflow-auto">
        {children}
      </div>
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  onSelect
}) => {
  return (
    <button
      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
      onClick={() => onSelect?.(value)}
    >
      {children}
    </button>
  );
}; 