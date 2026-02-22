import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { AnimatePresence } from "framer-motion";
import { AIBotPanel } from "./AIBotPanel";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Copy,
  Download,
  Sparkles,
  Check,
} from "lucide-react";

interface Article {
  id: number;
  title: string;
  content: string;
  word_count: number;
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

export function ArticleEditor({
  article,
  user,
  animatedContent,
  onUsageUpdate,
}: ArticleEditorProps) {
  const [showAIBot, setShowAIBot] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [copied, setCopied] = useState(false);
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
    content: animatedContent ?? article.content ?? "",
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
        setShowAIBot(false);
      }
    },
  });

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
        editor.commands.setContent(animatedContent, false);
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

      setShowAIBot(false);
      setSelectedText("");
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
    const res = await fetch(`/api/articles/${article.id}/export?format=${format}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
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

          {/* AI Bot trigger (shows when text is selected) */}
          {selectedText && (
            <button
              onClick={() => setShowAIBot(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                         bg-emerald-500/20 border border-emerald-500/40 text-emerald-400
                         rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              <Sparkles size={12} />
              Rewrite with AI
            </button>
          )}

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

            {user.plan !== "free" && (
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400
                             hover:text-white bg-gray-800 rounded-lg transition-colors border border-gray-700"
                >
                  <Download size={12} />
                  Export
                </button>
                <div className="absolute right-0 top-full mt-1 w-28 bg-gray-800 border border-gray-700
                                rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {["pdf", "docx", "pptx"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300
                                 hover:text-white hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg uppercase"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto px-12 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">{article.title}</h1>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* AI Bot Panel */}
      <AnimatePresence>
        {showAIBot && selectedText && (
          <AIBotPanel
            selectedText={selectedText}
            onApply={(rewritten, remainingCalls) => {
              handleApplyRewrite(rewritten);
              setCallsRemaining(remainingCalls);
              onUsageUpdate?.({ ai_bot_calls_remaining: remainingCalls });
            }}
            onClose={() => setShowAIBot(false)}
            callsRemaining={callsRemaining}
          />
        )}
      </AnimatePresence>
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
        ${active
          ? "bg-emerald-500/20 text-emerald-400"
          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"}`}
    >
      {children}
    </button>
  );
}
