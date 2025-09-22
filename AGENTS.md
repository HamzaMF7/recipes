# Repository Guidelines

## Project Structure & Module Organization
This Next.js Pages Router app keeps screens in `src/pages`, with shared UI in `src/components` and composable hooks in `src/hooks`. Feature state lives under `src/contexts`, while cross-cutting helpers stay in `src/utils` and `src/lib` (e.g., API clients, Tailwind helpers). Static assets live in `public/`. Keep GraphQL operations in `src/graphql` and import them via the `@/` alias defined in `tsconfig.json`. Organize new modules alongside the feature they support and avoid deep nesting past three levels.

## Build, Test, and Development Commands
Run `npm install` once per clone. `npm run dev` starts the Turbopack-powered dev server on `localhost:3000`. Use `npm run build` to compile a production bundle and `npm run start` to serve it locally. `npm run lint` runs Next.js + ESLint checks; pair it with `npx prettier --write src` before committing when you touch formatting-heavy files.

## Coding Style & Naming Conventions
We write TypeScript with `strict` mode enabled. Prefer functional components, PascalCase file names for components (`RecipeCard.tsx`), camelCase for utilities, and `useSomething` for hooks. Stick to Tailwind classes for styling; global overrides belong in `src/styles`. Prettier 3 defaults (2-space indent, double quotes, trailing commas) keep formatting consistent—do not hand-edit around them. Keep component folders small: co-locate a component, its CSS module (if any), and test stubs.

## Testing Guidelines
Automated tests are not yet wired up; until Jest/RTL is added, include manual verification steps in your PR description (routes exercised, browsers checked). When adding tests, co-locate them next to the feature (`RecipeCard.test.tsx`) and stub network calls against the Apollo client. Aim for at least smoke coverage on new pages before merging.

## Commit & Pull Request Guidelines
Recent commits are short, lower-case imperatives (`add footer`, `implement filters`). Follow that style, keep subjects ≤72 characters, and push larger narratives into the body if needed. PRs should link related issues, describe functional impact, list manual test notes, and include UI screenshots or GIFs for visible changes. Request review once `npm run lint` passes locally.

## Security & Configuration Tips
Environment secrets (API URLs, tokens) belong in `.env.local`; never commit them. Update related docs whenever a config flag or GraphQL endpoint changes, and regenerate any schema artifacts before merging.
