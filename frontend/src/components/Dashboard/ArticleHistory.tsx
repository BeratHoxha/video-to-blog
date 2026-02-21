import { useState, useEffect } from "react";
import { FileText, Clock, Hash } from "lucide-react";

interface Article {
  id: number;
  title: string;
  word_count: number;
  created_at: string;
}

interface ArticleHistoryProps {
  onArticleOpen: (articleId: number) => void;
}

export function ArticleHistory({ onArticleOpen }: ArticleHistoryProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => setArticles(data.articles ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
        <FileText size={40} className="text-gray-700 mb-4" />
        <p className="text-gray-500 text-sm">No articles yet.</p>
        <p className="text-gray-700 text-xs mt-1">Generate your first article to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-lg font-semibold text-white mb-5">Article History</h2>
      <div className="space-y-3">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => onArticleOpen(article.id)}
            className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4
                       hover:border-gray-700 transition-colors group"
          >
            <h3 className="font-medium text-white text-sm mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
              {article.title || "Untitled Article"}
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Hash size={11} />
                {article.word_count.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(article.created_at).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
