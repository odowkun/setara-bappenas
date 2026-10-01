"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { showConfirm } from "@/lib/swal";

interface UnsavedChangesContextType {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  markClean: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    return {
      isDirty: false,
      setDirty: () => {},
      markClean: () => {},
    };
  }
  return context;
};

// Helper to determine if a route is an editing or adding page
export const isEditOrAddRoute = (pathname: string): boolean => {
  if (!pathname) return false;
  const p = pathname.toLowerCase();
  return (
    p.includes("/tambah") ||
    p.includes("/edit") ||
    p.includes("/profil/tentang") ||
    p.includes("/profil/visi-misi") ||
    p.includes("/profil/sejarah") ||
    p.includes("/profil/tugas-fungsi") ||
    p.includes("/pengaturan-profil") ||
    p.includes("/lampiran-teknis")
  );
};

export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  // Reset dirty state when route changes (e.g. after successful navigation)
  useEffect(() => {
    setIsDirty(false);
  }, [pathname]);

  // 1. Browser Native Tab/Window Close / Reload Protection (`beforeunload`)
  // Triggers browser native modal: "Leave site? Changes you made may not be saved."
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Standard requirement for Chrome, Safari, Edge, Firefox
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // 2. Automatic Dirty Detection for Forms on Add/Edit Routes
  useEffect(() => {
    const isTargetRoute = isEditOrAddRoute(pathname);

    const handleUserInput = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore search fields and explicitly excluded elements
      const isSearchInput =
        target.getAttribute("type") === "search" ||
        target.getAttribute("role") === "search" ||
        target.getAttribute("data-no-dirty") === "true" ||
        target.closest("[data-no-dirty='true']") ||
        (target instanceof HTMLInputElement &&
          target.placeholder &&
          target.placeholder.toLowerCase().includes("cari"));

      if (isSearchInput) return;

      // Check if target is a form input or contentEditable
      const isFormElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable ||
        target.closest(".ProseMirror") ||
        target.closest("form");

      if (isFormElement && (isTargetRoute || target.closest("form"))) {
        if (!isDirtyRef.current) {
          setIsDirty(true);
        }
      }
    };

    // Auto clear dirty when form is submitted
    const handleFormSubmit = () => {
      setIsDirty(false);
    };

    window.addEventListener("input", handleUserInput, true);
    window.addEventListener("change", handleUserInput, true);
    window.addEventListener("submit", handleFormSubmit, true);

    return () => {
      window.removeEventListener("input", handleUserInput, true);
      window.removeEventListener("change", handleUserInput, true);
      window.removeEventListener("submit", handleFormSubmit, true);
    };
  }, [pathname]);

  // 3. In-App Navigation Interception (Links, Sidebar, Back Buttons)
  useEffect(() => {
    if (!isDirty) return;

    const handleAnchorClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor || !anchor.href) return;

      // Ignore anchor links with javascript:, #, or same exact URL
      const currentUrl = window.location.href;
      if (
        anchor.href === currentUrl ||
        anchor.href.startsWith("javascript:") ||
        anchor.getAttribute("href")?.startsWith("#") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      // If user is navigating to another page while dirty:
      e.preventDefault();
      e.stopPropagation();

      const result = await showConfirm({
        title: "Tinggalkan Halaman?",
        text: "Perubahan yang Anda ketik belum disimpan. Data yang belum disimpan akan hilang jika Anda meninggalkan halaman ini.",
        confirmButtonText: "Ya, Tinggalkan",
        cancelButtonText: "Tetap di Halaman",
        icon: "warning",
      });

      if (result.isConfirmed) {
        setIsDirty(false);
        if (anchor.target === "_blank") {
          window.open(anchor.href, "_blank");
        } else {
          router.push(anchor.href);
        }
      }
    };

    window.addEventListener("click", handleAnchorClick, true);
    return () => {
      window.removeEventListener("click", handleAnchorClick, true);
    };
  }, [isDirty, router]);

  // 4. Browser Back/Forward Button Interception (popstate)
  useEffect(() => {
    if (!isDirty) return;

    // Push dummy history entry so back button doesn't immediately unload
    window.history.pushState(null, "", window.location.href);

    const handlePopState = async () => {
      if (!isDirtyRef.current) return;

      const result = await showConfirm({
        title: "Tinggalkan Halaman?",
        text: "Perubahan yang Anda ketik belum disimpan. Apakah Anda yakin ingin kembali?",
        confirmButtonText: "Ya, Tinggalkan",
        cancelButtonText: "Tetap di Halaman",
        icon: "warning",
      });

      if (result.isConfirmed) {
        setIsDirty(false);
        window.history.back();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setDirty, markClean }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};
