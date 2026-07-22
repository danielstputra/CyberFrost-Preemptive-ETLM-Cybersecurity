#!/bin/bash
# =====================================================
#  CyberFrost Git Manager — GitHub CLI Workflow
#  Penggunaan: source .scripts/git-manager.sh <command>
# =====================================================

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRED_FILE="$SCRIPT_DIR/.git-credentials"
REMOTE_NAME="origin"

# ── Colors ──
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# ── Help ──
show_help() {
  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "║        CyberFrost Git Manager               ║"
  echo "╠══════════════════════════════════════════════╣"
  echo "║  login     — Setup GitHub credentials (1x)  ║"
  echo "║  profile   — Show GitHub user info          ║"
  echo "║  status    — Show working tree status       ║"
  echo "║  log       — Show commit history            ║"
  echo "║  push      — Push commits to remote         ║"
  echo "║  pull      — Pull from remote               ║"
  echo "║  fetch     — Fetch from remote               ║"
  echo "║  merge     — Merge branch into current       ║"
  echo "║  branch    — List/create/delete/switch       ║"
  echo "║  remote    — Manage remote repository        ║"
  echo "║  init      — Init repo + set remote          ║"
  echo "║  help      — Show this help                  ║"
  echo "╚══════════════════════════════════════════════╝"
  echo ""
  echo "Contoh:"
  echo "  source .scripts/git-manager.sh login"
  echo "  source .scripts/git-manager.sh push"
  echo "  source .scripts/git-manager.sh branch create feature-x"
  echo "  source .scripts/git-manager.sh branch switch feature-x"
}

# ── Load credentials from file ──
load_creds() {
  if [ -f "$CRED_FILE" ]; then
    source "$CRED_FILE"
    return 0
  fi
  return 1
}

# ── Save credentials ──
save_creds() {
  echo "GITHUB_USER=$1" > "$CRED_FILE"
  echo "GITHUB_TOKEN=$2" >> "$CRED_FILE"
  echo "GITHUB_EMAIL=$3" >> "$CRED_FILE"
  chmod 600 "$CRED_FILE"

  # Konfigurasi git user
  git config --global user.name "$1"
  git config --global user.email "$3"

  # Setup credential helper (store aman di file)
  git config --global credential.helper store

  # Store credential di git global
  echo "protocol=https" | git credential-store store
  echo "host=github.com" | git credential-store store
  echo "username=$1" | git credential-store store
  echo "password=$2" | git credential-store store

  echo -e "${GREEN}✓ Credentials saved${NC}"
}

# ── Execute git with auth ──
git_auth() {
  if load_creds; then
    # Inject token via header
    git -c "http.https://github.com/.extraheader=AUTHORIZATION: bearer $GITHUB_TOKEN" "$@"
  else
    git "$@"
  fi
}

# =====================================================
#  COMMANDS
# =====================================================

case "${1:-help}" in

  # ── LOGIN ──
  login)
    echo -e "${CYAN}━━━ GitHub Login ━━━${NC}"
    echo ""

    read -p "GitHub Username: " GITHUB_USER
    read -p "GitHub Email: " GITHUB_EMAIL
    read -s -p "Personal Access Token (classic): " GITHUB_TOKEN
    echo ""

    # Test token
    echo -e "${YELLOW}Testing token...${NC}"
    TEST=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
    if echo "$TEST" | grep -q "\"login\""; then
      USERNAME=$(echo "$TEST" | grep -o '"login": *"[^"]*"' | cut -d'"' -f4)
      EMAIL=$(echo "$TEST" | grep -o '"email": *"[^"]*"' | cut -d'"' -f4)
      echo -e "${GREEN}✓ Login success as: $USERNAME${NC}"

      save_creds "$GITHUB_USER" "$GITHUB_TOKEN" "$GITHUB_EMAIL"
    else
      echo -e "${RED}✕ Token invalid.${NC}"
      echo "$TEST" | head -5
      exit 1
    fi
    ;;

  # ── PROFILE ──
  profile)
    if ! load_creds; then
      echo -e "${RED}Not logged in. Run 'login' first.${NC}"
      exit 1
    fi
    echo -e "${CYAN}━━━ GitHub Profile ━━━${NC}"
    curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -E '"login"|"name"|"email"|"public_repos"|"followers"|"following"|"html_url"' | sed 's/,//' | sed 's/"//g'
    echo ""
    echo -e "${CYAN}Local Git Config:${NC}"
    git config --global --list | grep -E "user\.(name|email)" || echo "  (not configured)"
    ;;

  # ── STATUS ──
  status)
    echo -e "${CYAN}━━━ Git Status ━━━${NC}"
    git status -s || echo "(not a git repository)"
    ;;

  # ── LOG ──
  log)
    COUNT="${2:-10}"
    echo -e "${CYAN}━━━ Last $COUNT commits ━━━${NC}"
    git log --oneline -n "$COUNT" --graph --all || echo "(not a git repository)"
    ;;

  # ── PUSH ──
  push)
    echo -e "${CYAN}━━━ Git Push ━━━${NC}"
    BRANCH="${2:-$(git branch --show-current)}"
    git_auth push "$REMOTE_NAME" "$BRANCH" 2>&1 | tail -10
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ Pushed to $REMOTE_NAME/$BRANCH${NC}"
    fi
    ;;

  # ── PULL ──
  pull)
    echo -e "${CYAN}━━━ Git Pull ━━━${NC}"
    BRANCH="${2:-$(git branch --show-current)}"
    git_auth pull "$REMOTE_NAME" "$BRANCH" 2>&1 | tail -10
    ;;

  # ── FETCH ──
  fetch)
    echo -e "${CYAN}━━━ Git Fetch ━━━${NC}"
    REMOTE="${2:-$REMOTE_NAME}"
    git_auth fetch "$REMOTE" 2>&1 | tail -5
    ;;

  # ── MERGE ──
  merge)
    if [ -z "$2" ]; then
      echo -e "${RED}Usage: source git-manager.sh merge <branch>${NC}"
      exit 1
    fi
    echo -e "${CYAN}━━━ Merge $2 into $(git branch --show-current) ━━━${NC}"
    git merge "$2" 2>&1 | tail -10
    ;;

  # ── BRANCH ──
  branch)
    ACTION="${2:-list}"
    case "$ACTION" in
      list)
        echo -e "${CYAN}━━━ Branches ━━━${NC}"
        git branch -a | head -30
        ;;
      create)
        if [ -z "$3" ]; then echo -e "${RED}Usage: branch create <name>${NC}"; exit 1; fi
        git checkout -b "$3"
        echo -e "${GREEN}✓ Created & switched to $3${NC}"
        ;;
      switch)
        if [ -z "$3" ]; then echo -e "${RED}Usage: branch switch <name>${NC}"; exit 1; fi
        git checkout "$3" 2>&1 || git checkout -b "$3" origin/"$3" 2>&1
        ;;
      delete)
        if [ -z "$3" ]; then echo -e "${RED}Usage: branch delete <name>${NC}"; exit 1; fi
        git branch -D "$3"
        echo -e "${RED}Deleted branch: $3${NC}"
        ;;
      *)
        echo -e "${RED}Unknown: $ACTION (use: list, create, switch, delete)${NC}"
        ;;
    esac
    ;;

  # ── REMOTE ──
  remote)
    if load_creds; then
      REMOTE_URL="https://$GITHUB_TOKEN@github.com/$GITHUB_USER/cyfirma-app.git"
    fi
    ACTION="${2:-show}"
    case "$ACTION" in
      show)
        git remote -v || echo "No remotes"
        ;;
      add)
        read -p "Repo URL (https://github.com/user/repo.git): " REPO_URL
        git remote add "$REMOTE_NAME" "$REPO_URL"
        echo -e "${GREEN}✓ Remote added${NC}"
        ;;
      set)
        read -p "Repo URL (https://github.com/user/repo.git): " REPO_URL
        git remote set-url "$REMOTE_NAME" "$REPO_URL"
        echo -e "${GREEN}✓ Remote URL updated${NC}"
        ;;
      set-token)
        if ! load_creds; then echo -e "${RED}Login first.${NC}"; exit 1; fi
        REPO_URL=$(git remote get-url "$REMOTE_NAME" 2>/dev/null)
        if [ -z "$REPO_URL" ]; then
          read -p "Repo URL: " REPO_URL
        fi
        # Inject token into URL
        AUTH_URL=$(echo "$REPO_URL" | sed "s|https://|https://$GITHUB_TOKEN@|")
        git remote set-url "$REMOTE_NAME" "$AUTH_URL"
        echo -e "${GREEN}✓ Token injected into remote URL${NC}"
        ;;
      *)
        echo -e "${RED}Unknown: $ACTION (use: show, add, set, set-token)${NC}"
        ;;
    esac
    ;;

  # ── INIT ──
  init)
    echo -e "${CYAN}━━━ Init Repository ━━━${NC}"
    if [ -d ".git" ]; then
      echo -e "${YELLOW}Git repo already exists.${NC}"
    else
      git init
      echo -e "${GREEN}✓ Git repo initialized${NC}"
    fi
    read -p "Remote URL (https://github.com/user/repo.git): " REPO_URL
    git remote add "$REMOTE_NAME" "$REPO_URL"
    echo -e "${GREEN}✓ Remote added: $REPO_URL${NC}"
    ;;

  # ── HELP ──
  help|*)
    show_help
    ;;
esac
