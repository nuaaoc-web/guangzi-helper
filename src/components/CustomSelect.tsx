import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CustomSelect({ label, value, options, onChange, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o === value) || value || placeholder || '请选择';

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 border rounded-lg text-sm cursor-pointer
          flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          bg-white
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'}
        `}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`
                px-3 py-2 text-sm cursor-pointer hover:bg-primary-50
                ${value === opt ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'}
              `}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
