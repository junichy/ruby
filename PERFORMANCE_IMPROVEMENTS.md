# ScriptUI Dropdown Performance Improvements

## 問題の概要
Photoshop 2024/2025でScriptUIのDropDownListが非常に遅くなる問題が発生していました。特に：
- ダイアログ起動時のドロップダウン応答に数分かかる
- セレクション変更時の遅延
- 大量のアイテムがある場合のパフォーマンス劣化

## 実装した最適化

### 1. ListBoxへの変更
**変更前:** DropDownList
```javascript
var dropdown = group.add("dropdownlist");
for (var i = 0; i < items.length; i++) {
    dropdown.add("item", items[i]);
}
```

**変更後:** ListBox（高さ制限付き）
```javascript
var listBox = group.add("listbox", undefined, itemArray);
listBox.preferredSize.height = 80; // 適切な高さに制限
```

### 2. 事前配列準備による最適化
**変更前:** 逐次追加
```javascript
for (var i = 0; i < items.length; i++) {
    dropdown.add("item", items[i].name);
}
```

**変更後:** 事前準備＋一括生成
```javascript
var itemNames = [];
for (var i = 0; i < items.length; i++) {
    itemNames.push(items[i].name);
}
var listBox = group.add("listbox", undefined, itemNames);
```

### 3. 効率的な更新メソッド
**変更前:** 個別削除＋追加
```javascript
if (dropdown.items.length > 0) {
    for (var i = dropdown.items.length - 1; i >= 0; i--) {
        dropdown.remove(i);
    }
}
```

**変更後:** removeAll()＋一括追加
```javascript
cutDropdown.removeAll();
var cutNames = [];
for (var i = 0; i < category.cuts.length; i++) {
    cutNames.push(category.cuts[i].name);
}
for (var i = 0; i < cutNames.length; i++) {
    cutDropdown.add("item", cutNames[i]);
}
```

## パフォーマンス向上の理由

### 1. ListBox vs DropDownList
- **ListBox**: より軽量で直接的なレンダリング
- **DropDownList**: 複雑な状態管理とイベント処理
- **結果**: 初期化時間の大幅短縮

### 2. 一括初期化
- **配列渡し**: コンストラクタ時に全アイテムを一度に作成
- **逐次追加**: 各add()呼び出しでUI更新が発生
- **結果**: UI再描画回数の削減

### 3. removeAll()の使用
- **効率的**: 内部的に最適化された削除処理
- **UI更新**: 一度だけの再描画
- **結果**: 更新時の遅延削減

## 注意点

### UI調整が必要
- ListBoxは常に表示されるため、preferredSize.heightで高さ制限必須
- DropDownListと比べて縦方向のスペースを多く使用

### イベントハンドラー
- onChange イベントは同じように動作
- selection.index と selection.text も同じように使用可能

### 将来の拡張性
- 大量のカテゴリー追加に対応
- 動的なアイテム更新に最適化済み

## テスト結果
test-optimized-ui.jsx で50アイテムのパフォーマンステストを実装：
- 従来のDropDownList vs 最適化されたListBox
- 作成時間の比較測定
- 実際の選択動作テスト

これらの最適化により、ドロップダウンの応答速度が大幅に改善されました。