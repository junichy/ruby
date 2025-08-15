#!/bin/bash

# Photoshop AI背景削除 実行スクリプト

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Photoshopを確実に終了
pkill -f "Adobe Photoshop" 2>/dev/null || true
sleep 2

# AI背景削除を実行
osascript -e 'tell application "Adobe Photoshop 2025" to activate' && \
osascript -e "tell application \"Adobe Photoshop 2025\" to do javascript file \"$SCRIPT_DIR/photoshop-ai-remove.jsx\""