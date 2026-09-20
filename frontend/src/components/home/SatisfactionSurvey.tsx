"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Info, X, Send, CheckCircle2, HeartHandshake, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { fetchIkmStats, submitQuickSurvey } from "@/services/surveyService";
import { toast } from "@/lib/swal";

type SatisfactionLevel = "sangat" | "cukup" | "kurang" | null;

export const SatisfactionSurvey: React.FC = () => {
  const [selected, setSelected] = useState<SatisfactionLevel>(null);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<SatisfactionLevel>(null);
  const [mounted, setMounted] = useState(false);
  const [totalResponden, setTotalResponden] = useState<number>(38);

  const [ikmStats, setIkmStats] = useState({
    sangat: "61%",
    cukup: "21%",
    kurang: "18%",
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("bappeda_ikm_voted") as SatisfactionLevel;
    if (saved) {
      setSelected(saved);
    }
  }, []);

  const loadStats = async () => {
    try {
      const stats = await fetchIkmStats();
      if (stats) {
        setIkmStats({
          sangat: `${stats.sangat}%`,
          cukup: `${stats.cukup}%`,
          kurang: `${stats.kurang}%`,
        });
        if (typeof stats.total_responden === "number") {
          setTotalResponden(stats.total_responden);
        }
      }
    } catch (err) {
      console.warn("[SatisfactionSurvey] Gagal memuat statistik riil:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Lock body scroll when feedback modal is open
  useEffect(() => {
    if (showModal) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setShowModal(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showModal]);

  const handleSelect = async (level: SatisfactionLevel) => {
    if (!level || isSubmitting) return;

    if (level === "kurang") {
      setShowModal(true);
      setSubmitted(false);
      setFeedback("");
      return;
    }

    setIsSubmitting(true);
    setSelected(level);
    localStorage.setItem("bappeda_ikm_voted", level);

    const res = await submitQuickSurvey(level);
    setIsSubmitting(false);

    if (res.success && res.stats) {
      setIkmStats({
        sangat: `${res.stats.sangat}%`,
        cukup: `${res.stats.cukup}%`,
        kurang: `${res.stats.kurang}%`,
      });
      setTotalResponden(res.stats.total_responden);
      toast.success(
        level === "sangat"
          ? "Terima kasih! Penilaian Sangat Memuaskan Anda berhasil dicatat secara riil."
          : "Terima kasih! Penilaian Cukup Memuaskan Anda berhasil dicatat secara riil."
      );
    } else {
      toast.error(res.message || "Gagal mencatat penilaian.");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await submitQuickSurvey("kurang", feedback.trim());
    setIsSubmitting(false);

    if (res.success && res.stats) {
      setIkmStats({
        sangat: `${res.stats.sangat}%`,
        cukup: `${res.stats.cukup}%`,
        kurang: `${res.stats.kurang}%`,
      });
      setTotalResponden(res.stats.total_responden);
      setSelected("kurang");
      localStorage.setItem("bappeda_ikm_voted", "kurang");
      setSubmitted(true);
      toast.success("Terima kasih! Masukan Anda berhasil dicatat untuk evaluasi layanan.");
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setFeedback("");
      }, 1500);
    } else {
      toast.error(res.message || "Gagal mengirim masukan.");
    }
  };

  const cards = [
    {
      id: "sangat" as SatisfactionLevel,
      label: "Sangat Memuaskan",
      percent: ikmStats.sangat,
      // Happy face
      emoji: (isHovered: boolean, isSelected: boolean) => (
        <svg viewBox="0 0 80 80" className={`w-14 h-14 transition-transform duration-500 ${isHovered || isSelected ? "scale-125 rotate-6" : ""}`}>
          <circle cx="40" cy="40" r="36" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="40" cy="40" r="36" fill="url(#happyGrad)" />
          {/* Eyes */}
          <ellipse cx="28" cy="32" rx="4" ry={isHovered || isSelected ? "5" : "4.5"} fill="#1E293B" />
          <ellipse cx="52" cy="32" rx="4" ry={isHovered || isSelected ? "5" : "4.5"} fill="#1E293B" />
          {/* Eye shine */}
          <circle cx="30" cy="30" r="1.5" fill="white" />
          <circle cx="54" cy="30" r="1.5" fill="white" />
          {/* Mouth - big smile */}
          <path
            d={isHovered || isSelected
              ? "M 22 44 Q 40 64 58 44"
              : "M 24 44 Q 40 60 56 44"}
            fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round"
          />
          {/* Cheeks blush */}
          <circle cx="18" cy="42" r="5" fill="#FB923C" opacity={isHovered || isSelected ? "0.4" : "0.25"} className="transition-opacity duration-300" />
          <circle cx="62" cy="42" r="5" fill="#FB923C" opacity={isHovered || isSelected ? "0.4" : "0.25"} className="transition-opacity duration-300" />
          <defs>
            <radialGradient id="happyGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#FBBF24" />
            </radialGradient>
          </defs>
        </svg>
      ),
      borderColor: "border-blue-500",
      bgColor: "bg-blue-50/50",
      textColor: "text-blue-700",
      percentColor: "text-blue-900",
    },
    {
      id: "cukup" as SatisfactionLevel,
      label: "Cukup Memuaskan",
      percent: ikmStats.cukup,
      // Neutral face
      emoji: (isHovered: boolean, isSelected: boolean) => (
        <svg viewBox="0 0 80 80" className={`w-14 h-14 transition-transform duration-500 ${isHovered || isSelected ? "scale-125 -rotate-3" : ""}`}>
          <circle cx="40" cy="40" r="36" fill="url(#neutralGrad)" stroke="#D1D5DB" strokeWidth="2" />
          {/* Eyes */}
          <ellipse cx="28" cy="34" rx="4" ry={isHovered || isSelected ? "3" : "4"} fill="#475569" />
          <ellipse cx="52" cy="34" rx="4" ry={isHovered || isSelected ? "3" : "4"} fill="#475569" />
          {/* Eye shine */}
          <circle cx="30" cy="32" r="1.5" fill="white" opacity="0.7" />
          <circle cx="54" cy="32" r="1.5" fill="white" opacity="0.7" />
          {/* Mouth - flat or slight frown */}
          <path
            d={isHovered || isSelected
              ? "M 26 50 Q 40 46 54 50"
              : "M 26 48 L 54 48"}
            fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round"
          />
          <defs>
            <radialGradient id="neutralGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </radialGradient>
          </defs>
        </svg>
      ),
      borderColor: "border-slate-300",
      bgColor: "bg-slate-50/50",
      textColor: "text-slate-600",
      percentColor: "text-slate-800",
    },
    {
      id: "kurang" as SatisfactionLevel,
      label: "Kurang Memuaskan",
      percent: ikmStats.kurang,
      // Sad/frustrated face
      emoji: (isHovered: boolean, isSelected: boolean) => (
        <svg viewBox="0 0 80 80" className={`w-14 h-14 transition-transform duration-500 ${isHovered || isSelected ? "scale-125 -rotate-6" : ""}`}>
          <circle cx="40" cy="40" r="36" fill="url(#sadGrad)" stroke="#FCA5A5" strokeWidth="2" />
          {/* Eyes - squinting when hovered */}
          {isHovered || isSelected ? (
            <>
              {/* X eyes for frustrated */}
              <line x1="24" y1="28" x2="32" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
              <line x1="32" y1="28" x2="24" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
              <line x1="48" y1="28" x2="56" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
              <line x1="56" y1="28" x2="48" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="28" cy="34" rx="4" ry="4" fill="#991B1B" />
              <ellipse cx="52" cy="34" rx="4" ry="4" fill="#991B1B" />
              <circle cx="30" cy="32" r="1.5" fill="white" opacity="0.5" />
              <circle cx="54" cy="32" r="1.5" fill="white" opacity="0.5" />
            </>
          )}
          {/* Mouth - sad frown */}
          <path
            d={isHovered || isSelected
              ? "M 24 56 Q 40 42 56 56"
              : "M 26 54 Q 40 44 54 54"}
            fill="none" stroke="#991B1B" strokeWidth="3" strokeLinecap="round"
          />
          {/* Eyebrows - sad */}
          <line x1="20" y1={isHovered || isSelected ? "22" : "24"} x2="34" y2={isHovered || isSelected ? "26" : "26"} stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="46" y1={isHovered || isSelected ? "26" : "26"} x2="60" y2={isHovered || isSelected ? "22" : "24"} stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" />
          <defs>
            <radialGradient id="sadGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#FEE2E2" />
              <stop offset="100%" stopColor="#FECACA" />
            </radialGradient>
          </defs>
        </svg>
      ),
      borderColor: "border-red-300",
      bgColor: "bg-red-50/50",
      textColor: "text-red-600",
      percentColor: "text-red-800",
    },
  ];

  return (
    <>
      <section className="py-10 sm:py-16 lg:py-20 bg-white font-sans border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
          {/* STANDARD SECTION HEADER WITH CTA BUTTON */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Partisipasi &amp; Pelayanan Publik</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Indeks Kepuasan Masyarakat (IKM)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Berikan penilaian dan masukan Anda terhadap efektivitas layanan informasi dan keterbukaan publik BAPPEDA Kabupaten Halmahera Utara.
              </p>
            </div>

            <Link
              href="/survey-kepuasan"
              className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-lg shadow-blue-700/20 flex items-center justify-center gap-2.5 transition active:scale-95 shrink-0 self-start md:self-auto group cursor-pointer"
            >
              <span>Isi Form Survei Kepuasan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Info Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">Info Penilaian</p>
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Untuk memberikan penilaian cepat terhadap layanan informasi website, silahkan klik salah satu ikon atau emoji di bawah ini!
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-white border border-blue-200 text-blue-950 text-xs font-extrabold shadow-xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{totalResponden} Responden Riil Terdata</span>
            </div>
          </div>

          {/* 3 Satisfaction Cards with Framer Motion Stagger */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.12 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5"
          >
            {cards.map((card) => {
              const isSelected = selected === card.id;
              const isHovered = hoveredCard === card.id;

              return (
                <motion.button
                  key={card.id}
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }}
                  onClick={() => handleSelect(card.id)}
                  disabled={isSubmitting}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`
                    relative p-5 sm:p-8 rounded-2xl sm:rounded-[24px] border-2 transition-all duration-300 cursor-pointer text-center
                    flex flex-col items-center justify-center gap-3
                    ${isSelected
                      ? `${card.borderColor} ${card.bgColor} shadow-xl scale-[1.02]`
                      : `border-slate-200 bg-white hover:${card.bgColor} hover:${card.borderColor} hover:shadow-lg`
                    }
                    ${isSubmitting ? "opacity-75 cursor-wait" : ""}
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-xs">
                      Pilihan Anda
                    </div>
                  )}

                  {/* Emoji */}
                  <div className="transition-all duration-300">
                    {card.emoji(isHovered, isSelected)}
                  </div>

                  {/* Label */}
                  <p className={`text-sm font-bold ${isSelected ? card.textColor : "text-slate-600"}`}>
                    {card.label}
                  </p>

                  {/* Percentage */}
                  <p className={`text-4xl sm:text-5xl font-black tracking-tight ${isSelected ? card.percentColor : "text-slate-800"}`}>
                    {card.percent}
                  </p>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Feedback Modal for "Kurang Memuaskan" */}
      {mounted && showModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-md p-5 sm:p-8 relative animate-in fade-in zoom-in-95 duration-300 overscroll-contain"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {submitted ? (
              /* Success State */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Terima Kasih!</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Masukan Anda sangat berharga untuk perbaikan layanan kami.
                </p>
              </div>
            ) : (
              /* Feedback Form */
              <div className="space-y-5">
                {/* Sad Emoji Header */}
                <div className="text-center">
                  <svg viewBox="0 0 80 80" className="w-16 h-16 mx-auto animate-bounce">
                    <circle cx="40" cy="40" r="36" fill="url(#modalSadGrad)" stroke="#FCA5A5" strokeWidth="2" />
                    <line x1="24" y1="28" x2="32" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
                    <line x1="32" y1="28" x2="24" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
                    <line x1="48" y1="28" x2="56" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
                    <line x1="56" y1="28" x2="48" y2="36" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 24 56 Q 40 42 56 56" fill="none" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" />
                    <line x1="20" y1="22" x2="34" y2="26" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="46" y1="26" x2="60" y2="22" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" />
                    <defs>
                      <radialGradient id="modalSadGrad" cx="35%" cy="35%">
                        <stop offset="0%" stopColor="#FEE2E2" />
                        <stop offset="100%" stopColor="#FECACA" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Kami Mohon Maaf 🙏
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Bantu kami memahami mengapa layanan ini kurang memuaskan
                  </p>
                </div>

                {/* Quick Options */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Informasi tidak lengkap",
                    "Tampilan kurang menarik",
                    "Navigasi membingungkan",
                    "Data tidak akurat",
                    "Loading lambat",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFeedback(option)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                        feedback === option
                          ? "bg-red-100 border-red-300 text-red-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Atau tulis masukan Anda di sini..."
                  rows={3}
                  className="w-full p-4 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition font-medium"
                />

                {/* Submit Button */}
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedback.trim() || isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 disabled:shadow-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Masukan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Masukan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
