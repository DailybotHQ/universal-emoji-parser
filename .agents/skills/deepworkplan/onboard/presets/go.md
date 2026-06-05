# Preset — Go (modules)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- `go.mod` and `go.sum` at the repo root; the first line of `go.mod` is the
  module path, followed by the `go` directive (language version) and `require`
  blocks.
- A `package main` with `func main()` as the binary entry point — frequently
  under `cmd/<binary>/main.go` when there are several binaries.
- Idiomatic layout: `cmd/` (binaries), `internal/` (private packages the module
  alone can import), `pkg/` (exported reusable packages), plus domain packages.
- Multi-module repos carry more than one `go.mod` (e.g. a `go.work` workspace or
  nested modules). **Infer from what's present.**
- Optional: a `Makefile`, a `vendor/` directory (vendored deps), `.golangci.yml`,
  and a `Dockerfile` for containerized builds.

## What to look for in recon

- The **real** test command: `go test ./...` (often with `-race`, `-cover`, or
  `-count=1`). Tests are table-driven `*_test.go` files **beside** the code they
  test; check for `testdata/` fixtures and any `TestMain`.
- The **real** lint/vet gate: `go vet ./...`, `golangci-lint run` (read
  `.golangci.yml` for enabled linters), and a format check (`gofmt -l .` or
  `goimports`). Confirm which one CI enforces.
- The **real** build: `go build ./...`, plus any release wiring (`-ldflags`,
  `CGO_ENABLED`, cross-compilation via `GOOS`/`GOARCH`).
- The module path, exported vs `internal/` boundaries, and where binaries live.

## Stack-specific skills/agents/commands to generate

- Skills: `package-add` (new package + table-driven test), `handler` (HTTP
  handler + test) if it's a service, `cmd-add` (new binary under `cmd/`),
  optionally `interface` (define an interface + mock) and `error-wrap`.
- Agents: baseline roles + an `api-reviewer` / `concurrency-reviewer` persona
  aware of goroutine/channel safety and `context.Context` propagation.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — package boundaries (`cmd`/`internal`/`pkg`), interface
  seams, concurrency model (goroutines/channels/`context`), error-handling
  conventions (wrapping with `%w`).
- `TESTING_GUIDE.md` — table-driven tests, `testdata/` fixtures, subtests
  (`t.Run`), how to scope a single package (`go test ./path/...`).
- `SECURITY.md` — input validation, secrets handling, dependency hygiene
  (`govulncheck`), the sensitive-data boundary.
- Per-module docs: one per significant package or `cmd/` binary.

## Typical validation command (FIND the real one)

Often `gofmt -l . && go vet ./... && golangci-lint run && go test -race ./...`,
with a separate `go build ./...`. **Do not assume** the lint tool or test flags
— read the `Makefile`/`.golangci.yml`/CI and capture the exact command.
