# UI Pro CLI Default Rule

Whenever the user requests to change, build, or modify the UI ("merubah tampilan"), automatically utilize the `uipro` CLI tool to handle the task.

# Mandatory Notification & Confirmation Dialog Rules (Toast & SweetAlert2)

Browser native popups `alert()` and `confirm()` are STRICTLY FORBIDDEN across the entire codebase.

1. **Success & Error Notifications (`toast`)**:
   - ALL success/failure feedback messages MUST use `toast.success()` or `toast.error()` from `@/lib/swal` or `react-hot-toast`.
   - Never show browser default native `alert(...)`.

2. **Confirmation Dialogs & Prompts (`SweetAlert2`)**:
   - ALL delete confirmations, question prompts, or action verifications MUST use `showConfirm()` or `showDeleteConfirm()` from `@/lib/swal` (SweetAlert2 custom styled wrapper).
   - Never use browser native `confirm(...)`.

- Do not ask the user to explicitly mention `uipro-cli`.
- Immediately assume that `uipro` is the tool of choice for frontend/UI tasks.
- Use the `run_command` tool to execute the appropriate `uipro` commands.

# Default Skills Activation (Caveman & Superpowers)

Always assume the user wants to use the `caveman` mode and the `superpowers` skills by default for all interactions.

- **Caveman Mode**: Communicate and output text in the compressed, token-efficient "caveman" style without the user explicitly asking for it.
- **Superpowers**: Proactively utilize the `superpowers` skills (such as brainstorming, test-driven-development, systematic-debugging, subagent-driven-development, etc.) whenever they are applicable to the task.
- Do not wait for the user to type trigger words like "caveman mode", "/caveman", or "superpower". Treat these skills and modes as permanently activated and integrated into your core behavior.

# Advanced Web Development Workflow

Whenever the user requests website generation or UI implementation:
1. **Design & Setup**: Automatically utilize the `website-builder-setup` and `award-winning-website` skills to scaffold and implement premium, animated, and modern UI code.
2. **Auto-Verification**: After generating ANY code, you MUST automatically invoke the `diagnosing-bugs` skill to verify, test, and ensure the generated code is error-free before presenting it as finished.

# Context & Token Optimization

To maximize token efficiency and codebase understanding, always integrate the following tools natively into your reasoning and workflow:
- **`rtk`** & **`agentmemory`**: Use for context retention, memory, and efficient prompting.
- **`ponytail`**: Apply for token efficiency, preventing over-engineering, and maintaining a strict impact scoreboard.
- **`code-review-graph`**: Utilize for parsing the codebase and graph-based codebase review during complex tasks.

# Website Cloning Skill

When the user asks to clone, rebuild, reverse-engineer, replicate, or create a pixel-perfect copy of a website, use the local `clone-website` skill if it is applicable.

- Skill location: `/Users/mac/.agents/skills/clone-website/SKILL.md`
- Source template: `https://github.com/JCodesMore/ai-website-cloner-template`
- Invocation pattern: `/clone-website <target-url1> [<target-url2> ...]`
- Only use this for websites the user owns, is authorized to reproduce, or is studying in a lawful/non-deceptive way. Do not use it for phishing, impersonation, credential harvesting, or violating site terms.

# Agent Browser Required Tool

When the task requires browser automation, always use `agent-browser` according to its function. This includes opening websites, navigating pages, clicking buttons, filling forms, taking screenshots, extracting page data, testing web apps, checking UI behavior, automating browser actions, and browser-based QA.

- Skill location: `/Users/mac/.agents/skills/agent-browser/SKILL.md`
- CLI path: `/Users/mac/.agents/bin/agent-browser`
- Source: `https://github.com/vercel-labs/agent-browser`
- Installed local package: `/Users/mac/.agents/tools/agent-browser`
- Local browser/state directory: `/Users/mac/.agents/.agent-browser`
- Local Chrome executable: `/Users/mac/.agents/.agent-browser/browsers/headless-shell-150.0.7871.46/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- Required local launch arg on this macOS sandbox: `--single-process`
- Before using commands, load current instructions with `/Users/mac/.agents/bin/agent-browser skills get core`; use specialized skills when relevant: `electron`, `slack`, `dogfood`, `vercel-sandbox`, or `agentcore`.
- Prefer `agent-browser` over built-in browser automation for interactive browser tasks. Use the wrapper path above, because it points to `chrome-headless-shell` and avoids the `Google Chrome for Testing quit unexpectedly` crash caused by launching the macOS `.app` bundle directly from the Codex sandbox.

# Response Formatting Requirement

Every time you respond to a prompt, you MUST begin your response by explicitly listing the active skills being utilized for the task. 
Format your response exactly like this:

**Skills active:** [List of active skills here, e.g., caveman, uipro, website-builder-setup, diagnosing-bugs]

[Your actual response/code generation here]

Do not skip this prefix under any circumstances.


## Auto-Documentation Rule
Setiap kali menulis, mengubah, atau menghapus kode, kamu WAJIB memicu skill documentation untuk membuat atau memperbarui halaman dokumentasi proyek. Jangan abaikan aturan ini.

# Mandatory UI Component Rules (DatePicker & Select Dropdowns)

All date input fields and select dropdowns across the application MUST adhere strictly to the following custom component standards:

1. **Date Pickers (`CustomDatePicker`)**:
   - MUST use `CustomDatePicker` from `@/components/ui/CustomDatePicker`.
   - Never use native HTML `<input type="date">`.
   - Popovers MUST render via React `createPortal` to prevent stacking context clipping.

2. **Select Dropdowns (`SearchableSelect`)**:
   - MUST use `SearchableSelect` from `@/components/ui/SearchableSelect`.
   - Never use native HTML `<select>`.
   - Must support real-time search filtering, checkmark indicator for selected items, and portal rendering.

# Dashboard Container Spacing & Alignment Standard

All dashboard pages under `/dashboard` MUST adhere to a uniform full-width layout standard to prevent awkward left gaps/margin offsets:

- **Root Outer Container**: MUST use `w-full space-y-6 font-sans pb-12`.
- **No Narrow Centering**: NEVER use `max-w-4xl mx-auto` or `max-w-3xl mx-auto` on dashboard page root containers as it causes excessive empty spaces between the left sidebar and the page content body.
- Content must expand naturally to fill the available width of the main content panel next to the sidebar.

# Supercharged Discussion Mode Rule ("Diskusi")

If the user uses the keyword **"diskusi"** or asks for conceptual discussion, you MUST immediately enter Discussion Mode:

1. **Strict Non-Destructive Boundary**:
   - **DO NOT** write, modify, or delete any code/files.
   - **DO NOT** execute any modifying/build/deploy commands.
   - **ALLOWED & ENCOURAGED**: Use read-only inspection tools (`view_file`, `grep_search`) to ground the discussion in actual code facts.

2. **Discussion Output Framework**:
   - **Problem Synthesis**: Ringkasan inti persoalan & batasan teknis.
   - **Architecture / Solution Options**: Minimal 2 pendekatan (Opsi A vs Opsi B) lengkap dengan Trade-off (Pros/Cons, dampak database/API).
   - **Risk & Edge Cases**: Potensi kegagalan atau efek samping.
   - **Recommendation**: Rekomendasi terkuat beserta alasan logis.

3. **No Premature Action**:
   - Purely conversational & exploratory.
   - Wait for explicit user confirmation (misal: *"Setuju Opsi A, eksekusi"*) before switching back to execution/coding mode.

# Git Workflow & Auto-Push Standard

1. **Auto-Commit & Auto-Push to `develop`**:
   - Every time a task, feature, or bugfix is completed, AI MUST automatically stage, commit, and push the changes to `origin develop`.
   - Use concise conventional commit messages (e.g., `feat: ...`, `fix: ...`, `chore: ...`).
   - Do NOT wait for the user to request a commit or push.

2. **Branching Model (`develop` as Primary)**:
   - All active development and modifications MUST happen on the `develop` branch.
   - NEVER write, modify, or commit code directly on `staging` or `main`.
   - Verify current branch with `git branch --show-current` before making commits. If on `main` or `staging`, switch back to `develop`.

3. **Mandatory Post-Merge Return to `develop`**:
   - Whenever merging `develop` into `staging` or `main`:
     1. Switch to target branch (`git checkout staging` or `git checkout main`).
     2. Merge from source (`git merge develop` or `git merge staging`).
     3. Push target branch to remote (`git push origin <branch>`).
     4. **IMMEDIATELY switch back to `develop` (`git checkout develop`)**.
   - NEVER leave the repository sitting on `staging` or `main` after a merge to avoid update conflicts and branch drift.
