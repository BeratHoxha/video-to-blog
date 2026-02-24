import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import { App } from "./App";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { OnboardingPage } from "./pages/OnboardingPage";

const env = (window as any).__RAILS_ENV__ ?? {};
const currentUser = env.currentUser ?? null;
const csrfToken = env.csrfToken ?? "";

// Landing page
const landingRoot = document.getElementById("landing-root");
if (landingRoot) {
  ReactDOM.createRoot(landingRoot).render(
    <React.StrictMode>
      <LandingPage authenticated={!!currentUser} />
    </React.StrictMode>
  );
}

// Dashboard SPA (React Router)
const dashboardRoot = document.getElementById("dashboard-root");
if (dashboardRoot && currentUser) {
  ReactDOM.createRoot(dashboardRoot).render(
    <React.StrictMode>
      <App user={currentUser} csrfToken={csrfToken} />
    </React.StrictMode>
  );
}

// Onboarding page
const onboardingRoot = document.getElementById("onboarding-root");
if (onboardingRoot) {
  ReactDOM.createRoot(onboardingRoot).render(
    <React.StrictMode>
      <OnboardingPage csrfToken={csrfToken} />
    </React.StrictMode>
  );
}

// Auth pages (sign-in / sign-up)
const authRoot = document.getElementById("auth-root");
if (authRoot) {
  const mode = (authRoot.getAttribute("data-page") ?? "sign-in") as "sign-in" | "sign-up";
  const errors: string[] = JSON.parse(authRoot.getAttribute("data-errors") ?? "[]");
  ReactDOM.createRoot(authRoot).render(
    <React.StrictMode>
      <AuthPage mode={mode} errors={errors} csrfToken={csrfToken} />
    </React.StrictMode>
  );
}
