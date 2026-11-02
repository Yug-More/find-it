# Mobile dependency audit — 2026-11-02

Commands: `npm audit --json`, `npm audit --omit=dev --json`, `npm ls zod deepmerge --all --json`, and `npm audit fix --dry-run --json`. No force updates or overrides were used.

## Result

The locked mobile graph reports 49 vulnerable package entries: 6 low, 41 moderate, 2 high, and no critical. These are propagated findings from four underlying advisories, not 49 distinct defects. The production-install graph reports 20 entries (1 low, 17 moderate, 2 high); 29 entries are development-only. Seven affected packages are direct dependencies (two production, five development); 42 are transitive.

The two high entries are `zod` and its parent `@expo/cli`. Expo installs CLI/build tooling as production dependencies, so `--omit=dev` still reports it. A production-install classification does not establish that the vulnerable validation code is reachable in the shipped app. No claim of zero runtime risk is made.

## Fix assessment

- `zod` is locked at 3.25.76 under Expo CLI and lint tooling. The advisory requires 4.6.6 or newer. That is a major API change outside the consumers' current range, so a forced override is not appropriate. npm's `fixAvailable: true` is not evidence of an Expo-compatible fix.
- `minimatch` needs 11.0.1 or newer. Existing glob, lint, and test tooling uses older major lines; moving all consumers to 11 would require major dependency changes. Some suggested remediations are old Expo/Jest/ESLint major versions, not safe upgrades.
- `glob` is locked at 13.0.6 in Expo tooling. Its own advisory requires a release newer than 14.0.1; the available 14.0.3 is outside the current major range. Older Jest glob copies also inherit the minimatch finding. A global major override would break the compatibility constraint.
- `deepmerge` is locked at 4.3.1, also the registry's current release. No patched same-major release was available at review time.
- Expo 57.0.31 is the latest SDK 57 release returned by the registry and passes Expo Doctor. The dry-run suggests twelve dev-tool updates (testing-library, eslint-plugin-expo, and TypeScript ESLint internals) but still reports all 49 findings. Those unrelated updates were not applied because they do not remediate the root advisories. Mobile manifests and lockfile stay unchanged.
- Revisit when upstream consumers release compatible fixes. Keep development servers local and do not pass untrusted large collections/globs to build tooling. Preserve Expo's supported React Native versions.

## Underlying advisories

- `deepmerge`: [deepmerge mergeObject() allows prototype poisoning of returned objects](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
- `glob`: [Glob: AbortSignal cancellation bypass allows post-timeout filesystem traversal](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4).
- `minimatch`: [minimatch has potential denial of service via globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249).
- `zod`: [Zod can exhaust memory while validating oversized constrained collections](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).

## Package classification

“Production graph” includes build/test utilities shipped transitively by Expo/React Native. “Development only” means absent from `npm audit --omit=dev`. Severity is npm’s package-level severity, including propagated effects.

### Production graph

- `@expo/cli` — high; transitive.
- `@expo/config` — moderate; transitive.
- `@expo/config-plugins` — moderate; transitive.
- `@expo/fingerprint` — moderate; transitive.
- `@expo/inline-modules` — moderate; transitive.
- `@expo/local-build-cache-provider` — moderate; transitive.
- `@expo/metro-config` — moderate; transitive.
- `@expo/prebuild-config` — moderate; transitive.
- `@jest/transform` — moderate; transitive.
- `@react-native/jest-preset` — moderate; transitive.
- `@react-native/virtualized-lists` — moderate; transitive.
- `babel-jest` — moderate; transitive.
- `babel-plugin-istanbul` — moderate; transitive.
- `deepmerge` — low; transitive.
- `expo` — moderate; direct.
- `glob` — moderate; transitive.
- `minimatch` — moderate; transitive.
- `react-native` — moderate; direct.
- `test-exclude` — moderate; transitive.
- `zod` — high; transitive.

### Development only

- `@eslint-community/eslint-utils` — moderate; transitive.
- `@eslint/config-array` — moderate; transitive.
- `@eslint/eslintrc` — moderate; transitive.
- `@jest/core` — moderate; transitive.
- `@jest/expect` — moderate; transitive.
- `@jest/globals` — moderate; transitive.
- `@jest/reporters` — moderate; transitive.
- `@testing-library/react-native` — low; direct.
- `@typescript-eslint/eslint-plugin` — moderate; transitive.
- `@typescript-eslint/parser` — moderate; transitive.
- `@typescript-eslint/type-utils` — moderate; transitive.
- `@typescript-eslint/typescript-estree` — moderate; transitive.
- `@typescript-eslint/utils` — moderate; transitive.
- `create-jest` — low; transitive.
- `eslint` — moderate; direct.
- `eslint-config-expo` — moderate; direct.
- `eslint-plugin-expo` — moderate; transitive.
- `eslint-plugin-import` — moderate; transitive.
- `eslint-plugin-react` — moderate; transitive.
- `jest` — low; direct.
- `jest-circus` — moderate; transitive.
- `jest-cli` — low; transitive.
- `jest-config` — moderate; transitive.
- `jest-expo` — moderate; direct.
- `jest-resolve-dependencies` — moderate; transitive.
- `jest-runner` — moderate; transitive.
- `jest-runtime` — moderate; transitive.
- `jest-snapshot` — moderate; transitive.
- `jest-watch-typeahead` — low; transitive.

The separate database SQL test package has one dev-only dependency, `@electric-sql/pglite` 0.5.14; its install audit reports zero findings. Backend dependencies were installed as documented but are not covered by this npm assessment.
