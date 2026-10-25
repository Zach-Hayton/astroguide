# Contributing to AstroGuide

This repository is the shared development workspace for AstroGuide, an astronomy explorer and observing planner for Five Fish / CSI 3471. All team members are expected to keep work small, reviewable, and well-documented.

## Team workflow

- Keep the default branch clean and releasable.
- Create a branch for every change.
- Prefer small, focused pull requests over large bundled changes.
- Do not merge your own work without a review unless the team explicitly approves an exception.
- Make sure the project still builds and the relevant checks pass before requesting review.

## Branch naming

Use lowercase kebab-case and follow the pattern below.

### Format:

- feature/feature-name
- testing/testing-name

### Rules:

- Use lowercase only.
- Use hyphens between words, not underscores or spaces.
- Keep the name specific and descriptive.
- Avoid vague names like feature/update or fix/stuff.
- If the work relates to a task or issue, name the branch after the issue

## Pull Request rules (PR)

All changes should open a pull request before merging to the default branch.

### Required PR structure

Every PR should include:

- A clear title that summarizes the change.
- A short description of the problem being solved.
- What changed.
- Why the change was needed.
- Testing or validation performed.
- Any follow-up work or known limitations.

### PR expectations

- Keep PRs focused on one job or user-facing change.
- Do not mix unrelated fixes in the same PR.
- Avoid large refactors unless they are necessary and clearly justified.
- Include screenshots or short screen recordings when UI behavior changes.
- If the work depends on environment variables, database setup, or local configuration, document the setup clearly.
- Link related issues, tasks, or discussions when available.

## AI-Use guidelines

### Allowed use

- Starting scaffolding
- Explaining unfamiliar APIs or concepts
- Drafting docs, PR summaries, and tests
- Suggesting debugging ideas or refactors
- Speeding up repetitive tasks

### Do not:

- Bypass code review or merge rules
- Commit or merge changes without human review
- Produce code that the contributor cannot explain or verify
- Do not paste credentials, private data, or sensitive internal info into AI tools
- Do not upload confidential project code or unpublished data to external AI systems without approval


### Required practices

- **Mention AI assistance in the PR when it materially shaped the solution**
- Review and understand all generated code
- Verify the logic against project requirements
- Check repository conventions and style
- Validate build and test behavior
- Remove speculative or low-quality code
- Privacy and data handling

_**Treat AI output as a draft, not truth!!!!**_
