#!/bin/bash

# Photoshop 統合処理 実行スクリプト
# AI背景マスク作成 → キャンバスサイズ変更 → 画像配置 → 背景色追加を一括処理

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================================"
echo "Photoshop 統合処理を開始します"
echo "================================================"
echo ""
echo "処理内容:"
echo "1. AI背景マスク作成"
echo "2. キャンバスサイズ変更と画像配置"
echo "3. 背景色追加"
echo ""
echo "入力: imagesフォルダ"
echo "出力: outputフォルダ"
echo ""

# Photoshopを確実に終了
pkill -f "Adobe Photoshop" 2>/dev/null || true
sleep 2

echo "Photoshop 2025を起動中..."

# 統合処理を実行（エラー詳細を表示）
osascript -e 'tell application "Adobe Photoshop 2025" to activate' 2>&1 && \
osascript -e "tell application \"Adobe Photoshop 2025\" to do javascript file \"$SCRIPT_DIR/photoshop-all-in-one.jsx\"" 2>&1

echo ""
echo "================================================"
echo "スクリプト実行完了"
echo "================================================"