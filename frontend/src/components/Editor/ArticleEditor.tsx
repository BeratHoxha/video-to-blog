import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { AIBotPanel } from "./AIBotPanel";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Cloud,
  CloudOff,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Link as LinkIcon,
  Unlink,
  Copy,
  Download,
  Check,
  Loader2,
} from "lucide-react";

interface Article {
  id: number;
  title: string;
  content: string;
  word_count: number;
  output_format?: string;
}

interface User {
  plan: string;
  ai_bot_calls_remaining: number | null;
}

interface ArticleEditorProps {
  article: Article;
  user: User;
  animatedContent?: string;
  onUsageUpdate?: (usage: {
    ai_bot_calls_remaining?: number | null;
    words_used_this_month?: number;
    words_remaining?: number | null;
  }) => void;
}

// Remove a leading <h1> from HTML content so it isn't duplicated below the
// hardcoded title rendered above the editor.
function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1[^>]*>.*?<\/h1>\s*/is, "");
}

function selectSentenceAt(editor: Editor, pos: number) {
  const { doc } = editor.state;
  const $pos = doc.resolve(pos);

  let depth = $pos.depth;
  while (depth > 0 && !$pos.node(depth).isBlock) {
    depth--;
  }
  if (depth === 0) return;

  const blockStart = $pos.start(depth);
  const blockEnd = $pos.end(depth);
  if (blockStart >= blockEnd) return;

  const blockText = doc.textBetween(blockStart, blockEnd, "");
  const offsetInBlock = pos - blockStart;

  let sentStart = 0;
  for (let i = offsetInBlock - 1; i >= 0; i--) {
    if (/[.!?]/.test(blockText[i])) {
      let j = i + 1;
      while (j < blockText.length && blockText[j] === " ") j++;
      sentStart = j;
      break;
    }
  }

  let sentEnd = blockText.length;
  for (let i = offsetInBlock; i < blockText.length; i++) {
    if (/[.!?]/.test(blockText[i])) {
      sentEnd = i + 1;
      break;
    }
  }

  const raw = blockText.slice(sentStart, sentEnd);
  const trimmed = raw.trim();
  if (!trimmed) return;

  const leadingSpaces = raw.length - raw.trimStart().length;
  const trailingSpaces = raw.length - raw.trimEnd().length;

  const from = blockStart + sentStart + leadingSpaces;
  const to = blockStart + sentEnd - trailingSpaces;

  if (from < to) {
    editor.chain().setTextSelection({ from, to }).run();
  }
}

export function ArticleEditor({
  article,
  user,
  animatedContent,
  onUsageUpdate,
}: ArticleEditorProps) {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [callsRemaining, setCallsRemaining] = useState(user.ai_bot_calls_remaining);

  // Link editing state
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Autosave state
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<number | null>(null);
  // Becomes true once the initial content (animation or static) is fully loaded.
  const readyToSaveRef = useRef(false);

  useEffect(() => {
    setCallsRemaining(user.ai_bot_calls_remaining);
  }, [user.ai_bot_calls_remaining, article.id]);

  // Keep a stable ref to article.id so the save callback doesn't go stale.
  const articleIdRef = useRef(article.id);
  useEffect(() => {
    articleIdRef.current = article.id;
  }, [article.id]);

  const getCsrfToken = useMemo(
    () => () =>
      document.querySelector("meta[name='csrf-token']")?.getAttribute("content") ?? "",
    []
  );

  // Shared fetch helper — used by both debounced autosave and immediate save.
  const patchContent = useCallback(
    async (html: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/articles/${articleIdRef.current}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({ content: html }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
        return res.ok;
      } catch {
        setSaveStatus("error");
        return false;
      }
    },
    [getCsrfToken]
  );

  // Debounced autosave — called on every editor update.
  const scheduleSave = useCallback(
    (getHtml: () => string) => {
      if (!readyToSaveRef.current) return;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = window.setTimeout(
        () => patchContent(getHtml()),
        1500
      );
    },
    [patchContent]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder: "Your article will appear here..." }),
    ],
    content: stripLeadingH1(animatedContent ?? article.content ?? ""),
    editorProps: {
      attributes: {
        class: "tiptap min-h-[400px] focus:outline-none text-lg",
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        setSelectedText(text);
        setSelectionRange({ from, to });
      } else {
        setSelectedText("");
        setSelectionRange(null);
      }
    },
  });

  // Immediate save — flushes any pending debounce and saves right away.
  // Returns true on success. Safe to call even if nothing has changed.
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!editor) return true;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    return patchContent(editor.getHTML());
  }, [editor, patchContent]);

  // Single-click on a sentence selects it and sends it to the AI panel.
  const handleEditorClick = useCallback(() => {
    if (!editor) return;
    requestAnimationFrame(() => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        selectSentenceAt(editor, from);
      }
    });
  }, [editor]);

  // Animate newly generated articles word-by-word before applying full HTML content.
  useEffect(() => {
    if (!animatedContent || !editor) return;

    // Disable autosave during animation so intermediate plain-text frames
    // don't overwrite the rich HTML in the database.
    readyToSaveRef.current = false;

    const htmlToText = (html: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    };

    const escapeHtml = (text: string) =>
      text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const words = htmlToText(animatedContent).split(" ").filter(Boolean);
    if (words.length === 0) {
      editor.commands.setContent(animatedContent, false);
      readyToSaveRef.current = true;
      return;
    }

    editor.commands.setContent("", false);
    let wordIndex = 0;
    const interval = window.setInterval(() => {
      wordIndex += Math.min(4, words.length - wordIndex);

      const chunk = words.slice(0, wordIndex).join(" ");
      editor.commands.setContent(`<p>${escapeHtml(chunk)}</p>`, false);

      if (wordIndex >= words.length) {
        window.clearInterval(interval);
        editor.commands.setContent(stripLeadingH1(animatedContent), false);
        // Enable autosave now that the real HTML is in the editor.
        readyToSaveRef.current = true;
      }
    }, 20);

    return () => window.clearInterval(interval);
  }, [animatedContent, editor]);

  // For articles opened without animation, enable autosave after one tick so
  // the initial setContent doesn't trigger an unnecessary save.
  useEffect(() => {
    if (!editor || animatedContent) return;
    const t = window.setTimeout(() => {
      readyToSaveRef.current = true;
    }, 0);
    return () => window.clearTimeout(t);
  }, [editor, animatedContent]);

  // Register the autosave handler directly on the editor instance.
  // This is more reliable than passing onUpdate to useEditor, as it
  // avoids any closure/stale-ref issues across TipTap versions.
  useEffect(() => {
    if (!editor) return;
    const handler = () => scheduleSave(() => editor.getHTML());
    editor.on("update", handler);
    return () => editor.off("update", handler);
  }, [editor, scheduleSave]);

  const handleApplyRewrite = useCallback(
    (rewritten: string) => {
      if (!editor || !selectionRange) return;

      editor
        .chain()
        .focus()
        .deleteRange(selectionRange)
        .insertContentAt(selectionRange.from, rewritten)
        .run();

      setSelectedText("");
      setSelectionRange(null);
    },
    [editor, selectionRange]
  );

  const handleCopy = async () => {
    if (!editor) return;
    const html = `<h1>${article.title}</h1>${editor.getHTML()}`;
    const plain = `${article.title}\n\n${editor.getText()}`;
    try {
      // Write both HTML (preserves links/formatting in Word, Google Docs, etc.)
      // and plain text as a fallback.
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
    } catch {
      // ClipboardItem not supported in all browsers — fall back to plain text.
      await navigator.clipboard.writeText(plain);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format: string) => {
    setIsDownloading(true);
    try {
      // Flush any pending autosave so the export reads the latest content.
      await saveNow();
      const res = await fetch(`/api/articles/${article.id}/export?file_format=${format}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${article.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Link helpers ──────────────────────────────────────────────────────────

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const existing = editor.getAttributes("link").href ?? "";
    setLinkUrl(existing);
    setLinkInputOpen(true);
    // Defer focus so the input is mounted first
    requestAnimationFrame(() => linkInputRef.current?.focus());
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setLinkInputOpen(false);
    setLinkUrl("");
    // Save immediately so the link persists even if the user reloads
    // or downloads right after applying it.
    saveNow();
  }, [editor, linkUrl, saveNow]);

  const cancelLink = useCallback(() => {
    setLinkInputOpen(false);
    setLinkUrl("");
    editor?.chain().focus().run();
  }, [editor]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
    setLinkInputOpen(false);
    setLinkUrl("");
  }, [editor]);

  if (!editor) return null;

  const isLinkActive = editor.isActive("link");

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-800 bg-gray-950 min-h-[48px]">
          {linkInputOpen ? (
            /* ── Link URL input ────────────────────────────────────── */
            <div className="flex items-center gap-2 flex-1">
              <LinkIcon size={14} className="text-emerald-400 shrink-0" />
              <input
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === "Escape") cancelLink();
                }}
                placeholder="https://example.com"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg
                           px-3 py-1 text-sm text-white placeholder-gray-600
                           focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                onClick={applyLink}
                className="px-3 py-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400
                           text-white rounded-lg transition-colors shrink-0"
              >
                Apply
              </button>
              {isLinkActive && (
                <button
                  onClick={removeLink}
                  className="px-3 py-1 text-xs font-medium bg-red-500/15 hover:bg-red-500/25
                             text-red-400 rounded-lg transition-colors shrink-0"
                >
                  Remove
                </button>
              )}
              <button
                onClick={cancelLink}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300
                           rounded-lg hover:bg-gray-800 transition-colors shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* ── Formatting buttons ────────────────────────────────── */
            <>
              {/* Text style group */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                title="Bold (Ctrl+B)"
              >
                <Bold size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                title="Italic (Ctrl+I)"
              >
                <Italic size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
                title="Underline (Ctrl+U)"
              >
                <UnderlineIcon size={15} />
              </ToolbarButton>

              <Divider />

              {/* Heading group */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive("heading", { level: 1 })}
                title="Heading 1"
              >
                <Heading1 size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive("heading", { level: 2 })}
                title="Heading 2"
              >
                <Heading2 size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive("heading", { level: 3 })}
                title="Heading 3"
              >
                <Heading3 size={15} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                active={editor.isActive("heading", { level: 4 })}
                title="Heading 4"
              >
                <Heading4 size={15} />
              </ToolbarButton>

              <Divider />

              {/* Link button */}
              <ToolbarButton
                onClick={openLinkInput}
                active={isLinkActive}
                title={isLinkActive ? "Edit link" : "Insert link"}
              >
                {isLinkActive ? <Unlink size={15} /> : <LinkIcon size={15} />}
              </ToolbarButton>

              <div className="flex-1" />

              {/* Autosave status */}
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Cloud size={12} className="animate-pulse" /> Saving…
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <Cloud size={12} /> Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <CloudOff size={12} /> Save failed
                </span>
              )}

              {/* Action buttons */}
              <div className="ml-2 flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  title="Copy text"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400
                             hover:text-white bg-gray-800 rounded-lg transition-colors border border-gray-700"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>

                <button
                  onClick={() => handleExport(article.output_format || "pdf")}
                  disabled={isDownloading}
                  title={`Download as ${(article.output_format || "pdf").toUpperCase()}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                             bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60
                             text-white rounded-lg transition-colors shadow-sm shadow-emerald-900/40"
                >
                  {isDownloading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  {isDownloading
                    ? "Downloading..."
                    : `Download ${(article.output_format || "pdf").toUpperCase()}`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto px-12 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">{article.title}</h1>
          <div onClick={handleEditorClick}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* AI Bot Panel — always visible */}
      <AIBotPanel
        selectedText={selectedText}
        onApply={(rewritten, remainingCalls) => {
          handleApplyRewrite(rewritten);
          setCallsRemaining(remainingCalls);
          onUsageUpdate?.({ ai_bot_calls_remaining: remainingCalls });
        }}
        callsRemaining={callsRemaining}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      // Prevent the editor from losing focus (and the selection being cleared)
      // when the user clicks a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors
        ${
          active
            ? "bg-emerald-500/20 text-emerald-400"
            : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-gray-800 mx-1 shrink-0" />;
}
