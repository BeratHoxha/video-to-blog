import { useState } from "react";
import { UrlInput } from "./UrlInput";
import { FileDropZone } from "./FileDropZone";
import { OptionsPanel } from "./OptionsPanel";
import { Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface VideoToBlogEngineProps {
  authenticated: boolean;
  userTier: string | null;
  wordsRemaining?: number | null;
  onArticleGenerated?: (articleId: number) => void;
  onGuestGenerated?: (articleId: number) => void;
  onUpgrade?: () => void;
}

type ContentMode = "article" | "summary";

interface FormState {
  contentMode: ContentMode;
  outputType: string;
  outputFormat: string;
  useExternalLinks: boolean;
  additionalInstructions: string;
}

type InputMode = "url" | "file";

export function VideoToBlogEngine({
  authenticated,
  userTier: _userTier,
  wordsRemaining,
  onArticleGenerated,
  onGuestGenerated,
  onUpgrade,
}: VideoToBlogEngineProps) {
  const isOverLimit = typeof wordsRemaining === "number" && wordsRemaining <= 0;
  const isLowOnWords =
    typeof wordsRemaining === "number" && wordsRemaining > 0 && wordsRemaining < 300;
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    contentMode: "article",
    outputType: "Blog-Driven",
    outputFormat: "pdf",
    useExternalLinks: false,
    additionalInstructions: "",
  });

  const handleOptionChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleModeSwitch = (mode: InputMode) => {
    setInputMode(mode);
    setError(null);
    if (mode === "url") {
      setSelectedFile(null);
    } else {
      setUrl("");
    }
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

    if (inputMode === "url") {
      if (!url.trim()) {
        setError("Please paste a YouTube URL to get started.");
        return;
      }
    } else {
      if (!selectedFile) {
        setError("Please select a video or audio file to upload.");
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("File must be under 500 MB.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (inputMode === "url") {
        formData.append("source_url", url);
      } else {
        formData.append("source_file", selectedFile!);
      }

      formData.append("content_mode", form.contentMode);
      formData.append("output_type", form.outputType);
      formData.append("output_format", form.outputFormat);
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
      {(isOverLimit || isLowOnWords) && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <span className="mt-0.5 text-amber-400">⚠</span>
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-400">
              {isOverLimit ? "Monthly word limit reached" : "Running low on words"}
            </p>
            <p className="text-amber-400/70 mt-0.5">
              {isOverLimit
                ? "You've used all 2,000 free words this month."
                : `Only ${wordsRemaining} words remaining — long videos may not generate fully.`}{" "}
              Upgrade your plan to keep generating articles.
            </p>
          </div>
          {onUpgrade && (
            <button
              type="button"
              onClick={onUpgrade}
              className="shrink-0 self-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-white transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
      )}

      <div className="flex rounded-lg bg-gray-800 p-1 mb-5">
        <button
          type="button"
          onClick={() => handleModeSwitch("url")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            inputMode === "url" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          YouTube URL
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch("file")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            inputMode === "file" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Upload Video
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {inputMode === "url" ? (
          <UrlInput value={url} onChange={setUrl} />
        ) : (
          <div className="space-y-2">
            <FileDropZone
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              maxSize={MAX_FILE_SIZE}
            />
            <p className="text-xs text-gray-500 text-center">
              Your file is processed server-side — large files may take longer
            </p>
          </div>
        )}

        <OptionsPanel {...form} authenticated={authenticated} onChange={handleOptionChange} />

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
          ) : form.contentMode === "summary" ? (
            "Summarise Video"
          ) : (
            "Generate Article"
          )}
        </button>
      </form>
    </div>
  );
}
