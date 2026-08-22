Configure Claude Code for this repository so it mirrors my existing Codex setup as closely as Claude Code supports.

Work in:
/Users/jk/Documents/engineering/petmosphere

Execute the configuration changes now; do not merely describe them.

Requirements:

1. Do not modify Petmosphere application code. Only modify Claude Code configuration files required for this migration.
2. Inspect the existing Codex configuration, repository AGENTS.md, .agents/skills, installed MCP servers, and any existing Claude configuration.
3. Run the native Codex importer:
   - First preview with `claude import codex --dry-run`.
   - Then perform the import with `claude import codex --yes`.
   - If invoking a nested Claude process is unsupported, reproduce the previewed changes directly using Claude Code’s documented configuration formats.
4. Ensure the repository root has a CLAUDE.md that imports the existing instructions without duplicating them:

   @AGENTS.md

   Preserve an existing CLAUDE.md and add the import only if missing.

5. Make the existing repository skills under `.agents/skills` available to Claude Code. Reuse them rather than copying and maintaining duplicate skill files. If Claude Code does not discover that location natively, create the smallest appropriate `.claude/skills` mapping or symlink, without overwriting existing Claude skills.
6. Import compatible MCP servers using Claude Code’s native MCP configuration. Verify every imported executable or URL exists and is usable. Do not copy authentication tokens, API keys, OAuth credentials, session history, logs, caches, model IDs, or Codex internal state.
7. Do not enable `bypassPermissions` or `--dangerously-skip-permissions`. Preserve my existing Claude permission mode unless a direct, safe Codex equivalent exists.
8. Do not install plugins or dependencies merely because Codex has a similarly named capability. Report Codex-only features that have no direct Claude equivalent.
9. Validate the result using:
   - `claude doctor`
   - Claude MCP status/listing
   - discovery of CLAUDE.md
   - discovery of the repository skills
10. Review the resulting diff and configuration for secrets. Do not commit or push anything.
11. Finish with a concise report containing:

- imported items
- reused/shared items
- skipped incompatible items and why
- validation results
- any OAuth or user-login step I must perform manually

Proceed autonomously. Only stop for approval if authentication, secret entry, destructive replacement, or an external installation is genuinely required.
