#!/bin/bash

# Photoshop キャンバスサイズ＋背景色追加 実行スクリプト

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Photoshop キャンバスサイズ変更＋背景色追加を開始します..."

# Photoshopを確実に終了
pkill -f "Adobe Photoshop" 2>/dev/null || true
sleep 2

echo "Photoshop 2025を起動中..."

# キャンバスサイズ変更＋背景色追加を実行（エラー詳細を表示）
osascript -e 'tell application "Adobe Photoshop 2025" to activate' 2>&1 && \
osascript -e "tell application \"Adobe Photoshop 2025\" to do javascript file \"$SCRIPT_DIR/photoshop-canvas-bg.jsx\"" 2>&1

echo "スクリプト実行完了"