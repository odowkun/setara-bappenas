"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X, Plus } from "lucide-react";

export interface SearchableOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  creatable?: boolean;
  createLabelPrefix?: string;
  onCreateOption?: (newValue: string) => void;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- Pilih Opsi --",
  searchPlaceholder = "Cari pilihan...",
  className = "",
  disabled = false,
  required = false,
  creatable = false,
  createLabelPrefix = "Tambah pilihan baru:",
  onCreateOption,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 300 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const hasValue = value !== undefined && value !== null && String(value).trim() !== "";
  const displayLabel = selectedOption
    ? selectedOption.label
    : hasValue
    ? String(value)
    : placeholder;

  const trimmedSearch = searchTerm.trim();
  const exactMatch = options.some(
    (opt) =>
      opt.label.toLowerCase() === trimmedSearch.toLowerCase() ||
      String(opt.value).toLowerCase() === trimmedSearch.toLowerCase()
  );

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 280),
      });
    }
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
    setSearchTerm("");
  };

  // Recalculate position on resize/scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreate = (newVal: string) => {
    if (!newVal) return;
    if (onCreateOption) {
      onCreateOption(newVal);
    }
    onChange(newVal);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (creatable && trimmedSearch && !exactMatch) {
        handleCreate(trimmedSearch);
      } else if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative w-full font-sans ${className}`}>
      {/* TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border transition flex items-center justify-between text-left text-xs font-bold ${
          isOpen
            ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800" : "cursor-pointer"}`}
      >
        <span
          className={
            selectedOption || hasValue
              ? "text-slate-900 dark:text-slate-100 font-extrabold truncate"
              : "text-slate-400 font-medium"
          }
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* REACT PORTAL DROPDOWN MENU - PREVENTS ANY CONTAINER OVERFLOW CLIPPING */}
      {isOpen &&
        mounted &&
        createPortal(
          <>
            {/* BACKDROP TO CLOSE DROPDOWN */}
            <div
              className="fixed inset-0 z-[999998]"
              onClick={() => setIsOpen(false)}
            />

            {/* DROPDOWN MENU PANEL */}
            <div
              style={{
                position: "absolute",
                top: `${popoverPos.top}px`,
                left: `${popoverPos.left}px`,
                width: `${popoverPos.width}px`,
              }}
              className="z-[999999] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* SEARCH INPUT */}
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* OPTIONS LIST */}
              <div className="max-h-64 overflow-y-auto p-1.5 scrollbar-thin">
                {/* CREATABLE ACTION BUTTON AT TOP IF USER TYPES NEW OPTION */}
                {creatable && trimmedSearch && !exactMatch && (
                  <button
                    type="button"
                    onClick={() => handleCreate(trimmedSearch)}
                    className="w-full px-3.5 py-2.5 mb-1.5 rounded-xl text-left text-xs transition flex items-center gap-2 cursor-pointer bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60 shadow-2xs"
                  >
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="truncate">
                      <span>{createLabelPrefix} </span>
                      <span className="font-extrabold text-blue-900 dark:text-blue-100">
                        &quot;{trimmedSearch}&quot;
                      </span>
                    </div>
                  </button>
                )}

                {filteredOptions.length === 0 ? (
                  !creatable || !trimmedSearch ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      Pilihan tidak ditemukan
                    </div>
                  ) : null
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = String(opt.value) === String(value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 font-extrabold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                        }`}
                      >
                        <div className="truncate">
                          <div className="truncate">{opt.label}</div>
                          {opt.sublabel && (
                            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              {opt.sublabel}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
