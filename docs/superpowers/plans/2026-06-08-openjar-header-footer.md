# OpenJar Header Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky OpenJar-branded header and footer links to the BOM comparison app.

**Architecture:** Keep the existing wizard header and flow intact inside a new page layout. Add a compact sticky brand header above the app content and a footer after the workflow, using the existing static logo asset and standard React markup.

**Tech Stack:** React 19, Vite static asset imports, Testing Library, Vitest, CSS.

---

### Task 1: App Shell Tests

**Files:**
- Modify: `src/App.test.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("shows a sticky OpenJar logo link and footer resources", () => {
  render(<App />);

  const logoLink = screen.getByRole("link", { name: /openjar home/i });
  expect(logoLink).toHaveAttribute("href", "https://openjartech.com/");
  expect(screen.getByAltText("OpenJar")).toBeInTheDocument();
  expect(screen.getByRole("banner")).toHaveClass("brand-header");

  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /github repository/i })).toHaveAttribute(
    "href",
    "https://github.com/csutaria-OpenJar/oss-bom-comparison",
  );
  expect(screen.getByRole("link", { name: /openjar linkedin/i })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/company/openjartech/",
  );
  expect(screen.getByRole("link", { name: /talk to me/i })).toHaveAttribute(
    "href",
    "https://openjartech.com/meetings/csutaria",
  );
  expect(screen.getByRole("link", { name: /license terms/i })).toHaveAttribute(
    "href",
    "https://github.com/csutaria-OpenJar/oss-bom-comparison/blob/main/LICENSE",
  );
  expect(screen.getByRole("link", { name: /openjar website/i })).toHaveAttribute(
    "href",
    "https://openjartech.com/",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because the OpenJar header and footer links do not exist yet.

### Task 2: Header And Footer Markup

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write minimal implementation**

Import `../assets/Horizontal Logos/1.png`, wrap the app in `.page-shell`, add a sticky `.brand-header` with a linked logo, move the existing content into `<main className="app-shell">`, and add a `<footer className="app-footer">` with the requested links and an inline LinkedIn icon.

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`
Expected: PASS.

### Task 3: Responsive Styling

**Files:**
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Add CSS**

Style `.brand-header` as `position: sticky; top: 0; z-index: 10`, size `.brand-logo`, layout `.app-footer`, and make footer links wrap cleanly on small screens.

- [ ] **Step 2: Run full verification**

Run: `npm test`
Expected: all tests PASS.

Run: `npm run build`
Expected: TypeScript and Vite production build PASS.
