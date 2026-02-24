# Task: Video-to-Blog Web Application

## Overview

Build a full-stack web application that converts video content (via URL or file upload) into structured blog articles using AI. The app includes a public landing page with a limited free trial, authenticated user dashboard, interactive AI-assisted text editor, and article history.

---

## Terminology

- **Engine**: The "video-to-blog engine" — the core UI component for submitting a video and selecting generation options. Identical in layout between the landing page and the dashboard; behavior differs by auth state.
- **AI Bot**: The inline co-writing assistant available inside the text editor post-generation.

---

## User Tiers

| Tier    | Word Limit | AI Bot Calls/Week | Export Formats     |
|---------|------------|-------------------|--------------------|
| Free    | 2,000      | 10                | Copy only          |
| Basic   | Unlimited  | Unlimited         | PDF, DOCX, PPTX    |
| Premium | Unlimited  | Unlimited         | PDF, DOCX, PPTX    |

Unauthenticated users: output capped at ~300 words. No export. No saving.

---

## Interaction 1 — Landing Page (Unauthenticated)

### Page Sections (in order)

1. **Engine Section** (top of page)
2. **Demo Video** (below engine)
3. **How to Use** (step-by-step instructions)
4. **What We Offer** (value proposition)
5. **Pricing** (Free / Basic / Premium tiers)
6. **Newsletter Signup** (CTA)

### Engine Section — Landing Page Behavior

- **H1**: "Video to Blog"
- Input: URL field OR file drop zone (video file upload)
- Options panel with the following controls:

  **Output Type** (single select):
  - Professional
  - Presentational Format
  - Scientific
  - Easy-to-Understand
  - SEO-Driven
  - Assignment-Driven
  - Blog-Driven
  - Informational
  - In-Depth (very detailed)

  **Output Format** (single select):
  - PDF
  - DOCX
  - TXT
  - PPTX

  **Include Images**: Yes / No (toggle)

  **Use External Links**: Yes / No (toggle)

  **Additional Instructions**: Optional free-text field

- CTA button: "Generate"

### Funnel Behavior (Unauthenticated)

1. On "Generate" click, process the video and stream output into a modal.
2. Output is capped at ~300 words.
3. Text streams in real-time (character-by-character or token-by-token, simulating live writing).
4. Once generation stops, display a "Sign Up for More" section inside the modal with the following benefits listed:
   - Generate articles up to 2,000 words (Free) or unlimited (paid)
   - All articles saved to your account
   - Export as PDF, DOCX, or PPTX
   - Built-in AI text editor to co-write and refine your article
   - Reusable article history — re-edit any past article
   - Fast generation with no word cap

### Additional Landing Page Sections

**Demo Video**
- Embed a placeholder video player; video asset to be provided separately.

**How to Use**
- Display numbered steps:
  1. Paste a video URL or drop a video file
  2. Select your output type and format options
  3. Click "Generate"
  4. Review your article in real time
  5. Sign up to unlock the full article and editing features

**What We Offer**
- Convert any video into a structured blog article
- AI co-writing agent to refine and extend the generated content
- Personalized article history and workspace

**Pricing**
- Three tiers: Free, Basic, Premium
- Display pricing cards with feature comparison (specific prices TBD — use placeholder values)

**Newsletter Signup**
- Email input + subscribe CTA button

---

## Interaction 2 — Post-Signup & Dashboard (Authenticated)

### Onboarding Flow

After signup, prompt the user to complete a short onboarding:
1. Reason for using the tool (e.g., content creator, student, marketer — multiple choice)
2. Preferred plan selection (Free / Basic / Premium)

After onboarding, redirect to the dashboard with the engine section active.

### Dashboard Layout

- **Left sidebar**: Word usage tracker — displays words used vs. words remaining for the current billing period. AI Bot call counter (used / limit) visible for free users.
- **Main area**: Engine section (identical UI to landing page engine), followed by the article editor after generation.

### Generation Flow (Authenticated)

1. User submits URL or file + options, clicks "Generate".
2. Article streams into the text editor in real time (same UX as ChatGPT streaming, but rendered in an editable rich text editor).
3. Full word limit applies based on user tier.

### AI Text Editor

- Rich text editor (e.g., TipTap, Slate, or Quill — use whichever integrates cleanly).
- User can highlight any sentence or paragraph.
- On highlight, a contextual sidebar panel appears on the right with:
  - A prompt input field (e.g., "Rewrite this to be more professional")
  - A "Apply" button that sends the selection + prompt to the AI Bot and replaces the selection with the result in-editor
- Free users: 10 AI Bot calls/week. Display remaining calls visibly in the UI. When limit is reached, show upgrade prompt.
- Basic/Premium users: Unlimited AI Bot calls.

### Export

When the user is done editing, provide:
- **Copy to clipboard** button
- **Download** dropdown: PDF, DOCX, PPTX

---

## Interaction 3 — Article History (Profile/Dashboard)

- Display a list of all articles generated by the authenticated user.
- Each article shows: title (derived from video or generated), date created, word count.
- Clicking an article re-opens the full editor view with the original video source and generated content pre-loaded.
- User can continue editing from where they left off.

---

## Constraints

- The engine component is a single shared component, rendered in both the landing page and the dashboard.
- Unauthenticated users cannot save articles, export, or access the editor.
- Output format options (PDF, DOCX, PPTX) are shown on the landing page but disabled/locked for unauthenticated users.
- AI Bot is not available on the landing page (post-signup only).
- Free user AI Bot call limit resets weekly.
- Do not implement payment processing in this phase — plan selection is UI-only.

## Non-Goals

- No video hosting or transcoding infrastructure — assume video URL provides accessible transcript or audio.
- No social sharing features.
- No team/collaboration features.
- No mobile-native app (responsive web only).
