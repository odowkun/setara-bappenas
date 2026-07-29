import Swal from "sweetalert2";
import toast from "react-hot-toast";

export const showConfirm = async (options: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
  dangerouslySetInnerHTML?: boolean;
}) => {
  return await Swal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon || "question",
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || "Ya, Lanjutkan",
    cancelButtonText: options.cancelButtonText || "Batal",
    customClass: {
      popup: "rounded-3xl p-6 font-sans border border-slate-200 shadow-2xl bg-white",
      title: "text-base font-black text-slate-900",
      htmlContainer: "text-xs font-medium text-slate-600 mt-2",
      confirmButton:
        "px-5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-700/20 mr-2 transition cursor-pointer",
      cancelButton:
        "px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer",
    },
    buttonsStyling: false,
  });
};

export const showDeleteConfirm = async (itemTitle: string) => {
  return await Swal.fire({
    title: "Apakah Anda Yakin?",
    text: `Data "${itemTitle}" akan dihapus secara permanen.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus Data",
    cancelButtonText: "Batal",
    customClass: {
      popup: "rounded-3xl p-6 font-sans border border-slate-200 shadow-2xl bg-white",
      title: "text-base font-black text-slate-900",
      htmlContainer: "text-xs font-medium text-slate-600 mt-2",
      confirmButton:
        "px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 mr-2 transition cursor-pointer",
      cancelButton:
        "px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer",
    },
    buttonsStyling: false,
  });
};

export const showSuccessSwal = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonText: "Selesai",
    customClass: {
      popup: "rounded-3xl p-6 font-sans border border-slate-200 shadow-2xl bg-white",
      title: "text-base font-black text-slate-900",
      htmlContainer: "text-xs font-medium text-slate-600 mt-2",
      confirmButton:
        "px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer",
    },
    buttonsStyling: false,
  });
};

export const showErrorSwal = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonText: "Tutup",
    customClass: {
      popup: "rounded-3xl p-6 font-sans border border-slate-200 shadow-2xl bg-white",
      title: "text-base font-black text-slate-900",
      htmlContainer: "text-xs font-medium text-slate-600 mt-2",
      confirmButton:
        "px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer",
    },
    buttonsStyling: false,
  });
};

export { toast };
