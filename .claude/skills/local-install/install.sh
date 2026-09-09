#!/usr/bin/env bash
# Backing script for the `local-install` skill (.claude/skills/local-install/SKILL.md).
# Installs/upgrades finance-manager's local toolchain: java, node, ionic, docker.
# macOS (Homebrew) and Debian/Ubuntu Linux (apt) only - refuses to run on Windows.
#
# Usage:
#   install.sh <java|node|ionic|docker|all> [--version <v>] [--mode desktop|engine]
#   install.sh verify <java|node|ionic|docker|all>
#
# Defaults: java=21, node=20, ionic=latest. docker mode defaults to 'desktop' on
# macOS and 'engine' on Linux. An already-installed tool is left alone unless
# --version is given, in which case it's installed/upgraded to that version.
#
# `verify` checks a tool actually WORKS (not just that install exited 0) - e.g.
# docker's verify checks the daemon is reachable, not just that the CLI exists.
# The local-install skill runs install then verify per tool, in a loop with the
# user if verify fails because a manual step remains (Docker Desktop needs to
# be opened, a new shell is needed to pick up a PATH change, etc).
set -uo pipefail

JAVA_DEFAULT_VERSION=21
NODE_DEFAULT_VERSION=20
IONIC_DEFAULT_VERSION=latest

VERIFY_MODE=0
CMD="${1:-}"
shift || true
if [ "$CMD" = "verify" ]; then
  VERIFY_MODE=1
  TOOL="${1:-}"
  shift || true
else
  TOOL="$CMD"
fi

VERSION=""
MODE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$TOOL" ]; then
  echo "Usage: install.sh <java|node|ionic|docker|all> [--version <v>] [--mode desktop|engine]" >&2
  echo "       install.sh verify <java|node|ionic|docker|all>" >&2
  exit 2
fi

detect_os() {
  case "$(uname -s 2>/dev/null)" in
    Darwin) echo "macos" ;;
    Linux) echo "linux" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}
OS="$(detect_os)"

if [ "$OS" = "windows" ]; then
  echo "[FAIL] local dev on Windows is not supported by this repo's local-run/local-setup/local-install skills (Mac/Linux only). Use WSL2 with a Linux shell if you need to run this on a Windows machine." >&2
  exit 1
fi
if [ "$OS" = "unknown" ]; then
  echo "[FAIL] could not detect a supported OS (expected Darwin or Linux)." >&2
  exit 1
fi

ok()   { echo "[OK]   $*"; }
note() { echo "       $*"; }
fail() { echo "[FAIL] $*" >&2; }

require_brew() {
  if ! command -v brew >/dev/null 2>&1; then
    fail "Homebrew not found. Install it yourself first (https://brew.sh), then re-run this skill - installing Homebrew itself is out of scope for local-install."
    return 1
  fi
  return 0
}

require_apt() {
  if ! command -v apt-get >/dev/null 2>&1; then
    fail "apt-get not found. This skill only supports Debian/Ubuntu-based Linux for automated installs - install $1 manually on this distro."
    return 1
  fi
  return 0
}

install_java() {
  local version="${VERSION:-$JAVA_DEFAULT_VERSION}"
  echo "== Java (target: JDK $version) =="
  local already_working=0
  command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1 && already_working=1

  if [ -z "$VERSION" ] && [ "$already_working" -eq 1 ]; then
    ok "java already present, no --version requested - leaving as-is"
    return 0
  fi

  if [ "$OS" = "macos" ]; then
    require_brew || return 1
    if brew list --versions "openjdk@${version}" >/dev/null 2>&1; then
      note "openjdk@${version} already installed via brew - reinstalling to make sure it's current"
      brew reinstall "openjdk@${version}" || { fail "brew reinstall openjdk@${version} failed"; return 1; }
    else
      brew install "openjdk@${version}" || { fail "brew install openjdk@${version} failed"; return 1; }
    fi
    ok "openjdk@${version} installed via Homebrew"
    note "Gradle's own toolchain support can auto-download a JDK too, but if you want THIS one on PATH, follow brew's own 'For the system Java wrapper to find this JDK' caveat printed above (symlinks it under /Library/Java/JavaVirtualMachines), or: export JAVA_HOME=\"\$(/usr/libexec/java_home -v ${version})\""
  else
    require_apt "openjdk-${version}-jdk" || return 1
    sudo apt-get update && sudo apt-get install -y "openjdk-${version}-jdk" || { fail "apt-get install openjdk-${version}-jdk failed"; return 1; }
    ok "openjdk-${version}-jdk installed via apt"
  fi
}

install_node() {
  local version="${VERSION:-$NODE_DEFAULT_VERSION}"
  echo "== Node.js/npm (target: Node ${version}.x) =="
  local already_present=0
  command -v node >/dev/null 2>&1 && already_present=1

  if [ -z "$VERSION" ] && [ "$already_present" -eq 1 ]; then
    ok "node already present ($(node --version)), no --version requested - leaving as-is"
    return 0
  fi

  if [ "$OS" = "macos" ]; then
    require_brew || return 1
    if brew list --versions "node@${version}" >/dev/null 2>&1; then
      brew upgrade "node@${version}" 2>/dev/null || true
    else
      brew install "node@${version}" || { fail "brew install node@${version} failed (versioned Node formulas only exist for some majors - try an LTS like 18/20/22)"; return 1; }
    fi
    brew link --overwrite --force "node@${version}" || { fail "brew link node@${version} failed"; return 1; }
    ok "node@${version} installed and linked via Homebrew"
  else
    require_apt "nodejs" || return 1
    curl -fsSL "https://deb.nodesource.com/setup_${version}.x" | sudo -E bash - || { fail "NodeSource setup script for Node ${version}.x failed"; return 1; }
    sudo apt-get install -y nodejs || { fail "apt-get install nodejs failed"; return 1; }
    ok "Node ${version}.x installed via NodeSource + apt"
  fi
}

install_ionic() {
  local version="${VERSION:-$IONIC_DEFAULT_VERSION}"
  echo "== Ionic CLI (target: ${version}) =="
  if ! command -v npm >/dev/null 2>&1; then
    fail "no 'npm' on PATH - run 'install.sh node' first."
    return 1
  fi
  if [ -z "$VERSION" ] && command -v ionic >/dev/null 2>&1; then
    ok "ionic CLI already present ($(ionic --version 2>/dev/null)), no --version requested - leaving as-is"
    return 0
  fi
  npm install -g "@ionic/cli@${version}" || { fail "npm install -g @ionic/cli@${version} failed"; return 1; }
  ok "@ionic/cli@${version} installed globally via npm"
}

ensure_docker_cli_symlink() {
  # Docker Desktop's own CLI-tools symlink step (its "Installing CLI tools"
  # first-run prompt) sometimes doesn't run or gets skipped, leaving the real
  # binaries in place but nothing on PATH. Fix it ourselves via a writable,
  # already-on-PATH Homebrew bin dir - no sudo needed on a standard Homebrew install.
  # Not just `docker` itself: `docker pull`/`docker run` shell out to a
  # docker-credential-* helper for the configured credential store (default on
  # macOS is "desktop"), so without docker-credential-desktop on PATH too,
  # `docker` runs but every command that touches a registry fails.
  local desktop_bin="/Applications/Docker.app/Contents/Resources/bin"
  [ -d "$desktop_bin" ] || return 0
  local brew_bin=""
  if command -v brew >/dev/null 2>&1; then
    brew_bin="$(brew --prefix)/bin"
  fi
  [ -n "$brew_bin" ] && [ -w "$brew_bin" ] || return 0
  local linked=0
  for tool in docker docker-credential-desktop docker-credential-osxkeychain docker-credential-ecr-login; do
    if [ -x "$desktop_bin/$tool" ] && [ ! -e "$brew_bin/$tool" ]; then
      ln -sf "$desktop_bin/$tool" "$brew_bin/$tool" && linked=1
    fi
  done
  [ "$linked" -eq 1 ] && note "symlinked Docker Desktop's CLI + credential-helper binaries into $brew_bin (it hadn't put them on PATH itself)"
}

install_docker() {
  local mode="${MODE:-}"
  if [ -z "$mode" ]; then
    [ "$OS" = "macos" ] && mode="desktop" || mode="engine"
  fi
  echo "== Docker (mode: ${mode}) =="
  if [ -n "$VERSION" ]; then
    note "--version is not supported for docker in this skill (Desktop doesn't take one here, and apt's docker.io doesn't support clean version pins) - ignoring."
  fi

  if [ "$mode" = "desktop" ]; then
    if [ "$OS" = "macos" ]; then
      if [ -d "/Applications/Docker.app" ]; then
        ok "Docker Desktop already installed (/Applications/Docker.app present)"
        ensure_docker_cli_symlink
        note "if 'docker ps' isn't responding, open Docker Desktop manually to finish first-run setup"
        return 0
      fi
      require_brew || return 1
      brew install --cask docker || { fail "brew install --cask docker failed"; return 1; }
      ok "Docker Desktop installed via Homebrew cask"
      ensure_docker_cli_symlink
      note "open /Applications/Docker.app once to finish setup (accept the privileged-helper prompt) before running local-setup/local-run"
    else
      fail "Docker Desktop for Linux isn't a reliable one-line install across distros - this skill won't script it."
      note "Download it manually from Docker's official site (search 'Docker Desktop for Linux install'), or re-run with --mode engine for an apt-based Docker Engine install instead."
      return 1
    fi
  elif [ "$mode" = "engine" ]; then
    if [ "$OS" = "macos" ]; then
      fail "Docker Engine without Desktop isn't supported by this skill on macOS (no first-class Homebrew-only path without a VM backend like colima/lima, which is out of scope)."
      note "Use --mode desktop (the default on macOS) instead."
      return 1
    else
      require_apt "docker.io" || return 1
      if command -v docker >/dev/null 2>&1; then
        ok "docker already present ($(docker --version 2>/dev/null)) - leaving as-is"
        return 0
      fi
      sudo apt-get update && sudo apt-get install -y docker.io || { fail "apt-get install docker.io failed"; return 1; }
      sudo systemctl enable --now docker || note "could not enable/start the docker service automatically - start it manually (systemctl start docker)"
      sudo usermod -aG docker "$USER" 2>/dev/null || true
      ok "Docker Engine (docker.io) installed via apt"
      note "log out and back in for the 'docker' group membership change to take effect (or use 'sudo docker' until then)"
    fi
  else
    fail "unknown --mode '$mode' (expected 'desktop' or 'engine')"
    return 1
  fi
}

verify_java() {
  if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
    ok "java: $(java -version 2>&1 | head -1)"
    return 0
  fi
  fail "java: not working. If you just installed a JDK via Homebrew, either follow its 'symlink it with' caveat, or open a new shell and set: export JAVA_HOME=\"\$(/usr/libexec/java_home -v ${VERSION:-$JAVA_DEFAULT_VERSION})\" (macOS), or check 'apt list --installed | grep openjdk' (Linux)."
  return 1
}

verify_node() {
  if command -v node >/dev/null 2>&1 && node --version >/dev/null 2>&1; then
    ok "node: $(node --version)"
    return 0
  fi
  fail "node: not on PATH. If you just installed it via Homebrew, open a new shell (or run 'brew link --overwrite --force node@${VERSION:-$NODE_DEFAULT_VERSION}' again) so PATH picks it up."
  return 1
}

verify_ionic() {
  if command -v ionic >/dev/null 2>&1 && ionic --version >/dev/null 2>&1; then
    ok "ionic: $(ionic --version 2>/dev/null)"
    return 0
  fi
  fail "ionic: not on PATH. Make sure npm's global bin directory is on PATH (npm config get prefix), or re-run 'install.sh ionic'."
  return 1
}

verify_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    fail "docker: CLI not found - run 'install.sh docker' first."
    return 1
  fi
  if docker info >/dev/null 2>&1; then
    ok "docker: CLI present and daemon reachable ($(docker --version 2>/dev/null))"
    return 0
  fi
  fail "docker: CLI is installed but the daemon isn't reachable yet. On macOS: open /Applications/Docker.app and wait for it to finish starting (whale icon steady in the menu bar). On Linux: sudo systemctl start docker."
  return 1
}

if [ "$VERIFY_MODE" -eq 1 ]; then
  status=0
  case "$TOOL" in
    java)   verify_java   || status=1 ;;
    node)   verify_node   || status=1 ;;
    ionic)  verify_ionic  || status=1 ;;
    docker) verify_docker || status=1 ;;
    all)
      verify_java   || status=1
      verify_node   || status=1
      verify_ionic  || status=1
      verify_docker || status=1
      ;;
    *)
      echo "Unknown tool '$TOOL' (expected java|node|ionic|docker|all)" >&2
      exit 2
      ;;
  esac
  exit "$status"
fi

status=0
case "$TOOL" in
  java)   install_java   || status=1 ;;
  node)   install_node   || status=1 ;;
  ionic)  install_ionic  || status=1 ;;
  docker) install_docker || status=1 ;;
  all)
    if [ -n "$VERSION" ]; then
      echo "[FAIL] --version isn't supported with 'all' - run install.sh <tool> --version <v> for a specific tool." >&2
      exit 2
    fi
    install_java || status=1
    echo
    install_node || status=1
    echo
    install_ionic || status=1
    echo
    install_docker || status=1
    ;;
  *)
    echo "Unknown tool '$TOOL' (expected java|node|ionic|docker|all)" >&2
    exit 2
    ;;
esac

exit "$status"
