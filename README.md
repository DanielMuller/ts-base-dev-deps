# @danielmuller/ts-base-dev-deps

This package provides a shared base for TypeScript projects. It ships common devDependencies and seeds a starter set of config files into consuming repositories during install.

## What gets installed

When a consumer installs this package, `scripts/postinstall.mjs` copies main entry files once and refreshes shared config files on every install:

- `eslint.config.mjs` is copied only once and is where consumer-specific rules belong.
- `eslint.shared.mjs` is refreshed on every install so common rules can evolve over time.
- `prettier.config.mjs` is copied only once and is where consumer-specific overrides belong.
- `prettier.shared.mjs` is refreshed on every install so shared formatting rules can evolve over time.
- `.prettierignore`
- `.gitignore`
- `.husky/pre-commit`
- `.vscode/settings.json`
- `.vscode/extensions.json`

Existing local edits are preserved for the main file, while shared support files are refreshed from the package.

## Usage

1. Add the package to your project as a dev dependency:

```bash
npm install --save-dev @danielmuller/ts-base-dev-deps
```

2. Let the install hook copy the default ESLint and Prettier starter files, add the Husky pre-commit hook, update `lint-staged` in `package.json`, and refresh the shared config files in the repository.

3. Add your project-specific ESLint rules in `eslint.config.mjs` and your project-specific Prettier overrides in `prettier.config.mjs`. Each file imports its shared companion, so local changes extend the shared defaults rather than replacing them.

4. Extend or override any copied support file in your project as needed.

The installer also configures `core.hooksPath` to `.husky` when the consumer project is inside a git work tree, and merges required `lint-staged` commands into `package.json` so the pre-commit hook runs `prettier --write` and `eslint --fix --config eslint.config.mjs`.

## Included dependencies

- eslint
- prettier
- typescript
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- eslint-config-prettier
- @eslint/js
- globals

## Publishing

On every commit/merge to `main`, GitHub Actions runs `.github/workflows/publish-github-packages.yml` and can publish to both GitHub Packages and npmjs when conditions are met.

- `package.json` changed in that push.
- The `version` value changed.
- The new version is greater than the previous git version.
- The new version is greater than the currently published version in each target registry.

The workflow uses:

- `GITHUB_TOKEN` (`packages: write`) for GitHub Packages publishing.
- `NPM_TOKEN` for npmjs publishing.

For npmjs, the workflow publishes using the `@danielmullerch` scope (`@danielmullerch/ts-base-dev-deps`) while keeping GitHub Packages under the GitHub scope.

Consumers should configure scope registry in `.npmrc` to install from GitHub Packages:

```bash
@danielmuller:registry=https://npm.pkg.github.com
```
