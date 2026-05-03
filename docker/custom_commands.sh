#!/bin/bash

function print.success {
	GREEN="\033[0;32m"
  RESET="\033[0m"
  echo -e "${GREEN}$1${RESET}"
}

function print.error {
	RED="\033[0;31m"
  RESET="\033[0m"
  echo -e "${RED}$1${RESET}"
}

function check() {
	print.success "Running ESLint..."
	npm run eslint:check
	if [ $? != 0 ]; then
		echo ''
		print.error "⚠️ ESLint failed."
		return 1
	fi

	print.success "Running Prettier check..."
	npm run prettier:check
	if [ $? != 0 ]; then
		echo ''
		print.error "⚠️ Prettier check failed."
		return 1
	fi
}

function fix() {
	print.success "Running ESLint with --fix..."
	npm run eslint:fix
	if [ $? != 0 ]; then
		echo ''
		print.error "⚠️ ESLint fix failed."
		return 1
	fi

	print.success "Running Prettier --write..."
	npm run prettier:fix
	if [ $? != 0 ]; then
		echo ''
		print.error "⚠️ Prettier fix failed."
		return 1
	fi
}

function test() {
	print.success "Running tests..."
	npm run test
}

function build() {
	print.success "Running TypeScript build (tsc)..."
	npm run build:tsc
	if [ $? != 0 ]; then
		print.error "⚠️ tsc build failed."
		return 1
	fi
	print.success "Running Webpack production build..."
	npm run build
	if [ $? != 0 ]; then
		print.error "⚠️ Webpack build failed."
		return 1
	fi
}

# Same gates as CI plus build:tsc + webpack (pre-merge / pre-publish).
# Order: lint/format -> build -> test. Build runs before test so the bundle suite
# in test/exports.test.ts validates an up-to-date dist/index.js (otherwise it
# self-skips with a hint).
function codecheck() {
	check
	if [ $? != 0 ]; then
		echo ''
		print.error "⚠️ Lint/format check failed."
		return 1
	fi
	build
	if [ $? != 0 ]; then
		print.error "⚠️ Build failed."
		return 1
	fi
	test
	if [ $? != 0 ]; then
		print.error "⚠️ Tests failed."
		return 1
	fi
	print.success "✅ codecheck passed (eslint + prettier + build:tsc + webpack + test)"
}

function install() {
  print.success "Running npm install..."
	npm install
}

# ================================
# Codex CLI with full permissions (bypass approvals and sandbox)
# ================================
# Usage:
#   codexx              - Start new session
#   codexx -l|--last    - Resume last session
#   codexx -r|--resume  - Interactive session selection
#   codexx -r <id>      - Resume specific session by ID
function codexx() {
	case "${1:-}" in
		-l|--last)
			print.success "Resuming last Codex session..."
			shift
			codex resume --last --dangerously-bypass-approvals-and-sandbox "$@"
			;;
		-r|--resume)
			shift
			if [[ -n "${1:-}" && "${1:0:1}" != "-" ]]; then
				# Resume specific session by ID
				local session_id="$1"
				shift
				print.success "Resuming Codex session: $session_id..."
				codex resume "$session_id" --dangerously-bypass-approvals-and-sandbox "$@"
			else
				# Interactive session selection
				print.success "Selecting Codex session to resume..."
				codex resume --all --dangerously-bypass-approvals-and-sandbox "$@"
			fi
			;;
		*)
			print.success "Starting new Codex session with full permissions..."
			codex --dangerously-bypass-approvals-and-sandbox "$@"
			;;
	esac
}

# ================================
# Claude Code with full permissions (skip all permission prompts)
# ================================
# Usage:
#   claudex                - Start new session
#   claudex -c|--continue  - Continue most recent session
#   claudex -r|--resume    - Interactive session selection
#   claudex -r <id>        - Resume specific session by ID
function claudex() {
	# Works when running as dev-user (non-root) which is the default in devcontainer
	case "${1:-}" in
		-c|--continue)
			print.success "Continuing most recent Claude Code session..."
			shift
			claude --continue --dangerously-skip-permissions "$@"
			;;
		-r|--resume)
			shift
			if [[ -n "${1:-}" && "${1:0:1}" != "-" ]]; then
				# Resume specific session by ID
				local session_id="$1"
				shift
				print.success "Resuming Claude Code session: $session_id..."
				claude --resume "$session_id" --dangerously-skip-permissions "$@"
			else
				# Interactive session selection
				print.success "Selecting Claude Code session to resume..."
				claude --resume --dangerously-skip-permissions "$@"
			fi
			;;
		*)
			print.success "Starting new Claude Code session with full permissions..."
			claude --dangerously-skip-permissions "$@"
			;;
	esac
}

# ================================
# Cursor CLI agent (interactive mode with full permissions)
# ================================
# Usage:
#   cursorx              - Start new session
#   cursorx -l|--list    - List available sessions
#   cursorx -r|--resume  - Resume last session
#   cursorx -r <id>      - Resume specific session by ID
function cursorx() {
	# Cursor CLI uses 'agent' command with --force to bypass all approval prompts
	case "${1:-}" in
		-l|--list)
			print.success "Listing Cursor CLI sessions..."
			shift
			agent ls "$@"
			;;
		-r|--resume)
			shift
			if [[ -n "${1:-}" && "${1:0:1}" != "-" ]]; then
				# Resume specific session by ID
				local session_id="$1"
				shift
				print.success "Resuming Cursor CLI session: $session_id..."
				agent --resume="$session_id" --force "$@"
			else
				# Resume last session
				print.success "Resuming last Cursor CLI session..."
				agent resume --force "$@"
			fi
			;;
		*)
			print.success "Starting new Cursor CLI session with full permissions..."
			agent --force "$@"
			;;
	esac
}

# Check if running inside Docker container
function check_devcontainer() {
	if [[ -f /.dockerenv ]] || [[ -n "${REMOTE_CONTAINERS:-}" ]] || [[ -n "${CODESPACES:-}" ]]; then
		print.success "✅ Running inside Docker container"
		echo ""
		echo "All development commands are available:"
		echo "  • check, fix, test, build, codecheck, install"
		return 0
	else
		print.error "❌ NOT running inside Docker container"
		echo ""
		echo "⚠️  WARNING: This project requires a Docker container environment."
		echo "   Commands like 'check', 'fix', 'test', etc."
		echo "   only work inside the Docker container."
		echo ""
		echo "   To work with this project:"
		echo "   1. From repo root: cd docker/local && docker compose up -d uemojiparservscode"
		echo "   2. Shell into the container: docker exec -it uemojiparser bash"
		echo "   3. Or open the folder in VS Code / Cursor and use Dev Containers (see .devcontainer_example/)"
		return 1
	fi
}

# ================================
# Git-aware Bash Prompt
# ================================

# Function to get current git branch
function git_branch() {
    local branch
    if branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null); then
        if [[ "$branch" == "HEAD" ]]; then
            branch='detached*'
        fi
        echo "$branch"
    fi
}

# Function to get git status indicators
function git_status_indicator() {
    local git_status
    git_status=$(git status --porcelain 2>/dev/null)

    if [[ -n "$git_status" ]]; then
        echo "*"  # Asterisk for uncommitted changes
    fi
}

# Custom PS1 prompt with colors and git info
function set_bash_prompt() {
    local exit_code=$?

    # Color codes
    local yellow="\[\033[0;33m\]"
    local red="\[\033[0;31m\]"
    local green="\[\033[0;32m\]"
    local white="\[\033[0;37m\]"
    local reset="\[\033[0m\]"

    # Get git branch and status
    local git_info=""
    if git rev-parse --git-dir > /dev/null 2>&1; then
        local branch
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

        if [[ "$branch" == "HEAD" ]]; then
            branch='detached*'
        fi

        # Check if there are uncommitted changes
        if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
            git_info=" ${red}(${branch}*)${reset}"
        else
            git_info=" ${green}(${branch})${reset}"
        fi
    fi

    # Build the prompt - simple format: path (git) $
    PS1="${yellow}\w${reset}${git_info}${white} \$ ${reset}"
}

# Set the custom prompt
PROMPT_COMMAND=set_bash_prompt

# ================================
# Useful Git Aliases
# ================================

alias gs='git status'
alias ga='git add .'
alias gc='git commit -am'
alias gp='git push -u origin HEAD'
alias gl='git log --oneline --graph --decorate --all -20'
alias gd='git diff'
alias gb='git for-each-ref --sort=-committerdate refs/heads/ --format="%(HEAD) %(color:yellow)%(refname:short)%(color:reset) - %(color:green)%(committerdate:relative)%(color:reset) - %(color:blue)%(authorname)%(color:reset)"'
alias gbd='git branch -D'
alias gco='git checkout'
alias gcob='git checkout -b'
alias gpl='git pull origin HEAD'
alias grc='git rm -r --cached .'
alias help='show_welcome'

# Welcome message
function show_welcome() {
    echo ""
    print.success "🚀 Universal Emoji Parser Development Container"
    echo ""

    # Check container status
    check_devcontainer
    echo ""

    echo "Useful commands:"
    echo "  • check_devcontainer  - Check if running inside Docker container (CRITICAL)"
    echo "  • help                 - Show this message"
    echo "  • check                - npm run eslint:check + prettier:check (CI lint/format gate)"
    echo "  • fix                  - npm run eslint:fix + prettier:fix"
    echo "  • test                 - npm run test (Mocha + tsx)"
    echo "  • build                - npm run build:tsc + npm run build (types + webpack)"
    echo "  • codecheck            - check + test + build (full local gate before push)"
    echo "  • install              - npm install"
    echo ""
    echo "AI Assistant commands:"
    echo "  • claude            - Claude Code CLI"
    echo "  • codex             - Codex CLI"
    echo "  • agent             - Cursor CLI agent (or cursorx alias)"
    echo ""
    echo "  • codexx            - Codex with full permissions (bypass approvals and sandbox)"
    echo "      -l, --last      Resume last session"
    echo "      -r, --resume    Interactive session selection"
    echo "      -r <id>         Resume specific session by ID"
    echo ""
    echo "  • claudex           - Claude Code with full permissions (skip all permission prompts)"
    echo "      -c, --continue  Continue most recent session"
    echo "      -r, --resume    Interactive session selection"
    echo "      -r <id>         Resume specific session by ID"
    echo ""
    echo "  • cursorx           - Cursor CLI agent (interactive mode)"
    echo "      -l, --list      List available sessions"
    echo "      -r, --resume    Resume last session"
    echo "      -r <id>         Resume specific session by ID"
    echo ""
    echo "Git shortcuts:"
    echo "  • gs   - git status"
    echo "  • ga   - git add ."
    echo "  • gc   - git commit"
    echo "  • gp   - git push -u origin HEAD"
    echo "  • gpl  - git pull origin HEAD"
    echo "  • gl   - git log (pretty)"
    echo "  • gd   - git diff"
    echo "  • gb   - git branch"
    echo "  • gbd  - git branch -D"
    echo "  • gco  - git checkout"
    echo "  • gcob - git checkout -b"
    echo "  • grc  - git rm -r --cached . (reset cache, useful after updating .gitignore)"
    echo ""
}

# Show welcome message only for interactive shells
if [[ $- == *i* ]]; then
    show_welcome
fi
