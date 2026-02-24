import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { ArticleEditor } from "@/components/Editor/ArticleEditor";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { Article } from "@/types";

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { currentUser, updateUser } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const animatedContent = (location.state as { animatedContent?: string } | null)
    ?.animatedContent;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then((data) => setArticle(data.article))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Article not found.
      </div>
    );
  }

  return (
    <ArticleEditor
      article={article}
      user={currentUser}
      animatedContent={animatedContent}
      onUsageUpdate={(usage) => updateUser(usage)}
    />
  );
}
