---
name: local-install
description: Install or upgrade the local toolchain finance-manager needs - Java (JDK), Node.js/npm, the Ionic CLI, and Docker - on macOS (via Homebrew) or Debian/Ubuntu Linux (via apt), defaulting to the version this project actually requires but accepting an explicit --version override. Refuses to run on Windows. Interactive: maintains a checklist and, per tool, installs then verifies the tool actually works (not just that the install command exited 0) before ticking it off - if a manual step remains (opening Docker Desktop, a new shell for PATH), it explains what's needed and re-verifies rather than assuming success. Use when local-setup reports a tool is missing, or whenever the user asks to install/upgrade Java, Node, Ionic, or Docker for this project. Actually installs system software (unlike local-setup, which only checks) - a bigger, more invasive action, so run it deliberately rather than as a silent side effect of local-setup/local-run.
---

# local-install

Installs or upgrades finance-manager's local toolchain. This is a heavier action than `local-setup` (which only checks and creates project-local state like a venv or a container) - it installs real system software via Homebrew/apt, so it should be run because the user asked for it (directly, or because `local-setup` pointed here), never silently as part of `local-run`.

## Platform support

- **macOS**: via Homebrew. Fails clearly if Homebrew itself isn't installed (installing Homebrew is out of scope - point the user to https://brew.sh).
- **Debian/Ubuntu Linux**: via `apt-get`. Fails clearly on any other package manager.
- **Windows**: refused outright, for every tool, before attempting anything - suggest WSL2 if the user needs this on a Windows machine.

## Procedure: install -> verify -> checklist, per tool

This skill does not just run an install command and declare victory - a `brew install`/`apt-get install` exiting 0 doesn't always mean the tool actually works yet (Docker's daemon still needs to be started; a freshly-linked Homebrew binary sometimes needs a new shell to appear on `PATH`). So for each tool being installed (the ones requested, or all four for `all`), Claude should:

1. **Print a checklist** up front, one line per tool being worked on, e.g.:
   ```
   - [ ] java
   - [ ] node
   - [ ] ionic
   - [ ] docker
   ```
2. For each tool, in order (`java` -> `node` -> `ionic` -> `docker` - `ionic` needs `node`'s `npm` first):
   a. Run the install command: `bash .claude/skills/local-install/install.sh <tool> [--version <v>] [--mode <m>]`.
   b. Immediately verify it: `bash .claude/skills/local-install/install.sh verify <tool>`.
   c. **If verify passes**: tick that tool's checklist box, reprint the checklist, move to the next tool.
   d. **If verify fails**: verify's `[FAIL]` message says exactly what's needed (e.g. "open Docker Desktop and wait for it to finish starting", "open a new shell so PATH picks up node@20"). Relay that to the user, ask them to do it, then re-run `install.sh verify <tool>` - repeat this wait-and-recheck loop until it passes (or the user says to skip/stop for that tool, in which case leave its checklist box unticked and say so explicitly rather than silently marking it done).
3. After the last tool, reprint the final checklist state and, if everything's ticked, say it's safe to proceed to `local-setup`/`local-run`.

**Never tick a checklist item based on the install command's exit code alone** - only `verify`'s result ticks a box. This is what makes the skill interactive rather than fire-and-forget: a step that needs the user to do something (open an app, start a new shell) genuinely pauses here for them, instead of the skill assuming success and moving on.

## Running it

```bash
bash .claude/skills/local-install/install.sh <java|node|ionic|docker|all> [--version <v>] [--mode desktop|engine]
bash .claude/skills/local-install/install.sh verify <java|node|ionic|docker|all>
```

| Tool | Default | Where the default comes from |
|---|---|---|
| `java` | JDK **21** | `account-service`/`api-gateway`/`transaction-service`'s `build.gradle` `java.toolchain.languageVersion` |
| `node` | Node **20** (LTS) | `finance-manager-ui/.nvmrc` / `package.json` `engines.node` - satisfies Angular 19's peer requirement (`^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0`) |
| `ionic` | `latest` | no version pinned anywhere in the repo - the CLI negotiates compatibility with the installed Angular/Ionic versions itself |
| `docker` | mode `desktop` on macOS, mode `engine` on Linux | see below |

- `--version <v>` installs/upgrades that tool to `<v>` instead of the default (e.g. `install.sh java --version 17`, `install.sh node --version 22`). Not supported for `docker` (see below) or with `all` (run tools individually if you need a non-default version for just one).
- **Already-installed tools are left alone** if no `--version` is given - `local-install` only touches a tool that's missing, or one you've explicitly asked to change the version of (via the relevant package manager's own upgrade/reinstall).
- `all` runs java -> node -> ionic -> docker in that order (ionic needs npm from the node step first).

### Docker's `--mode`

Docker doesn't take `--version` - instead it takes `--mode desktop|engine`:
- `desktop` (default on macOS): installs Docker Desktop via `brew install --cask docker`. First run still needs you to open `/Applications/Docker.app` once yourself (privileged-helper prompt) - that part can't be scripted.
- `engine` (default on Linux): installs Docker Engine via `apt-get install docker.io`, enables the systemd service, and adds your user to the `docker` group (needs a re-login to take effect).
- Forcing `--mode desktop` on Linux doesn't install anything - Docker Desktop for Linux isn't a reliable one-liner across distros, so it prints manual-download guidance instead.
- Forcing `--mode engine` on macOS is refused - there's no first-class Homebrew-only Docker Engine path on macOS without a separate VM backend (colima/lima), which is out of scope here.

## Interpreting output

`[OK]` = done/verified, `[FAIL]` = needs attention - printed to stderr and reflected in the exit code. During install, `[FAIL]` usually means a package-manager problem (missing Homebrew, unsupported distro, the install command itself failed). During `verify`, `[FAIL]` usually means the tool needs one more manual step from the user before it's actually usable - the message says which; that's the signal to relay it, wait, and re-verify rather than moving on. Plain indented lines are non-fatal follow-up notes.

## Relationship to `local-setup`

`local-setup` (`.claude/skills/local-setup/SKILL.md`) only *checks* for these four tools and, on a `[FAIL]`, now points here (`bash .claude/skills/local-install/install.sh ...`) instead of just saying "install it yourself." Re-run `local-setup` afterward to confirm the check passes.

## Keeping this doc updated

Keep this file and `install.sh` in sync - especially the default versions table, which should track `build.gradle`'s toolchain and `finance-manager-ui/.nvmrc`/`engines.node` if either changes. See `docs/SKILLS.md` for the full skill catalog, and the "Skills" section of root `CLAUDE.md` for the rule that keeps that catalog current.
