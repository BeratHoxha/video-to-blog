import { useState } from "react";
import { UrlInput } from "./UrlInput";
import { FileDropZone } from "./FileDropZone";
import { OptionsPanel } from "./OptionsPanel";
import { Loader2 } from "lucide-react";

interface VideoToBlogEngineProps {
  authenticated: boolean;
  userTier: string | null;
  wordsRemaining?: number | null;
  onArticleGenerated?: (articleId: number) => void;
  onGuestGenerated?: (articleId: number) => void;
}

type InputMode = "url" | "file";

interface FormState {
  outputType: string;
  outputFormat: string;
  includeImages: boolean;
  useExternalLinks: boolean;
  additionalInstructions: string;
}

export function VideoToBlogEngine({
  authenticated,
  userTier,
  wordsRemaining,
  onArticleGenerated,
  onGuestGenerated,
}: VideoToBlogEngineProps) {
  const isOverLimit = typeof wordsRemaining === "number" && wordsRemaining <= 0;
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    outputType: "Blog-Driven",
    outputFormat: "pdf",
    includeImages: false,
    useExternalLinks: false,
    additionalInstructions: "",
  });

  const handleOptionChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getCsrfToken = () => {
    const meta = document.querySelector("meta[name='csrf-token']");
    return meta?.getAttribute("content") ?? "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isOverLimit) {
      setError("You've used all your words for this month. Upgrade to keep generating.");
      return;
    }

    if (!url && !file) {
      setError("Please provide a video URL or upload a file.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (url) formData.append("source_url", url);
      if (file) formData.append("source_file", file);
      formData.append("output_type", form.outputType);
      formData.append("output_format", form.outputFormat);
      formData.append("include_images", String(form.includeImages));
      formData.append("use_external_links", String(form.useExternalLinks));
      formData.append("additional_instructions", form.additionalInstructions);

      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "X-CSRF-Token": getCsrfToken() },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json();

      if (authenticated) {
        onArticleGenerated?.(data.article_id);
      } else {
        onGuestGenerated?.(data.article_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl w-full">
      {/* Input mode tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-800 rounded-lg">
        {(["url", "file"] as InputMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setInputMode(mode)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all
              ${inputMode === mode
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
              }`}
          >
            {mode === "url" ? "Video URL" : "Upload File"}
          </button>
        ))}
      </div>

      {isOverLimit && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <span className="mt-0.5 text-amber-400">⚠</span>
          <div className="text-sm">
            <p className="font-medium text-amber-400">Monthly word limit reached</p>
            <p className="text-amber-400/70 mt-0.5">
              You've used all 2,000 free words this month. Upgrade your plan to keep generating articles.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input */}
        {inputMode === "url" ? (
          <UrlInput value={url} onChange={setUrl} />
        ) : (
          <FileDropZone onFileSelect={setFile} selectedFile={file} />
        )}

        {/* Options */}
        <OptionsPanel
          {...form}
          authenticated={authenticated}
          onChange={handleOptionChange}
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isOverLimit}
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60
                     text-white font-semibold rounded-lg transition-colors
                     flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            "Generate"
          )}
        </button>
      </form>
    </div>
  );
}
