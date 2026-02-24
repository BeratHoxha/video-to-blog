import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Dashboard/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AuthenticatedLayout() {
  const { currentUser } = useAuth();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
