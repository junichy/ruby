# 金属製品自動切り抜きツール

Photoshop AI（Adobe Sensei）を使用した高精度背景除去ツール。

## 🚀 使い方

```bash
# 1. 画像を配置
cp /path/to/images/* ./images/

# 2. AI自動処理実行
./run-ai.sh
```

## ファイル構成

```
kirinuki/
├── images/              # 入力画像フォルダ
├── output/              # 出力画像フォルダ（透明PNG）
├── run-ai.sh           # 実行スクリプト
└── photoshop-ai-remove.jsx  # AI背景削除スクリプト
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

✅ **Photoshop AI使用**で商用レベルの品質  
✅ **完全自動処理** - コマンド1つで全画像を処理  
✅ **高速処理** - AI機能により高速化  
✅ **金属特化** - 反射や影も適切に処理

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
chmod +x run-ai.sh  # 実行権限を付与
./run-ai.sh         # 再実行
```