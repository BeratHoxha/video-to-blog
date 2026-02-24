import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface NavProps {
  authenticated: boolean;
}

export function Nav({ authenticated }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300
        ${scrolled ? "border-b border-gray-800" : "border-b border-transparent"}
        bg-gray-950/80 backdrop-blur-md`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-1 font-bold text-lg tracking-tight">
          <span className="text-white">Video</span>
          <span className="text-emerald-500">·</span>
          <span className="text-white">Blog</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <button onClick={() => scrollTo("demo")} className="hover:text-white transition-colors">
            Demo
          </button>
          <button
            onClick={() => scrollTo("how-to-use")}
            className="hover:text-white transition-colors"
          >
            How it works
          </button>
          <button
            onClick={() => scrollTo("pricing")}
            className="hover:text-white transition-colors"
          >
            Pricing
          </button>
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {authenticated ? (
            <a
              href="/dashboard"
              className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
            >
              Dashboard
            </a>
          ) : (
            <>
              <a
                href="/users/sign_in"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign in
              </a>
              <a
                href="/users/sign_up"
                className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
              >
                Get started
              </a>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-gray-400 hover:text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-3">
          {["demo", "how-to-use", "pricing"].map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="block w-full text-left text-sm text-gray-400 hover:text-white py-1 capitalize"
            >
              {id.replace("-", " ")}
            </button>
          ))}
          <div className="pt-2 flex gap-3">
            <a
              href="/users/sign_in"
              className="flex-1 text-center py-2 text-sm text-gray-400 border border-gray-700 rounded-lg"
            >
              Sign in
            </a>
            <a
              href="/users/sign_up"
              className="flex-1 text-center py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
