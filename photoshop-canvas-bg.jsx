// Photoshop キャンバスサイズ設定＋背景色追加スクリプト - 統合版
// PSDファイルのキャンバスサイズ変更、中央配置、背景色追加を一括処理

// ========== 設定 ==========
var CANVAS_CONFIG = {
    inputFolderName: "bg_color_input",
    outputFolderName: "bg_color_output",
    defaultWidth: 2210,
    defaultHeight: 3315,
    resolution: 72,
    presetSizes: [
        { name: "デフォルト (2210×3315)", width: 2210, height: 3315 },
        { name: "A4サイズ (2480×3508)", width: 2480, height: 3508 },
        { name: "正方形 (3000×3000)", width: 3000, height: 3000 },
        { name: "横長 (3315×2210)", width: 3315, height: 2210 },
        { name: "カスタム", width: 0, height: 0 }
    ],
    backgroundColors: [
        { name: "白", hex: "#FFFFFF", rgb: [255, 255, 255] },
        { name: "ライトグレー", hex: "#F6F6F6", rgb: [246, 246, 246] },
        { name: "カスタム", hex: "", rgb: [128, 128, 128] }
    ],
    showProgress: true
};

// ========== グローバル変数 ==========
var scriptFolder = new File($.fileName).parent;
var inputFolder = new Folder(scriptFolder + "/" + CANVAS_CONFIG.inputFolderName);
var outputFolder = new Folder(scriptFolder + "/" + CANVAS_CONFIG.outputFolderName);

// ========== ログ ==========
function log(message) {
    var logMessage = "[" + new Date().toLocaleTimeString() + "] " + message;
    $.writeln(logMessage);
    
    try {
        var logFile = new File(scriptFolder + "/canvas-bg-debug.log");
        logFile.open("a");
        logFile.writeln(logMessage);
        logFile.close();
    } catch (e) {
        // ログファイル書き込みエラーは無視
    }
}

// ========== 統合設定ダイアログ ==========
function showSettingsDialog() {
    var dialog = new Window("dialog", "キャンバスサイズと背景色の設定");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    
    // ========== キャンバスサイズセクション ==========
    var sizePanel = dialog.add("panel", undefined, "キャンバスサイズ設定");
    sizePanel.orientation = "column";
    sizePanel.alignChildren = "left";
    
    // プリセット選択
    var presetGroup = sizePanel.add("group");
    presetGroup.add("statictext", undefined, "プリセット:");
    var presetDropdown = presetGroup.add("dropdownlist");
    for (var i = 0; i < CANVAS_CONFIG.presetSizes.length; i++) {
        presetDropdown.add("item", CANVAS_CONFIG.presetSizes[i].name);
    }
    presetDropdown.selection = 0; // デフォルト選択
    
    // カスタムサイズ入力
    var customSizeGroup = sizePanel.add("group");
    customSizeGroup.enabled = false; // 初期は無効
    
    customSizeGroup.add("statictext", undefined, "幅:");
    var widthInput = customSizeGroup.add("edittext", undefined, String(CANVAS_CONFIG.defaultWidth));
    widthInput.characters = 8;
    
    customSizeGroup.add("statictext", undefined, "高さ:");
    var heightInput = customSizeGroup.add("edittext", undefined, String(CANVAS_CONFIG.defaultHeight));
    heightInput.characters = 8;
    
    customSizeGroup.add("statictext", undefined, "px");
    
    // 解像度表示
    var resolutionGroup = sizePanel.add("group");
    resolutionGroup.add("statictext", undefined, "解像度: 72 dpi (固定)");
    
    // ========== 背景色セクション ==========
    var colorPanel = dialog.add("panel", undefined, "背景色設定");
    colorPanel.orientation = "column";
    colorPanel.alignChildren = "left";
    
    var radioButtons = [];
    for (var i = 0; i < CANVAS_CONFIG.backgroundColors.length; i++) {
        var color = CANVAS_CONFIG.backgroundColors[i];
        var radio = colorPanel.add("radiobutton", undefined, color.name + " (" + color.hex + ")");
        if (i === 0) radio.value = true; // 最初の色をデフォルト選択
        radioButtons.push(radio);
    }
    
    // カスタム色入力
    var customColorGroup = colorPanel.add("group");
    customColorGroup.add("statictext", undefined, "カスタム色 (16進数):");
    var customColorInput = customColorGroup.add("edittext", undefined, "#F6F6F6");
    customColorInput.characters = 10;
    
    // ========== ボタン ==========
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    var okButton = buttonGroup.add("button", undefined, "OK");
    var cancelButton = buttonGroup.add("button", undefined, "キャンセル");
    
    // ========== イベントハンドラ ==========
    presetDropdown.onChange = function() {
        var isCustom = presetDropdown.selection.index === CANVAS_CONFIG.presetSizes.length - 1;
        customSizeGroup.enabled = isCustom;
        
        if (!isCustom) {
            var preset = CANVAS_CONFIG.presetSizes[presetDropdown.selection.index];
            widthInput.text = String(preset.width);
            heightInput.text = String(preset.height);
        }
    };
    
    okButton.onClick = function() {
        dialog.close(1);
    };
    
    cancelButton.onClick = function() {
        dialog.close(0);
    };
    
    // ダイアログ表示
    var result = dialog.show();
    if (result === 1) {
        // 設定値を返す
        var settings = {
            width: parseInt(widthInput.text),
            height: parseInt(heightInput.text),
            backgroundColor: null
        };
        
        // 選択された背景色を取得
        for (var i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].value) {
                if (i === CANVAS_CONFIG.backgroundColors.length - 1) {
                    // カスタム色
                    settings.backgroundColor = {
                        name: "カスタム",
                        hex: customColorInput.text,
                        rgb: hexToRgb(customColorInput.text)
                    };
                } else {
                    settings.backgroundColor = CANVAS_CONFIG.backgroundColors[i];
                }
                break;
            }
        }
        
        return settings;
    }
    return null; // キャンセル
}

// ========== 16進数からRGB変換 ==========
function hexToRgb(hex) {
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

// ========== キャンバスサイズ変更と中央配置 ==========
function resizeCanvasAndCenter(doc, width, height) {
    try {
        log("キャンバスサイズ変更開始: " + width + "×" + height + "px");
        
        // 現在の画像サイズを記録
        var originalWidth = doc.width.value;
        var originalHeight = doc.height.value;
        
        // 解像度を72dpiに設定
        doc.resizeImage(undefined, undefined, 72, ResampleMethod.NONE);
        
        // キャンバスサイズを変更（中央配置）
        doc.resizeCanvas(
            UnitValue(width, "px"),
            UnitValue(height, "px"),
            AnchorPosition.MIDDLECENTER
        );
        
        log("キャンバスサイズ変更完了");
        return true;
        
    } catch (e) {
        log("キャンバスサイズ変更エラー: " + e.toString());
        return false;
    }
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
        
        log("背景レイヤー追加完了");
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
        
        // 標準のsaveAsを最初に使用（より安定）
        var options = new PhotoshopSaveOptions();
        options.layers = true;
        options.embedColorProfile = true;
        options.alphaChannels = true;
        
        doc.saveAs(file, options, true);
        log("PSD保存成功: " + file.name);
        return true;
        
    } catch (e) {
        log("PSD保存エラー: " + e.toString());
        
        // 代替手段: 最小限のオプションで再試行
        try {
            log("最小オプションで再試行...");
            var simpleOptions = new PhotoshopSaveOptions();
            doc.saveAs(file, simpleOptions, true);
            log("再保存成功: " + file.name);
            return true;
        } catch (e2) {
            log("全ての保存方法が失敗: " + e2.toString());
            return false;
        }
    }
}

// ========== メイン処理 ==========
function main() {
    try {
        app.displayDialogs = DialogModes.NO;
        app.preferences.rulerUnits = Units.PIXELS;
        
        log("========== Photoshop キャンバスサイズ＋背景色追加開始 ==========");
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
        
        // 設定ダイアログ表示
        var settings = showSettingsDialog();
        if (!settings) {
            alert("処理がキャンセルされました。");
            return;
        }
        
        log("選択された設定:");
        log("  キャンバスサイズ: " + settings.width + "×" + settings.height + "px");
        log("  背景色: " + settings.backgroundColor.name + " " + settings.backgroundColor.hex);
        log("処理対象: " + files.length + "ファイル");
        
        var success = 0;
        var error = 0;
        var startTime = new Date();
        
        // 各ファイル処理
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            
            // 安全なファイル名を生成
            var colorSuffix = "";
            if (settings.backgroundColor.name === "白") {
                colorSuffix = "white";
            } else if (settings.backgroundColor.name === "ライトグレー") {
                colorSuffix = "lightgray";
            } else {
                colorSuffix = "custom";
            }
            
            var sizeSuffix = settings.width + "x" + settings.height;
            var outputName = file.name.replace(/\.psd$/i, "_" + sizeSuffix + "_" + colorSuffix + ".psd");
            var outputPath = outputFolder + "/" + outputName;
            
            log("(" + (i+1) + "/" + files.length + ") " + file.name);
            
            try {
                var doc = app.open(file);
                
                // キャンバスサイズ変更と中央配置
                if (resizeCanvasAndCenter(doc, settings.width, settings.height)) {
                    // 背景レイヤー追加
                    if (addBackgroundLayer(doc, settings.backgroundColor)) {
                        // PSD保存
                        if (savePSD(doc, outputPath)) {
                            success++;
                        } else {
                            error++;
                        }
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
        
        var result = "キャンバスサイズ変更＋背景色追加完了\n\n";
        result += "キャンバス: " + settings.width + "×" + settings.height + "px\n";
        result += "背景色: " + settings.backgroundColor.name + " (" + settings.backgroundColor.hex + ")\n";
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