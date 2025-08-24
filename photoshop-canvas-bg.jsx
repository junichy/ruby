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
    var dialog = new Window("dialog", "キャンバスサイズ・配置・背景色の設定");
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
    
    // ========== 画像配置セクション ==========
    var positionPanel = dialog.add("panel", undefined, "画像配置設定");
    positionPanel.orientation = "column";
    positionPanel.alignChildren = "left";
    
    // 下部マージン
    var bottomMarginGroup = positionPanel.add("group");
    bottomMarginGroup.add("statictext", undefined, "下部マージン:");
    var bottomMarginInput = bottomMarginGroup.add("edittext", undefined, "253");
    bottomMarginInput.characters = 6;
    bottomMarginGroup.add("statictext", undefined, "px (画像下端からキャンバス下端)");
    
    // 左右マージン
    var sideMarginGroup = positionPanel.add("group");
    sideMarginGroup.add("statictext", undefined, "左右マージン:");
    var sideMarginInput = sideMarginGroup.add("edittext", undefined, "150");
    sideMarginInput.characters = 6;
    sideMarginGroup.add("statictext", undefined, "px (最小マージン)");
    
    // 配置オプション
    var positionOptionsGroup = positionPanel.add("group");
    var autoFitCheckbox = positionOptionsGroup.add("checkbox", undefined, "縦横比を保持して自動調整");
    autoFitCheckbox.value = true;
    
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
            bottomMargin: parseInt(bottomMarginInput.text),
            sideMargin: parseInt(sideMarginInput.text),
            autoFit: autoFitCheckbox.value,
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

// ========== マスクの境界を取得 ==========
function getMaskBounds(doc) {
    try {
        var activeLayer = doc.activeLayer;
        
        // まずレイヤーマスクの存在を確認
        var hasLayerMask = false;
        try {
            // レイヤーマスクを選択してみる
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
            desc.putReference(charIDToTypeID("null"), ref);
            desc.putBoolean(charIDToTypeID("MkVs"), false);
            executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
            hasLayerMask = true;
        } catch (e) {
            // マスクがない場合
            hasLayerMask = false;
        }
        
        if (hasLayerMask) {
            // マスクから選択範囲を作成
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
            desc.putReference(charIDToTypeID("null"), ref);
            var ref2 = new ActionReference();
            ref2.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
            desc.putReference(charIDToTypeID("T   "), ref2);
            executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
            
            // 選択範囲の境界を取得
            var bounds = doc.selection.bounds;
            
            // 選択解除
            doc.selection.deselect();
            
            // RGBチャンネルに戻す
            var desc2 = new ActionDescriptor();
            var ref3 = new ActionReference();
            ref3.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("RGB "));
            desc2.putReference(charIDToTypeID("null"), ref3);
            executeAction(charIDToTypeID("slct"), desc2, DialogModes.NO);
            
            log("マスク境界取得成功");
            return {
                left: bounds[0].value,
                top: bounds[1].value,
                right: bounds[2].value,
                bottom: bounds[3].value,
                width: bounds[2].value - bounds[0].value,
                height: bounds[3].value - bounds[1].value
            };
        } else {
            // マスクがない場合はレイヤーの境界を使用
            log("マスクなし - レイヤー境界を使用");
            var bounds = activeLayer.bounds;
            return {
                left: bounds[0].value,
                top: bounds[1].value,
                right: bounds[2].value,
                bottom: bounds[3].value,
                width: bounds[2].value - bounds[0].value,
                height: bounds[3].value - bounds[1].value
            };
        }
        
    } catch (e) {
        log("境界取得エラー - レイヤー境界を使用: " + e.toString());
        // エラー時はレイヤーの境界を返す
        var bounds = doc.activeLayer.bounds;
        return {
            left: bounds[0].value,
            top: bounds[1].value,
            right: bounds[2].value,
            bottom: bounds[3].value,
            width: bounds[2].value - bounds[0].value,
            height: bounds[3].value - bounds[1].value
        };
    }
}

// ========== キャンバスサイズ変更と画像配置 ==========
function resizeCanvasAndPosition(doc, settings) {
    try {
        log("キャンバスサイズ変更と配置開始: " + settings.width + "×" + settings.height + "px");
        log("配置設定 - 下部マージン: " + settings.bottomMargin + "px, 左右マージン: " + settings.sideMargin + "px");
        
        // 解像度を72dpiに設定
        doc.resizeImage(undefined, undefined, 72, ResampleMethod.NONE);
        
        // 現在のマスクまたはレイヤーの境界を取得
        var maskBounds = getMaskBounds(doc);
        log("マスク境界: " + maskBounds.width + "×" + maskBounds.height + "px");
        
        // 必要なスケールを計算
        var scale = 1.0;
        if (settings.autoFit) {
            // 横方向のスケール（左右マージンを考慮）
            var maxWidth = settings.width - (settings.sideMargin * 2);
            var scaleX = maxWidth / maskBounds.width;
            
            // 縦方向のスケール（下部マージンを考慮）
            var maxHeight = settings.height - settings.bottomMargin;
            var scaleY = maxHeight / maskBounds.height;
            
            // 小さい方のスケールを使用（縦横比を保持）
            scale = Math.min(scaleX, scaleY);
            
            log("計算されたスケール: " + scale);
        }
        
        // 画像をリサイズ（必要な場合）
        if (scale != 1.0) {
            var newWidth = doc.width.value * scale;
            var newHeight = doc.height.value * scale;
            doc.resizeImage(UnitValue(newWidth, "px"), UnitValue(newHeight, "px"), 72, ResampleMethod.BICUBIC);
            
            // リサイズ後の境界を再取得
            maskBounds = getMaskBounds(doc);
        }
        
        // キャンバスサイズを変更
        doc.resizeCanvas(
            UnitValue(settings.width, "px"),
            UnitValue(settings.height, "px"),
            AnchorPosition.TOPLEFT
        );
        
        // 画像を配置（下部マージンと左右中央）
        var targetX = (settings.width - maskBounds.width) / 2;
        var targetY = settings.height - settings.bottomMargin - maskBounds.height;
        
        // 現在の位置から移動量を計算
        var deltaX = targetX - maskBounds.left;
        var deltaY = targetY - maskBounds.top;
        
        // レイヤーを移動
        doc.activeLayer.translate(deltaX, deltaY);
        
        log("画像配置完了 - X: " + targetX + ", Y: " + targetY);
        return true;
        
    } catch (e) {
        log("キャンバスサイズ変更と配置エラー: " + e.toString());
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
        log("  画像配置 - 下部マージン: " + settings.bottomMargin + "px, 左右マージン: " + settings.sideMargin + "px");
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
                
                // キャンバスサイズ変更と画像配置
                if (resizeCanvasAndPosition(doc, settings)) {
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