// 最適化されたUI要素のテスト
try {
    var dialog = new Window("dialog", "最適化UIテスト");
    dialog.orientation = "column";
    
    // ListBox vs DropDownListのパフォーマンステスト
    var panel = dialog.add("panel", undefined, "ListBox（最適化版）");
    panel.orientation = "column";
    
    // 大量のアイテムを持つListBox
    var items = [];
    for (var i = 1; i <= 50; i++) {
        items.push("アイテム " + i);
    }
    
    var startTime = new Date().getTime();
    var listBox = panel.add("listbox", undefined, items);
    listBox.preferredSize.height = 100;
    listBox.selection = 0;
    var listBoxTime = new Date().getTime() - startTime;
    
    panel.add("statictext", undefined, "ListBox作成時間: " + listBoxTime + "ms");
    
    // 比較用のDropDownList
    var panel2 = dialog.add("panel", undefined, "DropDownList（従来版）");
    panel2.orientation = "column";
    
    startTime = new Date().getTime();
    var dropdown = panel2.add("dropdownlist");
    for (var i = 1; i <= 50; i++) {
        dropdown.add("item", "アイテム " + i);
    }
    dropdown.selection = 0;
    var dropdownTime = new Date().getTime() - startTime;
    
    panel2.add("statictext", undefined, "DropDown作成時間: " + dropdownTime + "ms");
    
    // 結果表示
    var resultPanel = dialog.add("panel", undefined, "結果");
    var speedup = Math.round((dropdownTime / listBoxTime) * 100) / 100;
    resultPanel.add("statictext", undefined, "速度向上: " + speedup + "倍");
    
    // ボタン
    var buttonGroup = dialog.add("group");
    var okButton = buttonGroup.add("button", undefined, "OK");
    var testButton = buttonGroup.add("button", undefined, "選択テスト");
    
    testButton.onClick = function() {
        var listSelection = listBox.selection ? listBox.selection.text : "なし";
        var dropSelection = dropdown.selection ? dropdown.selection.text : "なし";
        alert("ListBox: " + listSelection + "\nDropDown: " + dropSelection);
    };
    
    okButton.onClick = function() {
        dialog.close(1);
    };
    
    dialog.show();
    
} catch (e) {
    alert("エラー: " + e.toString() + "\nLine: " + e.line);
}