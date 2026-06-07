FROM node:24.16.0-trixie-slim
LABEL maintainer="developers@dailybot.com"

# System packages (apt requires root)
RUN apt-get update -y && \
    apt-get install -y less git curl gnupg ca-certificates openssh-client sudo nano \
    # Chromium for Lighthouse CI local audits
    chromium && \
    # Install GitHub CLI (binary is system-wide; per-user config lives in ~/.config/gh)
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    # --- Clean ---
    apt-get clean -y && \
    rm -rf /var/cache/apk/* && \
    rm -rf /var/lib/apt/lists/*

# Default terminal editor inside container (used by Git for merge/commit messages)
ENV EDITOR=nano
ENV VISUAL=nano
ENV GIT_EDITOR=nano

# Chromium path for Lighthouse CI (chrome-launcher)
ENV CHROME_PATH=/usr/bin/chromium
ENV CHROMIUM_FLAGS="--no-sandbox"

# Add node user to sudoers (node user already exists in official node images with uid 1000)
RUN echo 'node ALL=(root) NOPASSWD:ALL' > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Make node user's CLI install dirs available on PATH (npm globals, Claude, Cursor agent)
ENV PATH=/home/node/.npm-global/bin:/home/node/.local/bin:/home/node/.cursor/bin:$PATH

# Source custom commands for node user
RUN echo 'source /app/docker/custom_commands.sh' >> /home/node/.bashrc \
    && chown node:node /home/node/.bashrc

# Pre-create persistent data dirs so the named volumes inherit node ownership on first mount
RUN mkdir -p /home/node/.claude_data /home/node/.codex_data /home/node/.cursor_data /home/node/.gh_data /home/node/.ssh \
    && chown -R node:node /home/node

# Install AI CLIs and configure git as node user
USER node

# Configure npm to install globals into a node-owned directory (no sudo needed)
RUN mkdir -p /home/node/.npm-global \
    && npm config set prefix /home/node/.npm-global

# Install Claude Code CLI (native installer, npm method is deprecated).
# Remove fresh install artifacts so the persistent volume isn't overwritten on rebuild.
RUN curl -fsSL https://claude.ai/install.sh | bash \
    && rm -rf /home/node/.claude /home/node/.claude.json

# Install Cursor CLI (provides the 'agent' command in ~/.cursor/bin)
RUN curl -fsSL https://cursor.com/install | bash

# Install Codex CLI globally (resolves under /home/node/.npm-global)
RUN npm install -g @openai/codex

# Configure Git for node user (can be overridden by mounted .gitconfig)
RUN git config --global init.defaultBranch main \
    && git config --global pull.rebase false \
    && git config --global safe.directory '*'

USER root

# Copy and setup entrypoint script
COPY universalemojiparser/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
