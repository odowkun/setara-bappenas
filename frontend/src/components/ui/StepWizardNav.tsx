"use client";

import React from "react";
import { Check } from "lucide-react";

export interface StepWizardItem {
  id: string | number;
  stepNumber: number;
  label?: string;
  title: string;
  subtitle?: React.ReactNode;
  isCompleted?: boolean;
}

interface StepWizardNavProps {
  steps: StepWizardItem[];
  activeStep: number;
  onStepClick: (step: StepWizardItem, index: number) => void;
  className?: string;
}

/**
 * StepWizardNav - Standardized Multi-Step Stepper Component
 * 
 * Sesuai panduan visual sistem BAPPEDA Halmahera Utara:
 * - Menggunakan layout kartu responsif dengan padding p-4 rounded-2xl border.
 * - Langkah aktif: border-blue-600 ring-2 ring-blue-500/10 dengan badge biru solid (nomor langkah).
 * - Langkah selesai (completed): badge hijau emerald bg-emerald-100 text-emerald-700 dengan ikon Check.
 * - Langkah belum aktif: badge abu-abu bg-slate-100 text-slate-500 dengan nomor langkah.
 * - Label atas: teks uppercase tracking-wider text-[10px] font-black text-slate-400 (e.g. LANGKAH 1).
 * - Judul utama: text-xs sm:text-sm font-black text-slate-900.
 */
export function StepWizardNav({
  steps,
  activeStep,
  onStepClick,
  className = "",
}: StepWizardNavProps) {
  // Hitung grid columns responsif sesuai jumlah langkah
  const gridColsClass =
    steps.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : steps.length === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : steps.length === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <div className={`grid ${gridColsClass} gap-3.5 ${className}`}>
      {steps.map((item, idx) => {
        const stepNum = item.stepNumber ?? idx + 1;
        const isActive = activeStep === stepNum;
        const isCompleted =
          item.isCompleted !== undefined ? item.isCompleted : activeStep > stepNum;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onStepClick(item, idx)}
            className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer ${
              isActive
                ? "bg-white border-blue-600 shadow-sm ring-2 ring-blue-500/10"
                : "bg-white/70 border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            {/* Step Badge Indicator */}
            <div
              className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : isCompleted
                  ? "bg-emerald-100 text-emerald-700 font-bold"
                  : "bg-slate-100 text-slate-500 font-bold"
              }`}
            >
              {isCompleted ? <Check className="w-5 h-5 text-emerald-600" /> : stepNum}
            </div>

            {/* Step Text Stack */}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {item.label || `LANGKAH ${stepNum}`}
              </p>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {item.title}
              </h2>
              {item.subtitle && (
                <div className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                  {item.subtitle}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default StepWizardNav;
