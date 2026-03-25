import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  SelectHTMLAttributes,
  useCallback,
} from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      placeholder = '请选择...',
      error,
      helperText,
      options,
      value,
      onChange,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>(value as string || '');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === selectedValue);

    const handleSelect = useCallback((optionValue: string) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    }, [onChange]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value as string);
      }
    }, [value]);

    const baseStyles = `
      w-full bg-white border rounded-[12px] px-4 py-2.5
      text-[var(--color-text-primary)]
      focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-background)]
      transition-all duration-150 cursor-pointer flex items-center justify-between
    `;

    const variantStyles = error
      ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
      : 'border-[var(--color-border)] focus:border-[var(--color-primary)] hover:border-[var(--color-text-secondary)]';

    return (
      <div ref={containerRef} className="w-full relative">
        {label && (
          <label className="block mb-2 text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${baseStyles}
            ${variantStyles}
            ${className}
          `}
        >
          <span className={selectedOption ? '' : 'text-[var(--color-text-secondary)]'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-[var(--color-text-secondary)] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-border)] rounded-[12px] shadow-lg z-50 max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-4 py-2.5 text-left flex items-center justify-between
                  transition-colors duration-150
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--color-primary-light)] cursor-pointer'}
                  ${selectedValue === option.value ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}
                `}
              >
                <span>{option.label}</span>
                {selectedValue === option.value && (
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                )}
              </button>
            ))}
          </div>
        )}

        {error ? (
          <p className="mt-1.5 text-sm text-[var(--color-danger)]">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            {helperText}
          </p>
        ) : null}

        {/* Hidden native select for form submission */}
        <select ref={ref as React.RefObject<HTMLSelectElement>} value={selectedValue} className="sr-only" {...props}>
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
