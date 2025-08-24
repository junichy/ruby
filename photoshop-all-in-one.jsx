// Photoshop 統合処理スクリプト - All-in-One
// AI背景マスク作成 → キャンバスサイズ変更 → 画像配置 → 背景色追加を一括処理

// ========== 設定 ==========
var ALL_IN_ONE_CONFIG = {
    // フォルダ設定
    inputFolderName: "images",
    outputFolderName: "output",
    
    // キャンバス設定
    defaultCanvasWidth: 2210,
    defaultCanvasHeight: 3315,
    resolution: 72,
    
    // 画像配置設定
    defaultBottomMargin: 253,
    defaultSideMargin: 150,
    autoFit: true,
    
    // 背景色設定
    backgroundColors: [
        { name: "白", hex: "#FFFFFF", rgb: [255, 255, 255] },
        { name: "ライトグレー", hex: "#F6F6F6", rgb: [246, 246, 246] },
        { name: "カスタム", hex: "", rgb: [128, 128, 128] }
    ],
    
    // プリセットサイズ
    presetSizes: [
        { name: "デフォルト (2210×3315)", width: 2210, height: 3315 },
        { name: "A4サイズ (2480×3508)", width: 2480, height: 3508 },
        { name: "正方形 (3000×3000)", width: 3000, height: 3000 },
        { name: "横長 (3315×2210)", width: 3315, height: 2210 },
        { name: "カスタム", width: 0, height: 0 }
    ],
    
    showProgress: true
};

// ========== グローバル変数 ==========
var scriptFolder = new File($.fileName).parent;
var inputFolder = new Folder(scriptFolder + "/" + ALL_IN_ONE_CONFIG.inputFolderName);
var outputFolder = new Folder(scriptFolder + "/" + ALL_IN_ONE_CONFIG.outputFolderName);

// ========== ログ ==========
function log(message) {
    var logMessage = "[" + new Date().toLocaleTimeString() + "] " + message;
    $.writeln(logMessage);
    
    try {
        var logFile = new File(scriptFolder + "/all-in-one-debug.log");
        logFile.open("a");
        logFile.writeln(logMessage);
        logFile.close();
    } catch (e) {
        // ログファイル書き込みエラーは無視
    }
}

// ========== 統合設定ダイアログ ==========
function showAllInOneDialog() {
    var dialog = new Window("dialog", "統合処理設定 - 切り抜きから背景色追加まで");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    
    // ========== 処理選択セクション ==========
    var processPanel = dialog.add("panel", undefined, "処理選択");
    processPanel.orientation = "column";
    processPanel.alignChildren = "left";
    
    var maskCheckbox = processPanel.add("checkbox", undefined, "AI背景マスク作成");
    maskCheckbox.value = true;
    
    var resizeCheckbox = processPanel.add("checkbox", undefined, "キャンバスサイズ変更と画像配置");
    resizeCheckbox.value = true;
    
    var bgColorCheckbox = processPanel.add("checkbox", undefined, "背景色追加");
    bgColorCheckbox.value = true;
    
    // ========== キャンバスサイズセクション ==========
    var sizePanel = dialog.add("panel", undefined, "キャンバスサイズ設定");
    sizePanel.orientation = "column";
    sizePanel.alignChildren = "left";
    
    // プリセット選択
    var presetGroup = sizePanel.add("group");
    presetGroup.add("statictext", undefined, "プリセット:");
    var presetDropdown = presetGroup.add("dropdownlist");
    for (var i = 0; i < ALL_IN_ONE_CONFIG.presetSizes.length; i++) {
        presetDropdown.add("item", ALL_IN_ONE_CONFIG.presetSizes[i].name);
    }
    presetDropdown.selection = 0;
    
    // カスタムサイズ入力
    var customSizeGroup = sizePanel.add("group");
    customSizeGroup.enabled = false;
    
    customSizeGroup.add("statictext", undefined, "幅:");
    var widthInput = customSizeGroup.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultCanvasWidth));
    widthInput.characters = 8;
    
    customSizeGroup.add("statictext", undefined, "高さ:");
    var heightInput = customSizeGroup.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultCanvasHeight));
    heightInput.characters = 8;
    
    customSizeGroup.add("statictext", undefined, "px");
    
    // ========== 画像配置セクション ==========
    var positionPanel = dialog.add("panel", undefined, "画像配置設定");
    positionPanel.orientation = "column";
    positionPanel.alignChildren = "left";
    
    // 下部マージン
    var bottomMarginGroup = positionPanel.add("group");
    bottomMarginGroup.add("statictext", undefined, "下部マージン:");
    var bottomMarginInput = bottomMarginGroup.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultBottomMargin));
    bottomMarginInput.characters = 6;
    bottomMarginGroup.add("statictext", undefined, "px");
    
    // 左右マージン
    var sideMarginGroup = positionPanel.add("group");
    sideMarginGroup.add("statictext", undefined, "左右マージン:");
    var sideMarginInput = sideMarginGroup.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultSideMargin));
    sideMarginInput.characters = 6;
    sideMarginGroup.add("statictext", undefined, "px");
    
    // 配置オプション
    var autoFitCheckbox = positionPanel.add("checkbox", undefined, "縦横比を保持して自動調整");
    autoFitCheckbox.value = ALL_IN_ONE_CONFIG.autoFit;
    
    // ========== 影生成セクション ==========
    var shadowPanel = dialog.add("panel", undefined, "影生成設定（オプション）");
    shadowPanel.orientation = "column";
    shadowPanel.alignChildren = "left";
    
    var shadowCheckbox = shadowPanel.add("checkbox", undefined, "商品の影を生成");
    shadowCheckbox.value = false;
    
    var shadowOptionsGroup = shadowPanel.add("group");
    shadowOptionsGroup.enabled = false;
    shadowOptionsGroup.orientation = "column";
    shadowOptionsGroup.alignChildren = "left";
    
    var shadowBlurGroup = shadowOptionsGroup.add("group");
    shadowBlurGroup.add("statictext", undefined, "境界ぼかし:");
    var shadowBlurInput = shadowBlurGroup.add("edittext", undefined, "450");
    shadowBlurInput.characters = 4;
    shadowBlurGroup.add("statictext", undefined, "px (下部境界)");
    
    var shadowLevelsGroup = shadowOptionsGroup.add("group");
    shadowLevelsGroup.add("statictext", undefined, "ハイライト:");
    var shadowLevelsInput = shadowLevelsGroup.add("edittext", undefined, "215");
    shadowLevelsInput.characters = 4;
    shadowLevelsGroup.add("statictext", undefined, "(レベル補正)");
    
    // ========== 背景色セクション ==========
    var colorPanel = dialog.add("panel", undefined, "背景色設定");
    colorPanel.orientation = "column";
    colorPanel.alignChildren = "left";
    
    var radioButtons = [];
    for (var i = 0; i < ALL_IN_ONE_CONFIG.backgroundColors.length; i++) {
        var color = ALL_IN_ONE_CONFIG.backgroundColors[i];
        var radio = colorPanel.add("radiobutton", undefined, color.name + " (" + color.hex + ")");
        if (i === 0) radio.value = true;
        radioButtons.push(radio);
    }
    
    // カスタム色入力
    var customColorGroup = colorPanel.add("group");
    customColorGroup.add("statictext", undefined, "カスタム色:");
    var customColorInput = customColorGroup.add("edittext", undefined, "#F6F6F6");
    customColorInput.characters = 10;
    
    // ========== ボタン ==========
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    var okButton = buttonGroup.add("button", undefined, "処理開始");
    var cancelButton = buttonGroup.add("button", undefined, "キャンセル");
    
    // ========== イベントハンドラ ==========
    presetDropdown.onChange = function() {
        var isCustom = presetDropdown.selection.index === ALL_IN_ONE_CONFIG.presetSizes.length - 1;
        customSizeGroup.enabled = isCustom;
        
        if (!isCustom) {
            var preset = ALL_IN_ONE_CONFIG.presetSizes[presetDropdown.selection.index];
            widthInput.text = String(preset.width);
            heightInput.text = String(preset.height);
        }
    };
    
    resizeCheckbox.onClick = function() {
        sizePanel.enabled = resizeCheckbox.value;
        positionPanel.enabled = resizeCheckbox.value;
    };
    
    bgColorCheckbox.onClick = function() {
        colorPanel.enabled = bgColorCheckbox.value;
    };
    
    shadowCheckbox.onClick = function() {
        shadowOptionsGroup.enabled = shadowCheckbox.value;
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
        var settings = {
            processMask: maskCheckbox.value,
            processResize: resizeCheckbox.value,
            processBgColor: bgColorCheckbox.value,
            processShadow: shadowCheckbox.value,
            width: parseInt(widthInput.text),
            height: parseInt(heightInput.text),
            bottomMargin: parseInt(bottomMarginInput.text),
            sideMargin: parseInt(sideMarginInput.text),
            autoFit: autoFitCheckbox.value,
            shadowBlur: parseInt(shadowBlurInput.text),
            shadowHighlight: parseInt(shadowLevelsInput.text),
            backgroundColor: null
        };
        
        // 選択された背景色を取得
        for (var i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].value) {
                if (i === ALL_IN_ONE_CONFIG.backgroundColors.length - 1) {
                    settings.backgroundColor = {
                        name: "カスタム",
                        hex: customColorInput.text,
                        rgb: hexToRgb(customColorInput.text)
                    };
                } else {
                    settings.backgroundColor = ALL_IN_ONE_CONFIG.backgroundColors[i];
                }
                break;
            }
        }
        
        return settings;
    }
    return null;
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
    return [128, 128, 128];
}

// ========== AI背景マスク作成 ==========
function createBackgroundMask(doc) {
    try {
        log("AI背景マスク作成開始: " + doc.name);
        
        // ドキュメント準備
        if (doc.mode != DocumentMode.RGB) {
            doc.changeMode(ChangeMode.RGB);
        }
        if (doc.bitsPerChannel != BitsPerChannelType.EIGHT) {
            doc.bitsPerChannel = BitsPerChannelType.EIGHT;
        }
        if (doc.activeLayer.isBackgroundLayer) {
            doc.activeLayer.isBackgroundLayer = false;
            doc.activeLayer.name = "Original Layer";
        }
        
        // 被写体を選択（AI）
        try {
            selectSubject(doc);
            log("被写体選択成功");
        } catch (e) {
            log("被写体選択エラー: " + e.toString());
            return false;
        }
        
        // レイヤーマスクを追加
        try {
            var idMk = charIDToTypeID("Mk  ");
            var desc = new ActionDescriptor();
            var idNw = charIDToTypeID("Nw  ");
            var idChnl = charIDToTypeID("Chnl");
            desc.putClass(idNw, idChnl);
            var idAt = charIDToTypeID("At  ");
            var ref = new ActionReference();
            var idChnl = charIDToTypeID("Chnl");
            var idMsk = charIDToTypeID("Msk ");
            ref.putEnumerated(idChnl, idChnl, idMsk);
            var idLyr = charIDToTypeID("Lyr ");
            var idOrdn = charIDToTypeID("Ordn");
            var idTrgt = charIDToTypeID("Trgt");
            ref.putEnumerated(idLyr, idOrdn, idTrgt);
            desc.putReference(idAt, ref);
            var idUsng = charIDToTypeID("Usng");
            var idUsrMskType = stringIDToTypeID("userMaskType");
            var idRvlS = charIDToTypeID("RvlS");
            desc.putEnumerated(idUsng, idUsrMskType, idRvlS);
            executeAction(idMk, desc, DialogModes.NO);
            
            log("レイヤーマスク追加成功");
        } catch (e) {
            log("レイヤーマスク追加エラー: " + e.toString());
            return false;
        }
        
        // 選択解除
        doc.selection.deselect();
        
        log("AI背景マスク作成完了");
        return true;
        
    } catch (e) {
        log("背景マスク作成エラー: " + e.toString());
        return false;
    }
}

// ========== 被写体を選択（AI機能） ==========
function selectSubject(doc) {
    var idautoCutout = stringIDToTypeID("autoCutout");
    var desc = new ActionDescriptor();
    desc.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
    
    try {
        executeAction(idautoCutout, desc, DialogModes.NO);
    } catch (e) {
        try {
            var idAS = stringIDToTypeID("autoCutout");
            var desc2 = new ActionDescriptor();
            desc2.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
            executeAction(idAS, desc2, DialogModes.NO);
        } catch (e2) {
            try {
                var idSelectSubject = charIDToTypeID("SlSb");
                executeAction(idSelectSubject, undefined, DialogModes.NO);
            } catch (e3) {
                executeQuickAction();
            }
        }
    }
}

// ========== クイックアクション実行 ==========
function executeQuickAction() {
    var idQckA = stringIDToTypeID("quickAction");
    var desc = new ActionDescriptor();
    var idActn = stringIDToTypeID("action");
    desc.putString(idActn, "removeBackground");
    executeAction(idQckA, desc, DialogModes.NO);
}

// ========== マスクの境界を取得 ==========
function getMaskBounds(doc) {
    try {
        var activeLayer = doc.activeLayer;
        
        var hasLayerMask = false;
        try {
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
            desc.putReference(charIDToTypeID("null"), ref);
            desc.putBoolean(charIDToTypeID("MkVs"), false);
            executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
            hasLayerMask = true;
        } catch (e) {
            hasLayerMask = false;
        }
        
        if (hasLayerMask) {
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
            desc.putReference(charIDToTypeID("null"), ref);
            var ref2 = new ActionReference();
            ref2.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
            desc.putReference(charIDToTypeID("T   "), ref2);
            executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
            
            var bounds = doc.selection.bounds;
            doc.selection.deselect();
            
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
        log("境界取得エラー: " + e.toString());
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
        log("キャンバスサイズ変更と配置開始");
        
        // 解像度を72dpiに設定
        doc.resizeImage(undefined, undefined, 72, ResampleMethod.NONE);
        
        // マスクまたはレイヤーの境界を取得
        var maskBounds = getMaskBounds(doc);
        log("境界: " + maskBounds.width + "×" + maskBounds.height + "px");
        
        // 必要なスケールを計算
        var scale = 1.0;
        if (settings.autoFit) {
            var maxWidth = settings.width - (settings.sideMargin * 2);
            var scaleX = maxWidth / maskBounds.width;
            
            var maxHeight = settings.height - settings.bottomMargin;
            var scaleY = maxHeight / maskBounds.height;
            
            scale = Math.min(scaleX, scaleY);
            log("スケール: " + scale);
        }
        
        // 画像をリサイズ
        if (scale != 1.0) {
            var newWidth = doc.width.value * scale;
            var newHeight = doc.height.value * scale;
            doc.resizeImage(UnitValue(newWidth, "px"), UnitValue(newHeight, "px"), 72, ResampleMethod.BICUBIC);
            maskBounds = getMaskBounds(doc);
        }
        
        // キャンバスサイズを変更
        doc.resizeCanvas(
            UnitValue(settings.width, "px"),
            UnitValue(settings.height, "px"),
            AnchorPosition.TOPLEFT
        );
        
        // 画像を配置
        var targetX = (settings.width - maskBounds.width) / 2;
        var targetY = settings.height - settings.bottomMargin - maskBounds.height;
        
        var deltaX = targetX - maskBounds.left;
        var deltaY = targetY - maskBounds.top;
        
        doc.activeLayer.translate(deltaX, deltaY);
        
        log("画像配置完了");
        return true;
        
    } catch (e) {
        log("キャンバスサイズ変更エラー: " + e.toString());
        return false;
    }
}

// ========== 影生成 ==========
function createShadow(doc, settings) {
    try {
        log("影生成開始");
        
        // 元のマスク付きレイヤーを取得
        var originalLayer = doc.activeLayer;
        var originalLayerName = originalLayer.name;
        
        // マスクレイヤーをコピー
        var shadowLayer = originalLayer.duplicate();
        shadowLayer.name = "Shadow " + originalLayerName;
        
        // 影レイヤーを元レイヤーの下に移動
        shadowLayer.move(originalLayer, ElementPlacement.PLACEAFTER);
        
        // 影レイヤーをアクティブにする
        doc.activeLayer = shadowLayer;
        
        // 影レイヤーのブレンドモードを乗算に変更
        shadowLayer.blendMode = BlendMode.MULTIPLY;
        
        log("影レイヤー作成完了");
        
        // マスクにぼかしを適用（下部境界）
        try {
            // マスクチャンネルを選択
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
            desc.putReference(charIDToTypeID("null"), ref);
            executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
            
            // ガウシアンブラーを適用（下部境界に重点）
            var blurRadius = settings.shadowBlur; // 直接ピクセル値を使用
            var idGsnB = charIDToTypeID("GsnB");
            var desc2 = new ActionDescriptor();
            var idRds = charIDToTypeID("Rds ");
            desc2.putUnitDouble(idRds, charIDToTypeID("#Pxl"), blurRadius);
            executeAction(idGsnB, desc2, DialogModes.NO);
            
            // RGBチャンネルに戻す
            var desc3 = new ActionDescriptor();
            var ref2 = new ActionReference();
            ref2.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("RGB "));
            desc3.putReference(charIDToTypeID("null"), ref2);
            executeAction(charIDToTypeID("slct"), desc3, DialogModes.NO);
            
            log("マスクぼかし適用完了: " + blurRadius + "px");
            
        } catch (e) {
            log("マスクぼかしエラー: " + e.toString());
        }
        
        // レベル補正を適用（ハイライトを下げる） - オプション
        try {
            // より簡単なレベル補正方法を試す
            var idLvls = charIDToTypeID("Lvls");
            var desc4 = new ActionDescriptor();
            var idAdjs = charIDToTypeID("Adjs");
            var list = new ActionList();
            var desc5 = new ActionDescriptor();
            var idChnl = charIDToTypeID("Chnl");
            var ref3 = new ActionReference();
            ref3.putEnumerated(idChnl, idChnl, charIDToTypeID("Cmps"));
            desc5.putReference(idChnl, ref3);
            var idInpt = charIDToTypeID("Inpt");
            var list2 = new ActionList();
            list2.putInteger(0);           // シャドウ
            list2.putDouble(1.0);          // ガンマ
            list2.putInteger(settings.shadowHighlight); // ハイライト
            desc5.putList(idInpt, list2);
            list.putObject(charIDToTypeID("LvlA"), desc5);
            desc4.putList(idAdjs, list);
            executeAction(idLvls, desc4, DialogModes.NO);
            
            log("レベル補正適用完了: ハイライト " + settings.shadowHighlight);
            
        } catch (e) {
            // レベル補正が失敗してもログに残すが、処理は継続
            log("レベル補正をスキップ（このバージョンでは対応していない機能）: " + e.message);
        }
        
        // 元のレイヤーをアクティブに戻す
        doc.activeLayer = originalLayer;
        
        log("影生成完了");
        return true;
        
    } catch (e) {
        log("影生成エラー: " + e.toString());
        return false;
    }
}

// ========== 背景レイヤー追加 ==========
function addBackgroundLayer(doc, color) {
    try {
        log("背景レイヤー追加開始: " + color.name);
        
        var bgLayer = doc.artLayers.add();
        bgLayer.name = "Background " + color.name;
        bgLayer.move(doc, ElementPlacement.PLACEATEND);
        
        var fillColor = new SolidColor();
        fillColor.rgb.red = color.rgb[0];
        fillColor.rgb.green = color.rgb[1];
        fillColor.rgb.blue = color.rgb[2];
        
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
        var options = new PhotoshopSaveOptions();
        options.layers = true;
        options.embedColorProfile = true;
        options.alphaChannels = true;
        
        doc.saveAs(file, options, true);
        log("PSD保存成功");
        return true;
        
    } catch (e) {
        log("PSD保存エラー: " + e.toString());
        
        try {
            log("最小オプションで再試行...");
            var simpleOptions = new PhotoshopSaveOptions();
            doc.saveAs(file, simpleOptions, true);
            log("再保存成功");
            return true;
        } catch (e2) {
            log("保存失敗: " + e2.toString());
            return false;
        }
    }
}

// ========== メイン処理 ==========
function main() {
    try {
        app.displayDialogs = DialogModes.NO;
        app.preferences.rulerUnits = Units.PIXELS;
        
        log("========== Photoshop 統合処理開始 ==========");
        log("Photoshopバージョン: " + app.version);
        
        // フォルダ確認
        if (!inputFolder.exists) {
            alert("imagesフォルダが見つかりません。\nimagesフォルダに画像を配置してください。");
            return;
        }
        if (!outputFolder.exists) {
            outputFolder.create();
        }
        
        // 画像ファイル取得
        var files = inputFolder.getFiles(/\.(jpg|jpeg|png|tif|tiff|bmp)$/i);
        
        if (files.length == 0) {
            alert("処理する画像がありません。\nimagesフォルダに画像を配置してください。");
            return;
        }
        
        // 設定ダイアログ表示
        var settings = showAllInOneDialog();
        if (!settings) {
            alert("処理がキャンセルされました。");
            return;
        }
        
        log("選択された設定:");
        log("  処理: マスク=" + settings.processMask + ", リサイズ=" + settings.processResize + ", 影=" + settings.processShadow + ", 背景色=" + settings.processBgColor);
        if (settings.processResize) {
            log("  キャンバス: " + settings.width + "×" + settings.height + "px");
            log("  配置: 下部=" + settings.bottomMargin + "px, 左右=" + settings.sideMargin + "px");
        }
        if (settings.processShadow) {
            log("  影: ぼかし=" + settings.shadowBlur + "px, ハイライト=" + settings.shadowHighlight);
        }
        if (settings.processBgColor) {
            log("  背景色: " + settings.backgroundColor.name + " " + settings.backgroundColor.hex);
        }
        log("処理対象: " + files.length + "ファイル");
        
        var success = 0;
        var error = 0;
        var startTime = new Date();
        
        // 各ファイル処理
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            
            // 出力ファイル名生成
            var outputName = file.name.replace(/\.[^.]+$/, "");
            if (settings.processMask) outputName += "_masked";
            if (settings.processResize) outputName += "_" + settings.width + "x" + settings.height;
            if (settings.processShadow) outputName += "_shadow";
            if (settings.processBgColor) {
                var colorSuffix = "";
                if (settings.backgroundColor.name === "白") {
                    colorSuffix = "white";
                } else if (settings.backgroundColor.name === "ライトグレー") {
                    colorSuffix = "lightgray";
                } else {
                    colorSuffix = "custom";
                }
                outputName += "_" + colorSuffix;
            }
            outputName += ".psd";
            
            var outputPath = outputFolder + "/" + outputName;
            
            log("(" + (i+1) + "/" + files.length + ") " + file.name + " → " + outputName);
            
            try {
                var doc = app.open(file);
                var processSuccess = true;
                
                // 1. AI背景マスク作成
                if (settings.processMask && processSuccess) {
                    processSuccess = createBackgroundMask(doc);
                }
                
                // 2. キャンバスサイズ変更と画像配置
                if (settings.processResize && processSuccess) {
                    processSuccess = resizeCanvasAndPosition(doc, settings);
                }
                
                // 3. 影生成
                if (settings.processShadow && processSuccess) {
                    processSuccess = createShadow(doc, settings);
                }
                
                // 4. 背景色追加
                if (settings.processBgColor && processSuccess) {
                    processSuccess = addBackgroundLayer(doc, settings.backgroundColor);
                }
                
                // 5. PSD保存
                if (processSuccess) {
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
        
        var result = "統合処理完了\n\n";
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