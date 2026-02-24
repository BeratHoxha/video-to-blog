import { useNavigate } from "react-router-dom";
import { ArticleHistory } from "@/components/Dashboard/ArticleHistory";

export function ArticlesPage() {
  const navigate = useNavigate();

  return <ArticleHistory onArticleOpen={(id) => navigate(`/dashboard/articles/${id}`)} />;
}
