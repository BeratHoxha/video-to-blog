import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VideoToBlogEngine } from "@/components/Engine/VideoToBlogEngine";
import { useGenerationPoller } from "@/hooks/useGenerationPoller";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function DashboardPage() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [pendingArticleId, setPendingArticleId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleArticleGenerated = (articleId: number) => {
    setPendingArticleId(articleId);
    setIsGenerating(true);
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
    },
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
          <p className="text-sm">Transcribing and writing your article...</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-white mb-2">New Article</h1>
          <p className="text-gray-500 text-sm mb-8">
            Paste a video URL or upload a file to generate your article.
          </p>
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
