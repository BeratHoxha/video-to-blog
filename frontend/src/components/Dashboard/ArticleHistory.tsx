import { useState, useEffect, useMemo } from "react";
import { FileText, Clock, Hash, Trash2, Search, AlertTriangle } from "lucide-react";

interface Article {
  id: number;
  title: string;
  word_count: number;
  output_type: string;
  created_at: string;
}

interface ArticleHistoryProps {
  onArticleOpen: (articleId: number) => void;
}

const OUTPUT_TYPE_COLORS: Record<string, string> = {
  "Blog-Driven": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Professional: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Scientific: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Easy-to-Understand": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "SEO-Driven": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Assignment-Driven": "text-pink-400 bg-pink-400/10 border-pink-400/20",
  Informational: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "In-Depth (very detailed)": "text-red-400 bg-red-400/10 border-red-400/20",
  "Presentational Format": "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
};

function relativeDate(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function getCsrfToken(): string {
  return document.querySelector("meta[name='csrf-token']")?.getAttribute("content") ?? "";
}

export function ArticleHistory({ onArticleOpen }: ArticleHistoryProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => setArticles(data.articles ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => a.title?.toLowerCase().includes(q));
  }, [articles, search]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
      });
      if (res.ok || res.status === 204) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-800/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header + search */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-800/60 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Article History</h2>
          {articles.length > 0 && (
            <span className="text-xs text-gray-600 tabular-nums">
              {articles.length} article{articles.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {articles.length > 0 && (
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg
                         pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600
                         focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={36} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No articles yet</p>
            <p className="text-gray-700 text-xs mt-1">
              Generate your first article to see it here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={28} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No articles match &ldquo;{search}&rdquo;</p>
          </div>
        ) : (
          filtered.map((article) => {
            const isConfirming = confirmDeleteId === article.id;
            const isDeleting = deletingId === article.id;
            const badgeClass =
              OUTPUT_TYPE_COLORS[article.output_type] ??
              "text-gray-400 bg-gray-400/10 border-gray-400/20";

            return (
              <div
                key={article.id}
                className={`group relative rounded-xl border transition-all duration-200
                  ${
                    isConfirming
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900/80"
                  }
                  ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
              >
                {isConfirming ? (
                  /* Inline delete confirmation */
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                    <p className="flex-1 text-sm text-gray-300">Delete this article?</p>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-gray-500 hover:text-gray-300 px-2.5 py-1
                                 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="text-xs font-semibold text-white bg-red-500 hover:bg-red-400
                                 px-3 py-1 rounded-lg transition-colors"
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                ) : (
                  /* Normal article row */
                  <div className="flex items-start gap-2 px-4 py-3.5">
                    <button
                      onClick={() => onArticleOpen(article.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
                        {article.title || "Untitled Article"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.output_type && (
                          <span
                            className={`inline-flex items-center text-[10px] font-medium
                                        px-1.5 py-0.5 rounded-md border ${badgeClass}`}
                          >
                            {article.output_type}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Hash size={10} />
                          {(article.word_count ?? 0).toLocaleString()} words
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock size={10} />
                          {relativeDate(article.created_at)}
                        </span>
                      </div>
                    </button>

                    {/* Trash icon — appears on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(article.id);
                      }}
                      title="Delete article"
                      className="shrink-0 opacity-0 group-hover:opacity-100 mt-0.5
                                 p-1.5 rounded-lg text-gray-600 hover:text-red-400
                                 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
