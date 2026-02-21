import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AuthPage } from "./pages/AuthPage";
import { OnboardingPage } from "./pages/OnboardingPage";

const env = (window as any).__RAILS_ENV__ ?? {};
const currentUser = env.currentUser ?? null;

function mountPage(rootId: string, page: string) {
  const el = document.getElementById(rootId);
  if (!el) return;

  let component: React.ReactNode;

  switch (page) {
    case "landing":
      component = <LandingPage authenticated={!!currentUser} />;
      break;
    case "dashboard":
      component = currentUser
        ? <DashboardPage user={currentUser} />
        : null;
      break;
    default:
      return;
  }

  if (component) {
    ReactDOM.createRoot(el).render(
      <React.StrictMode>{component}</React.StrictMode>
    );
  }
}

// Mount landing page
const landingRoot = document.getElementById("landing-root");
if (landingRoot) {
  mountPage("landing-root", "landing");
}

// Mount dashboard
const dashboardRoot = document.getElementById("dashboard-root");
if (dashboardRoot) {
  mountPage("dashboard-root", "dashboard");
}

// Mount onboarding page
const onboardingRoot = document.getElementById("onboarding-root");
if (onboardingRoot) {
  ReactDOM.createRoot(onboardingRoot).render(
    <React.StrictMode>
      <OnboardingPage csrfToken={env.csrfToken} />
    </React.StrictMode>
  );
}

// Mount auth pages (sign-in / sign-up)
const authRoot = document.getElementById("auth-root");
if (authRoot) {
  const mode = (authRoot.getAttribute("data-page") ?? "sign-in") as
    | "sign-in"
    | "sign-up";
  const errors: string[] = JSON.parse(
    authRoot.getAttribute("data-errors") ?? "[]"
  );
  ReactDOM.createRoot(authRoot).render(
    <React.StrictMode>
      <AuthPage mode={mode} errors={errors} csrfToken={env.csrfToken} />
    </React.StrictMode>
  );
}
