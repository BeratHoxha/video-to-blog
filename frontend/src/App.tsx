import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AuthenticatedLayout } from "@/layouts/AuthenticatedLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { ArticlesPage } from "@/pages/ArticlesPage";
import { ArticlePage } from "@/pages/ArticlePage";
import { ProfilePage } from "@/pages/ProfilePage";
import type { User } from "@/types";

interface AppProps {
  user: User;
  csrfToken: string;
}

export function App({ user, csrfToken }: AppProps) {
  return (
    <BrowserRouter>
      <AuthProvider user={user} csrfToken={csrfToken}>
        <Routes>
          <Route element={<ProtectedRoute isAuthenticated={!!user} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/articles" element={<ArticlesPage />} />
              <Route path="/dashboard/articles/:id" element={<ArticlePage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
