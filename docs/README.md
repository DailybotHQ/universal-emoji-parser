# Documentation Index — Universal Emoji Parser

This directory holds the detailed guides referenced from the root
[`AGENTS.md`](../AGENTS.md). `AGENTS.md` is the entry point and single source of
truth for mandatory rules; the files here go deep on individual topics.

**Universal Emoji Parser** is a TypeScript library that parses emoji unicodes and
shortcodes in text and converts them to Twemoji-backed HTML `<img>` tags, or
between unicode and shortcode forms. It ships dual CommonJS + ESM entry points
and targets Node ≥ 20.19 and bundled browser environments.

## Product

| Guide                              | Purpose                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| [PRODUCT_SPEC.md](PRODUCT_SPEC.md) | The non-technical "why" and "for whom": problem, audience, capabilities, non-goals |

## Core guides

| Guide                                              | Purpose                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | Module layout, data flow, parse pipeline, emoji catalog                        |
| [TECHNOLOGIES.md](TECHNOLOGIES.md)                 | Stack overview with versions and roles                                         |
| [STANDARDS.md](STANDARDS.md)                       | TypeScript / lint / Prettier conventions, naming, exports                      |
| [DEVELOPMENT_COMMANDS.md](DEVELOPMENT_COMMANDS.md) | npm scripts, Mocha runs, Webpack, watch loops                                  |
| [TESTING_GUIDE.md](TESTING_GUIDE.md)               | Mocha + Chai setup, test conventions, regenerating expectations                |
| [RUNTIMES.md](RUNTIMES.md)                         | Node, browsers, ESM vs CommonJS, bundlers consuming the package                |
| [BUILD_DEPLOY.md](BUILD_DEPLOY.md)                 | Webpack production bundle, npm publish, GitHub release pipeline                |
| [API_REFERENCE.md](API_REFERENCE.md)               | Public methods, types, options, return values                                  |
| [PERFORMANCE.md](PERFORMANCE.md)                   | Lookup hot paths, RegExp caches, bundle size, large catalog handling           |
| [SECURITY.md](SECURITY.md)                         | XSS in HTML output, input validation, npm publish security, dependency hygiene |
| [EMOJI_PROVIDERS.md](EMOJI_PROVIDERS.md)           | Twemoji CDN, custom CDNs, shortcode dialects (Slack/GitHub/Discord)            |
| [FORK_CUSTOMIZATION.md](FORK_CUSTOMIZATION.md)     | Step-by-step rebrand of the package into a new product                         |
| [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)   | When and how to update docs                                                    |

## AI agent guides

| Guide                                            | Purpose                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| [AI_AGENT_ONBOARDING.md](AI_AGENT_ONBOARDING.md) | First-session checklist: setup, install, run validation, where things live |
| [AI_AGENT_COLLAB.md](AI_AGENT_COLLAB.md)         | Multi-agent handoff, ownership, and conflict-avoidance rules               |

See also [`.agents/README.md`](../.agents/README.md) for the skills, slash
commands, and subagents available in this repo, and
[`.agents/docs/`](../.agents/docs/) for the machine-friendly catalog.

## Getting started

Short, task-focused walkthroughs in [`getting-started/`](getting-started/):

| Guide                                                        | Purpose                                    |
| ------------------------------------------------------------ | ------------------------------------------ |
| [ENVIRONMENT_SETUP.md](getting-started/ENVIRONMENT_SETUP.md) | Set up the local/dev-container environment |
| [USING_THE_LIBRARY.md](getting-started/USING_THE_LIBRARY.md) | Consume the package from CommonJS / ESM    |
| [RUNNING_TESTS.md](getting-started/RUNNING_TESTS.md)         | Run and scope the Mocha test suite         |
| [TROUBLESHOOTING.md](getting-started/TROUBLESHOOTING.md)     | Common build/test/parse problems and fixes |
