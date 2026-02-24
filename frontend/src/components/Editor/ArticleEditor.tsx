import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { AIBotPanel } from "./AIBotPanel";
import { Bold, Italic, Heading2, Heading3, Copy, Download, Check, Loader2 } from "lucide-react";

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

  // Walk up to find the nearest block ancestor (paragraph, heading, etc.)
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

  // Search backwards for the start of the sentence (., !, ?)
  let sentStart = 0;
  for (let i = offsetInBlock - 1; i >= 0; i--) {
    if (/[.!?]/.test(blockText[i])) {
      let j = i + 1;
      while (j < blockText.length && blockText[j] === " ") j++;
      sentStart = j;
      break;
    }
  }

  // Search forwards for the end of the sentence (., !, ?)
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

  useEffect(() => {
    setCallsRemaining(user.ai_bot_calls_remaining);
  }, [user.ai_bot_calls_remaining, article.id]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
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
      }
    }, 20);

    return () => window.clearInterval(interval);
  }, [animatedContent, editor]);

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

  const handleCopy = () => {
    const text = editor?.getText() ?? "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async (format: string) => {
    setIsDownloading(true);
    try {
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

  if (!editor) return null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-800 bg-gray-950">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={15} />
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

          <div className="flex-1" />

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
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto px-12 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">{article.title}</h1>
          {/* Wrap EditorContent so clicks outside the title trigger sentence selection */}
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
