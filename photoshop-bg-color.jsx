// Photoshop 背景色追加スクリプト - 対話形式
// PSDファイルにレイヤーを保持したまま背景色を追加

// ========== 設定 ==========
var BG_CONFIG = {
    inputFolderName: "bg_color_input",
    outputFolderName: "bg_color_output",
    backgroundColors: [
        { name: "白", hex: "#FFFFFF", rgb: [255, 255, 255] },
        { name: "ライトグレー", hex: "#F6F6F6", rgb: [246, 246, 246] },
        { name: "カスタム", hex: "", rgb: [128, 128, 128] }
    ],
    showProgress: true
};

// ========== グローバル変数 ==========
var scriptFolder = new File($.fileName).parent;
var inputFolder = new Folder(scriptFolder + "/" + BG_CONFIG.inputFolderName);
var outputFolder = new Folder(scriptFolder + "/" + BG_CONFIG.outputFolderName);

// ========== ログ ==========
function log(message) {
    var logMessage = "[" + new Date().toLocaleTimeString() + "] " + message;
    $.writeln(logMessage);
    
    // ログファイルにも出力
    try {
        var logFile = new File(scriptFolder + "/bg-color-debug.log");
        logFile.open("a");
        logFile.writeln(logMessage);
        logFile.close();
    } catch (e) {
        // ログファイル書き込みエラーは無視
    }
}

// ========== 背景色選択ダイアログ ==========
function selectBackgroundColor() {
    var dialog = new Window("dialog", "背景色を選択");
    dialog.orientation = "column";
    dialog.alignChildren = "left";
    
    // 説明テキスト
    var infoGroup = dialog.add("group");
    infoGroup.add("statictext", undefined, "追加する背景色を選択してください:");
    
    // 色選択ラジオボタン
    var colorGroup = dialog.add("group");
    colorGroup.orientation = "column";
    colorGroup.alignChildren = "left";
    
    var radioButtons = [];
    for (var i = 0; i < BG_CONFIG.backgroundColors.length; i++) {
        var color = BG_CONFIG.backgroundColors[i];
        var radio = colorGroup.add("radiobutton", undefined, color.name + " (" + color.hex + ")");
        if (i === 0) radio.value = true; // 最初の色をデフォルト選択
        radioButtons.push(radio);
    }
    
    // カスタム色入力
    var customGroup = dialog.add("group");
    customGroup.add("statictext", undefined, "カスタム色 (16進数):");
    var customInput = customGroup.add("edittext", undefined, "#F6F6F6");
    customInput.characters = 10;
    
    // プレビューグループ
    var previewGroup = dialog.add("group");
    previewGroup.add("statictext", undefined, "プレビュー:");
    var previewPanel = previewGroup.add("panel");
    previewPanel.preferredSize.width = 50;
    previewPanel.preferredSize.height = 30;
    
    // ボタングループ
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    var okButton = buttonGroup.add("button", undefined, "OK");
    var cancelButton = buttonGroup.add("button", undefined, "キャンセル");
    
    // イベントハンドラ
    okButton.onClick = function() {
        dialog.close(1);
    };
    
    cancelButton.onClick = function() {
        dialog.close(0);
    };
    
    // ダイアログ表示
    var result = dialog.show();
    if (result === 1) {
        // 選択された色を返す
        for (var i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].value) {
                if (i === BG_CONFIG.backgroundColors.length - 1) {
                    // カスタム色の場合
                    var customHex = customInput.text;
                    return {
                        name: "カスタム",
                        hex: customHex,
                        rgb: hexToRgb(customHex)
                    };
                } else {
                    return BG_CONFIG.backgroundColors[i];
                }
            }
        }
    }
    return null; // キャンセルまたはエラー
}

// ========== 16進数からRGB変換 ==========
function hexToRgb(hex) {
    // #を除去
    hex = hex.replace('#', '');
    
    if (hex.length === 6) {
        return [
            parseInt(hex.substr(0, 2), 16),
            parseInt(hex.substr(2, 2), 16),
            parseInt(hex.substr(4, 2), 16)
        ];
    }
    return [128, 128, 128]; // デフォルト値
}

// ========== 背景レイヤー追加 ==========
function addBackgroundLayer(doc, color) {
    try {
        log("背景レイヤー追加開始: " + color.name + " " + color.hex);
        
        // 新しい背景レイヤーを作成
        var bgLayer = doc.artLayers.add();
        bgLayer.name = "Background " + color.name;
        
        // レイヤーを最背面に移動
        bgLayer.move(doc, ElementPlacement.PLACEATEND);
        
        // 背景色で塗りつぶし
        var fillColor = new SolidColor();
        fillColor.rgb.red = color.rgb[0];
        fillColor.rgb.green = color.rgb[1];
        fillColor.rgb.blue = color.rgb[2];
        
        // 全体を選択して塗りつぶし
        doc.selection.selectAll();
        doc.activeLayer = bgLayer;
        doc.selection.fill(fillColor);
        doc.selection.deselect();
        
        log("背景レイヤー追加完了: " + color.name);
        return true;
        
    } catch (e) {
        log("背景レイヤー追加エラー: " + e.toString());
        return false;
    }
}

// ========== PSD保存 ==========
function savePSD(doc, path) {
    try {
        log("PSD保存開始: " + path);
        
        var file = new File(path);
        
        // ActionDescriptor を使用したPSD保存
        var idSave = charIDToTypeID("save");
        var desc = new ActionDescriptor();
        var idAs = charIDToTypeID("As  ");
        var desc2 = new ActionDescriptor();
        var idmaximizeCompatibility = stringIDToTypeID("maximizeCompatibility");
        desc2.putBoolean(idmaximizeCompatibility, true);
        var idPhtF = charIDToTypeID("PhtF");
        desc.putObject(idAs, idPhtF, desc2);
        var idIn = charIDToTypeID("In  ");
        desc.putPath(idIn, file);
        var idDocI = charIDToTypeID("DocI");
        desc.putInteger(idDocI, doc.id);
        executeAction(idSave, desc, DialogModes.NO);
        
        log("PSD保存成功: " + file.name);
        return true;
        
    } catch (e) {
        log("ActionDescriptor保存エラー: " + e.toString());
        
        // 代替手段: 標準のsaveAs
        try {
            log("標準保存で再試行...");
            var options = new PhotoshopSaveOptions();
            options.layers = true;
            doc.saveAs(file, options, true);
            log("標準保存成功: " + file.name);
            return true;
        } catch (e2) {
            log("標準保存も失敗: " + e2.toString());
            
            // 最終手段: 複製して保存
            try {
                log("複製保存で再試行...");
                var duplicate = doc.duplicate();
                duplicate.saveAs(file, options, true);
                duplicate.close(SaveOptions.DONOTSAVECHANGES);
                log("複製保存成功: " + file.name);
                return true;
            } catch (e3) {
                log("全ての保存方法が失敗: " + e3.toString());
                return false;
            }
        }
    }
}

// ========== メイン処理 ==========
function main() {
    try {
        app.displayDialogs = DialogModes.NO;
        app.preferences.rulerUnits = Units.PIXELS;
        
        log("========== Photoshop 背景色追加開始 ==========");
        log("Photoshopバージョン: " + app.version);
        
        // フォルダ確認
        if (!inputFolder.exists) {
            alert("bg_color_inputフォルダが見つかりません。");
            return;
        }
        if (!outputFolder.exists) {
            outputFolder.create();
        }
        
        // PSDファイル取得
        var files = inputFolder.getFiles(/\.psd$/i);
        
        if (files.length == 0) {
            alert("処理するPSDファイルがありません。");
            return;
        }
        
        // 背景色選択
        var selectedColor = selectBackgroundColor();
        if (!selectedColor) {
            alert("処理がキャンセルされました。");
            return;
        }
        
        log("選択された背景色: " + selectedColor.name + " " + selectedColor.hex);
        log("処理対象: " + files.length + "ファイル");
        
        var success = 0;
        var error = 0;
        var startTime = new Date();
        
        // 各ファイル処理
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            
            // 安全なファイル名を生成
            var colorSuffix = "";
            if (selectedColor.name === "白") {
                colorSuffix = "white";
            } else if (selectedColor.name === "ライトグレー") {
                colorSuffix = "lightgray";
            } else {
                colorSuffix = "custom";
            }
            
            var outputName = file.name.replace(/\.psd$/i, "_bg_" + colorSuffix + ".psd");
            var outputPath = outputFolder + "/" + outputName;
            
            log("(" + (i+1) + "/" + files.length + ") " + file.name);
            
            try {
                var doc = app.open(file);
                
                if (addBackgroundLayer(doc, selectedColor)) {
                    if (savePSD(doc, outputPath)) {
                        success++;
                    } else {
                        error++;
                    }
                } else {
                    error++;
                }
                
                doc.close(SaveOptions.DONOTSAVECHANGES);
                
            } catch (e) {
                log("ファイルエラー: " + e.toString());
                error++;
            }
        }
        
        var endTime = new Date();
        var totalSeconds = (endTime - startTime) / 1000;
        
        log("========== 完了 ==========");
        log("成功: " + success + ", エラー: " + error);
        log("処理時間: " + totalSeconds + "秒");
        
        var result = "背景色追加完了\n\n";
        result += "背景色: " + selectedColor.name + " (" + selectedColor.hex + ")\n";
        result += "成功: " + success + " ファイル\n";
        result += "エラー: " + error + " ファイル\n";
        result += "処理時間: " + totalSeconds + " 秒\n\n";
        result += "出力: " + outputFolder.fsName;
        
        alert(result);
        
    } catch (e) {
        log("メイン処理でエラー: " + e.toString());
        alert("エラーが発生しました: " + e.toString());
    }
}

// ========== 実行 ==========
main();