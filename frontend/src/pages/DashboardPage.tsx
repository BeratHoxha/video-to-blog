import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Dashboard/Sidebar";
import { ArticleHistory } from "@/components/Dashboard/ArticleHistory";
import { VideoToBlogEngine } from "@/components/Engine/VideoToBlogEngine";
import { ArticleEditor } from "@/components/Editor/ArticleEditor";
import { TypewriterText } from "@/components/shared/TypewriterText";
import { useGenerationPoller } from "@/hooks/useGenerationPoller";
import { Loader2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  plan: string;
  words_remaining: number | null;
  words_used_this_month: number;
  ai_bot_calls_remaining: number | null;
  onboarding_completed: boolean;
}

interface Article {
  id: number;
  title: string;
  content: string;
  word_count: number;
}

interface DashboardPageProps {
  user: User;
}

export function DashboardPage({ user }: DashboardPageProps) {
  const [currentView, setCurrentView] = useState<"new" | "history">("new");
  const [pendingArticleId, setPendingArticleId] = useState<number | null>(null);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [animatedContent, setAnimatedContent] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleArticleGenerated = (articleId: number) => {
    setPendingArticleId(articleId);
    setIsGenerating(true);
    setCurrentArticle(null);
  };

  const handleArticleOpen = useCallback((articleId: number) => {
    fetch(`/api/articles/${articleId}`)
      .then((r) => r.json())
      .then((data) => {
        setCurrentArticle(data.article);
        setAnimatedContent(undefined);
        setCurrentView("new");
      })
      .catch(console.error);
  }, []);

  useGenerationPoller({
    articleId: pendingArticleId,
    onComplete: (data) => {
      setIsGenerating(false);
      setPendingArticleId(null);
      if (data.content) {
        const article: Article = {
          id: data.id,
          title: data.title ?? "Generated Article",
          content: data.content,
          word_count: data.word_count ?? 0,
        };
        setCurrentArticle(article);
        setAnimatedContent(data.content);
      }
    },
    onError: () => {
      setIsGenerating(false);
      setPendingArticleId(null);
    },
  });

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar
        user={user}
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === "new") {
            setCurrentArticle(null);
            setAnimatedContent(undefined);
          }
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === "history" ? (
          <ArticleHistory onArticleOpen={handleArticleOpen} />
        ) : currentArticle ? (
          <ArticleEditor
            article={currentArticle}
            user={user}
            animatedContent={animatedContent}
          />
        ) : (
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
                  userTier={user.plan}
                  onArticleGenerated={handleArticleGenerated}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
