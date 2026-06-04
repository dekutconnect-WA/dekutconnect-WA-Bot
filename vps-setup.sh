#!/bin/bash
# ============================================================
# DEKUTCONNECT WhatsApp Bot — VPS Setup Script
# Run on a fresh Ubuntu/Debian Linux VPS
# Usage: chmod +x vps-setup.sh && ./vps-setup.sh
# ============================================================

set -e

echo "=============================================="
echo "  DEKUTCONNECT VPS Bot Setup"
echo "=============================================="

# ── 1. System Update ──
echo "[1/6] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# ── 2. Install Node.js 20 LTS ──
echo "[2/6] Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "  Node.js $(node -v) installed"
echo "  npm $(npm -v) installed"

# ── 3. Install PM2 (process manager) ──
echo "[3/6] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "  PM2 $(pm2 -v) installed"

# ── 4. Install system dependencies ──
echo "[4/6] Installing system dependencies..."
sudo apt-get install -y \
    git \
    ffmpeg \
    imagemagick \
    webp \
    curl \
    build-essential

# ── 5. Setup project ──
echo "[5/6] Setting up DekutConnect bot..."

PROJECT_DIR="$HOME/dekutconnect-bot"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "  Cloning repository..."
    # Replace with your actual repo URL
    git clone https://github.com/dekutconnect/wa-bot.git "$PROJECT_DIR" 2>/dev/null || {
        echo "  Creating project directory (no git remote)..."
        mkdir -p "$PROJECT_DIR"
        echo "  Copy your bot files to: $PROJECT_DIR"
    }
fi

cd "$PROJECT_DIR"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "  Created .env from .env.example — EDIT THIS FILE with your values!"
    else
        echo "  WARNING: No .env.example found. Create .env manually."
    fi
fi

# Install dependencies
echo "  Installing npm dependencies..."
npm install --omit=dev --no-audit --no-fund 2>/dev/null || npm install

# ── 6. Start with PM2 ──
echo "[6/6] Starting bot with PM2..."

# Stop existing instance if running
pm2 delete dekutconnect-bot 2>/dev/null || true

# Start the bot
pm2 start index.js \
    --name "dekutconnect-bot" \
    --max-memory-restart 512M \
    --exp-backoff-restart-delay=5000 \
    --time

# Save PM2 config so it restarts on reboot
pm2 save
pm2 startup 2>/dev/null || echo "  Run the command above as root to enable auto-start on reboot"

echo ""
echo "=============================================="
echo "  ✅ DEKUTCONNECT Bot is running!"
echo "=============================================="
echo ""
echo "  📋 Useful PM2 commands:"
echo "    pm2 logs dekutconnect-bot     # View logs"
echo "    pm2 restart dekutconnect-bot  # Restart bot"
echo "    pm2 stop dekutconnect-bot     # Stop bot"
echo "    pm2 monit                     # Real-time monitoring"
echo ""
echo "  🔧 Configuration:"
echo "    Edit: $PROJECT_DIR/.env"
echo "    Then: pm2 restart dekutconnect-bot"
echo ""
echo "  🌐 Health check:"
echo "    curl http://localhost:5000/health"
echo ""
echo "  ⚠️  IMPORTANT: Edit .env with your actual values!"
echo "    - SESSION_ID"
echo "    - DATABASE_URL (Supabase PostgreSQL)"
echo "    - FIREBASE_ADMIN_CREDENTIAL"
echo "    - BOT_UID"
echo "=============================================="
