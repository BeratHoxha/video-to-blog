import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VideoToBlogEngine } from "@/components/Engine/VideoToBlogEngine";
import { useGenerationPoller } from "@/hooks/useGenerationPoller";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function DashboardPage() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [pendingArticleId, setPendingArticleId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const loadingMessage = useRotatingMessage(10_000);

  const handleArticleGenerated = (articleId: number) => {
    setPendingArticleId(articleId);
    setIsGenerating(true);
    setGenerationError(null);
  };

  useGenerationPoller({
    articleId: pendingArticleId,
    onComplete: (data) => {
      setIsGenerating(false);
      setPendingArticleId(null);

      if (data.content && currentUser.plan === "free") {
        const generatedWords = data.word_count ?? 0;
        const wordsUsed = currentUser.words_used_this_month + generatedWords;
        updateUser({
          words_used_this_month: wordsUsed,
          words_remaining: Math.max(0, 2000 - wordsUsed),
        });
      }

      if (data.id) {
        navigate(`/dashboard/articles/${data.id}`, {
          state: { animatedContent: data.content },
        });
      }
    },
    onError: () => {
      setIsGenerating(false);
      setPendingArticleId(null);
      setGenerationError(
        "Generation failed. The video may be unavailable or its audio couldn't be processed. Please try a different video."
      );
    },
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-gray-800 flex items-center justify-center">
              <Loader2 size={26} className="animate-spin text-emerald-500" />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <p className="text-sm font-medium text-white">Working on your article…</p>
            <p
              key={loadingMessage}
              className="text-sm text-gray-500 transition-opacity duration-500"
            >
              {loadingMessage}
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-white mb-2">New Article</h1>
          <p className="text-gray-500 text-sm mb-8">
            Paste a video URL or upload a file to generate your article.
          </p>
          {generationError && (
            <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {generationError}
            </p>
          )}
          <VideoToBlogEngine
            authenticated={true}
            userTier={currentUser.plan}
            wordsRemaining={currentUser.words_remaining}
            onArticleGenerated={handleArticleGenerated}
            onUpgrade={() => navigate("/dashboard/profile?tab=plan")}
          />
        </div>
      )}
    </div>
  );
}
