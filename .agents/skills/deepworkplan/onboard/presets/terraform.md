# Preset — Terraform / IaC (Terraform / OpenTofu)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- `*.tf` files (HCL) — conventionally split into `main.tf`, `variables.tf`,
  `outputs.tf`, and `providers.tf`/`versions.tf` — plus a committed
  `.terraform.lock.hcl` (provider lock).
- Reusable code under `modules/`, each module exposing `variables.tf` and
  `outputs.tf`; root configs that call modules with `module "x" { source = ... }`.
- A `terraform { backend "..." }` block declaring **remote state** (S3 +
  DynamoDB lock, GCS, azurerm, Terraform Cloud / HCP, or a Tofu equivalent), and
  one or more `provider` blocks with version constraints.
- Variable inputs via `*.tfvars` / `*.auto.tfvars`; the `.terraform/` directory
  is local cache and is git-ignored. **Infer the real backend from the code.**
- **OpenTofu** variant: the same `.tf`/HCL files but driven by the `tofu` CLI
  (often a `.terraform-version`/`.tool-versions` or CI hints at which binary).

## What to look for in recon

- The **real** validation gate: `terraform fmt -check -recursive`,
  `terraform validate`, `tflint` (read `.tflint.hcl`), and `terraform plan`
  (read-only). Security/policy scanners may be present: `tfsec`, `checkov`,
  `terraform-compliance`. Substitute `tofu` for `terraform` if OpenTofu is used.
- **Never** treat `terraform apply` as a validation gate — it mutates real
  infrastructure. `plan` is the safe, read-only check.
- How **environments** are separated: workspaces (`terraform workspace`), or
  per-environment directories (`envs/dev`, `envs/staging`, `envs/prod`), or
  layered `*.tfvars`. Identify which pattern this repo uses.
- Backend/state location and locking, provider/version pinning, and where
  **secrets** live (never in state-readable plaintext — vars, a secrets manager,
  Vault, env). `terraform init` is required before validate/plan.

## Stack-specific skills/agents/commands to generate

- Skills: `module-add` (new reusable module with `variables.tf`/`outputs.tf`),
  `resource-add` (resource + variables + outputs wired in), `env-add` (new
  environment dir/workspace + tfvars), optionally `provider-pin` and a
  `plan-review` helper that summarizes a `plan` diff.
- Agents: baseline roles + a `iac-reviewer` / `state-safety` persona aware of
  state mutation, drift, blast radius, and least-privilege provider creds.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — module composition, root configs vs modules, the
  provider/backend topology, environment separation strategy.
- `SECURITY.md` — state secrecy (remote state can contain secrets), least-
  privilege provider credentials, secrets handling, policy scanning
  (`tfsec`/`checkov`), and who can `apply`.
- `OPERATIONS.md`/runbook — the init → fmt → validate → plan → (gated) apply
  flow, state locking, and rollback/import procedures.
- Per-module docs: one per reusable module (its inputs, outputs, side effects).

## Typical validation command (FIND the real one)

Often `terraform init -backend=false && terraform fmt -check -recursive &&
terraform validate && tflint`, with `terraform plan` as the change preview
(substitute `tofu` for OpenTofu). **Do not assume** the backend, environment
layout, or scanner set — read the `Makefile`/`.tflint.hcl`/CI and capture the
exact command.
