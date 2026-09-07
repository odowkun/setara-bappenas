"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Image from "@tiptap/extension-image";
import { authenticatedFetch } from "@/lib/apiClient";
import { toast } from "@/lib/swal";

import {
  RotateCcw,
  RotateCw,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Underline as UnderlineIcon,
  Highlighter,
  Link as LinkIcon,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImagePlus,
  ChevronDown,
  Maximize2,
  Minimize2,
  X,
  Upload,
  Globe,
  Sparkles,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

// Convert raw markdown string to real HTML tags so Tiptap visually renders formatted text without raw **
function formatMarkdownToHtml(content: string): string {
  if (!content) return "";
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }

  let html = content;
  html = html.replace(/^### (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*<\/li>)/im, "<ul>$1</ul>");

  const paragraphs = html.split("\n\n").map((p) => {
    if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<ol") || p.startsWith("<blockquote")) {
      return p;
    }
    return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
  });

  return paragraphs.join("");
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Welcome to Tiptap Simple Editor...",
  minHeight = "280px",
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [headingDropdown, setHeadingDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Custom Image Add Modal States
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll & handle ESC key
  useEffect(() => {
    if (isFullscreen || showImageModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showImageModal) setShowImageModal(false);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, showImageModal]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Subscript,
      Superscript,
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline font-semibold cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: formatMarkdownToHtml(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value) {
      const formatted = formatMarkdownToHtml(value);
      if (editor.getHTML() !== formatted && editor.getText().trim() === "") {
        editor.commands.setContent(formatted);
      }
    }
  }, [value, editor]);

  if (!isMounted) {
    return (
      <div
        style={{ minHeight }}
        className="w-full p-6 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse text-xs text-slate-400 font-bold"
      >
        Loading Tiptap UI Simple Editor...
      </div>
    );
  }

  if (!editor) return null;

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  // Submit image insertion into Tiptap editor
  const handleInsertImage = async () => {
    if (imageTab === "url") {
      const isStoredUrl =
        imageUrlInput.startsWith("https://") ||
        imageUrlInput.startsWith("http://") ||
        imageUrlInput.startsWith("/storage/");
      if (imageUrlInput && isStoredUrl) {
        editor.chain().focus().setImage({ src: imageUrlInput }).run();
        setShowImageModal(false);
        setImageUrlInput("");
      } else if (imageUrlInput) {
        toast.error("Gunakan URL media permanen dari server, bukan blob/data URL.");
      }
      return;
    }

    if (selectedFile) {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("media", selectedFile);

      try {
        const res = await authenticatedFetch("/media/upload-optimized", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          const webUrl = json.data.web_url || json.data.master_url;
          editor.chain().focus().setImage({ src: webUrl }).run();
        } else {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || "Media gagal disimpan ke server.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Media gagal disimpan ke server.");
      } finally {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setUploadingImage(false);
        setShowImageModal(false);
        setSelectedFile(null);
        setImagePreview(null);
      }
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL Link:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const getHeadingLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    return "H";
  };

  const ToolbarContent = () => (
    <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-600 flex flex-wrap items-center justify-between gap-1 text-xs select-none">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo & Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 disabled:opacity-30 transition text-slate-700"
          title="Undo"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 disabled:opacity-30 transition text-slate-700"
          title="Redo"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" />

        {/* Heading Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setHeadingDropdown(!headingDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/80 font-bold transition text-xs text-slate-800"
          >
            <span>{getHeadingLabel()}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {headingDropdown && (
            <div
              className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-[99999999] py-1 space-y-0.5 text-xs"
              onClick={() => setHeadingDropdown(false)}
            >
              <button
                type="button"
                onClick={() => editor.chain().focus().setParagraph().run()}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 font-medium"
              >
                Normal Text
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="w-full text-left px-3 py-1.5 font-bold text-sm hover:bg-slate-100"
              >
                Heading 1 (H1)
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="w-full text-left px-3 py-1.5 font-bold text-xs hover:bg-slate-100"
              >
                Heading 2 (H2)
              </button>
            </div>
          )}
        </div>

        {/* Lists & Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("bulletList")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("orderedList")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("blockquote")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" />

        {/* Text Formatting Controls: B, I, S, </>, U, Highlight, Link, x², x₂ */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition font-extrabold ${
            editor.isActive("bold")
              ? "bg-slate-200 text-slate-900"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Bold (Cmd+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("italic")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Italic (Cmd+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("strike")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("code")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("underline")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Underline (Cmd+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#e9d5ff" }).run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("highlight")
              ? "bg-purple-100 text-purple-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Highlight Text"
        >
          <Highlighter className="w-3.5 h-3.5 text-purple-600" />
        </button>

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("link")
              ? "bg-blue-100 text-blue-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("superscript")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Superscript (x²)"
        >
          <SuperIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive("subscript")
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Subscript (x₂)"
        >
          <SubIcon className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" />

        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive({ textAlign: "left" })
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive({ textAlign: "center" })
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive({ textAlign: "right" })
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-1.5 rounded-lg transition ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-slate-200 text-slate-900 font-bold"
              : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="Align Justify"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        <span className="h-4 w-px bg-slate-300 mx-1" />

        {/* Add Media / Image Button (Opens Tiptap UI Modern Modal) */}
        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-200/80 font-bold transition text-xs text-slate-700 hover:border-blue-600 hover:text-blue-700"
        >
          <ImagePlus className="w-3.5 h-3.5 text-blue-600" />
          <span>Add</span>
        </button>
      </div>

      {/* Fullscreen Mode Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 font-bold text-xs"
          title={isFullscreen ? "Keluar Fullscreen (Esc)" : "Layar Penuh (Fullscreen)"}
        >
          {isFullscreen ? (
            <>
              <X className="w-4 h-4 text-rose-600" />
              <span className="text-rose-600 font-extrabold">Tutup Fullscreen (Esc)</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Inline Form Card Editor */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:border-blue-700 transition font-sans">
        <ToolbarContent />
        <EditorContent editor={editor} style={{ minHeight }} />
      </div>

      {/* 1. Fullscreen Portal attached to document.body */}
      {isFullscreen && isMounted && createPortal(
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999999] bg-slate-100 flex flex-col w-screen h-screen m-0 p-0 overflow-hidden font-sans">
          <div className="w-full bg-white border-b border-slate-200 px-4 py-2 shadow-sm shrink-0">
            <ToolbarContent />
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl min-h-[85vh] p-6 sm:p-12">
              <EditorContent editor={editor} style={{ minHeight: "75vh" }} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Custom Tiptap UI Modern Image Upload Modal */}
      {showImageModal && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Sisipkan Gambar Ke Artikel</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tiptap UI Modern Media Insertion Dialog
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: Upload Local File vs Insert URL */}
            <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition ${
                  imageTab === "upload" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Berkas</span>
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition ${
                  imageTab === "url" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Tautan URL</span>
              </button>
            </div>

            {imageTab === "upload" ? (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-600 bg-slate-50 hover:bg-blue-50/50 cursor-pointer text-center space-y-2 transition group"
                  >
                    <Upload className="w-8 h-8 text-blue-600 mx-auto group-hover:scale-110 transition" />
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">Pilih Gambar dari Perangkat</p>
                      <p className="text-[11px] text-slate-500 font-medium">PNG, JPG, WebP (Otomatis Kompres 120KB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-44 object-cover rounded-xl border border-slate-200"
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700 truncate max-w-[200px]">
                        {selectedFile?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="text-rose-600 hover:underline font-bold text-[11px]"
                      >
                        Ganti File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">URL Gambar Publik</label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/foto-kegiatan.jpg"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
              </div>
            )}

            {/* Action Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={uploadingImage || (imageTab === "upload" && !selectedFile) || (imageTab === "url" && !imageUrlInput)}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-700/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{uploadingImage ? "Mengunggah..." : "Sisipkan Gambar"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
