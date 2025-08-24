# 金属製品自動切り抜きツール

Photoshop AI（Adobe Sensei）を使用した高精度背景除去・背景色追加ツール。

## 🚀 使い方

### 🎯 一括処理（推奨）

```bash
# 1. 画像を配置
cp /path/to/images/* ./images/

# 2. 全工程を一括実行（対話形式設定）
./run-all-in-one.sh
```

**一括処理の内容:**
1. AI背景マスク作成
2. キャンバスサイズ変更と画像配置
3. 背景色追加
4. PSD保存

### 📝 段階別実行

#### ステップ1: AI背景マスク作成

```bash
# 1. 画像を配置
cp /path/to/images/* ./images/

# 2. AI自動マスク処理実行（PSDファイル出力）
./run-ai.sh
```

#### ステップ2: 背景色追加（対話形式）

```bash
# 1. PSDファイルを配置
cp ./output/*.psd ./bg_color_input/

# 2. 背景色追加実行（対話形式で色選択）
./run-bg-color.sh
```

#### ステップ3: キャンバスサイズ変更+背景色追加

```bash
# キャンバスサイズ変更と背景色を同時処理
./run-canvas-bg.sh
```

## ファイル構成

```
kirinuki/
├── images/                        # 入力画像フォルダ
├── output/                        # 完成PSDファイル出力
├── bg_color_input/               # 背景色追加用入力フォルダ（段階別処理用）
├── bg_color_output/              # 背景色付きPSDファイル出力（段階別処理用）
│
├── run-all-in-one.sh            # 統合処理スクリプト（推奨）
├── run-ai.sh                    # AI背景マスク作成スクリプト
├── run-bg-color.sh             # 背景色追加スクリプト
├── run-canvas-bg.sh            # キャンバスサイズ+背景色スクリプト
│
├── photoshop-all-in-one.jsx    # 統合処理スクリプト
├── photoshop-ai-remove.jsx     # AI背景マスク作成スクリプト
├── photoshop-bg-color.jsx      # 背景色追加スクリプト
└── photoshop-canvas-bg.jsx     # キャンバスサイズ+背景色スクリプト
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

### 🎯 統合処理（推奨）
✅ **ワンストップ処理** - 切り抜きから背景色追加まで一括実行  
✅ **対話形式設定** - 直感的なダイアログで全設定を完了  
✅ **スマートファイル名** - 処理内容を自動反映（例: `image_masked_2210x3315_lightgray.psd`）  
✅ **処理選択可能** - 必要な工程のみ実行可能

### 🤖 AI背景マスク作成
✅ **Photoshop AI使用** - 商用レベルの品質  
✅ **非破壊編集** - 元レイヤーを保持したマスク作成  
✅ **金属特化** - 反射や影も適切に処理  

### 📐 キャンバスサイズ変更と配置
✅ **カスタム配置** - 下部・左右マージンを個別設定  
✅ **自動スケーリング** - 縦横比保持でマージン内に最適配置  
✅ **プリセットサイズ** - A4、正方形等の定型サイズ対応

### 🎨 背景色追加
✅ **多彩な背景色** - 白、ライトグレー、カスタム色対応  
✅ **レイヤー構造保持** - 既存のマスクとレイヤーを完全維持  
✅ **バッチ処理** - 複数ファイルを一括処理

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
# 全スクリプトに実行権限を付与
chmod +x run-all-in-one.sh run-ai.sh run-bg-color.sh run-canvas-bg.sh

# 統合処理実行
./run-all-in-one.sh
```

### ファイルが保存されない場合

1. デバッグログを確認：
```bash
# 統合処理のログ
cat all-in-one-debug.log

# 個別処理のログ
cat debug.log              # AI背景マスク作成
cat bg-color-debug.log     # 背景色追加
cat canvas-bg-debug.log    # キャンバスサイズ変更
```

2. 入力フォルダの確認：
   - `images/` フォルダに画像ファイルがあることを確認
   - 対応形式: JPG, PNG, TIFF, BMP

3. Photoshopが完全に終了していることを確認して再実行

### 統合処理で特定工程をスキップしたい場合

統合処理のダイアログで不要な処理のチェックを外してください：
- □ AI背景マスク作成
- □ キャンバスサイズ変更と画像配置  
- □ 背景色追加