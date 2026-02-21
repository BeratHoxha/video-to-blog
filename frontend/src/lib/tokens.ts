export const colors = {
  bgPage: "#030712",
  bgCard: "#111827",
  bgRaised: "#1f2937",
  border: "#374151",
  accent: "#10b981",
  accentHover: "#34d399",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#4b5563",
} as const;

export const OUTPUT_TYPES = [
  "Professional",
  "Presentational Format",
  "Scientific",
  "Easy-to-Understand",
  "SEO-Driven",
  "Assignment-Driven",
  "Blog-Driven",
  "Informational",
  "In-Depth (very detailed)",
] as const;

export const OUTPUT_FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "txt", label: "TXT" },
  { value: "pptx", label: "PPTX" },
] as const;

export const SIGN_UP_BENEFITS = [
  "Generate articles up to 2,000 words (Free) or unlimited (paid)",
  "All articles saved to your account",
  "Export as PDF, DOCX, or PPTX",
  "Built-in AI text editor to co-write and refine your article",
  "Reusable article history — re-edit any past article",
  "Fast generation with no word cap",
] as const;
