# 金属製品自動切り抜きツール

Photoshop AI（Adobe Sensei）を使用した高精度背景除去・背景色追加ツール。

## 🚀 使い方

### ステップ1: AI背景マスク作成

```bash
# 1. 画像を配置
cp /path/to/images/* ./images/

# 2. AI自動マスク処理実行（PSDファイル出力）
./run-ai.sh
```

### ステップ2: 背景色追加（対話形式）

```bash
# 1. PSDファイルを配置
cp ./output/*.psd ./bg_color_input/

# 2. 背景色追加実行（対話形式で色選択）
./run-bg-color.sh
```

## ファイル構成

```
kirinuki/
├── images/                    # 入力画像フォルダ
├── output/                    # マスク付きPSDファイル出力
├── bg_color_input/           # 背景色追加用入力フォルダ
├── bg_color_output/          # 背景色付きPSDファイル出力
├── run-ai.sh                 # AI背景マスク作成スクリプト
├── run-bg-color.sh          # 背景色追加スクリプト
├── photoshop-ai-remove.jsx  # AI背景マスク作成スクリプト
└── photoshop-bg-color.jsx   # 背景色追加スクリプト
```

## 動作環境

- macOS
- Adobe Photoshop 2024以降
- 対応画像形式: JPG, PNG, TIFF, BMP, PSD

## 設定

### Photoshopのバージョンが異なる場合

`run-ai.sh`を編集して、お使いのPhotoshopバージョンに変更してください：

```bash
# 例: Photoshop 2024の場合
# run-ai.shの12-13行目を編集
osascript -e 'tell application "Adobe Photoshop 2024" to activate' && \
osascript -e "tell application \"Adobe Photoshop 2024\" to do javascript file \"$SCRIPT_DIR/photoshop-ai-remove.jsx\""
```

### Photoshopのパスを確認する方法

```bash
# インストールされているPhotoshopを検索
ls /Applications | grep Photoshop
```

## 特徴

### AI背景マスク作成
✅ **Photoshop AI使用**で商用レベルの品質  
✅ **非破壊編集** - 元レイヤーを保持したマスク作成  
✅ **PSD形式出力** - レイヤー構造を維持  
✅ **金属特化** - 反射や影も適切に処理

### 背景色追加
✅ **対話形式選択** - 白、ライトグレー、カスタム色対応  
✅ **レイヤー保持** - 既存のマスクとレイヤーを維持  
✅ **バッチ処理** - 複数ファイルを一括処理  
✅ **安全なファイル名** - 自動的に適切なファイル名を生成

## トラブルシューティング

### エラー: Photoshopが見つからない場合

```bash
# エラーメッセージ例
60:70: execution error: Can't get application "Adobe Photoshop 2025"
```

**解決方法**: `run-ai.sh`内のPhotoshopバージョンを修正してください（上記「設定」参照）

### 処理が実行されない場合

1. Photoshopが完全に終了していることを確認
2. `images`フォルダに画像があることを確認
3. ターミナルから以下を実行：

```bash
chmod +x run-ai.sh run-bg-color.sh  # 実行権限を付与
./run-ai.sh                         # AI背景マスク作成
./run-bg-color.sh                   # 背景色追加
```

### 背景色追加でファイルが保存されない場合

1. デバッグログを確認：
```bash
cat bg-color-debug.log
```

2. bg_color_inputフォルダにPSDファイルがあることを確認
3. Photoshopが完全に終了していることを確認して再実行