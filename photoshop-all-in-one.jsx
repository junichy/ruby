// Photoshop 統合処理スクリプト - All-in-One
// AI背景マスク作成 → キャンバスサイズ変更 → 画像配置 → 背景色追加を一括処理

// ========== 設定 ==========
var ALL_IN_ONE_CONFIG = {
    // フォルダ設定
    inputFolderName: "images",
    outputFolderName: "output",
    
    // キャンバス設定
    defaultCanvasWidth: 2210,
    defaultCanvasHeight: 2975,
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
    
    // ブランド設定（キャンバスサイズと背景色）
    brands: [
        {
            name: "Michael Kors",
            width: 2210,
            height: 2975,
            defaultBgColor: 1 // ライトグレー
        }
    ],
    
    // 商品カテゴリーとカット設定（画像配置）
    // positioning: "bottom-side" = 下部マージン + 左右マージン
    // positioning: "bottom-top" = 下部マージン + 上部マージン（Y軸の中央配置）
    categories: [
        {
            name: "シューズ",
            cuts: [
                {
                    name: "正面",
                    positioning: "bottom-side",  // パターン1: 下部＋左右マージン
                    bottomMargin: 253,
                    sideMargin: 150
                }
            ]
        },
        {
            name: "二つ折り財布・ミニ財布",
            cuts: [
                {
                    name: "正面・背面・斜め",
                    positioning: "bottom-top",    // パターン2: 下部＋上部マージン
                    topMargin: 1933,
                    bottomMargin: 230
                },
                {
                    name: "俯瞰",
                    positioning: "center-asymmetric", // パターン3: 高さセンター＋左右非対称マージン
                    leftMargin: 513,
                    rightMargin: 415
                    // 高さセンター合わせのため、topMargin/bottomMarginは指定しない（自動中央配置）
                },
                {
                    name: "開き",
                    positioning: "center-symmetric", // パターン4: 高さセンター＋左右対称マージン
                    sideMargin: 418
                    // 高さセンター合わせのため、topMargin/bottomMarginは指定しない（自動中央配置）
                }
            ]
        }
        // ここに今後追加される商品カテゴリー例：
        // {
        //     name: "長財布",
        //     cuts: [
        //         { name: "正面", positioning: "bottom-top", topMargin: 1500, bottomMargin: 200 },
        //         { name: "俯瞰", positioning: "center-asymmetric", leftMargin: 263, rightMargin: 213, topMargin: 1200, bottomMargin: 300 }
        //     ]
        // },
        // {
        //     name: "バッグ",
        //     cuts: [
        //         { name: "正面", positioning: "bottom-side", bottomMargin: 300, sideMargin: 200 },
        //         { name: "側面", positioning: "bottom-side", bottomMargin: 300, sideMargin: 250 },
        //         { name: "上から", positioning: "bottom-top", topMargin: 1000, bottomMargin: 500 }
        //     ]
        // }
    ],
    
    // カスタム設定
    customPreset: { name: "カスタム（手動入力）", width: 0, height: 0, defaultBgColor: 0 },
    
    showProgress: true
};

// ========== グローバル変数 ==========
var scriptFolder = new File($.fileName).parent;
var inputFolder = new Folder(scriptFolder + "/" + ALL_IN_ONE_CONFIG.inputFolderName);
var outputFolder = new Folder(scriptFolder + "/" + ALL_IN_ONE_CONFIG.outputFolderName);

// ========== DialogModes互換性ヘルパー ==========
function safeSetDisplayDialogs() {
    try {
        app.displayDialogs = DialogModes.NO;
        log("DialogModes.NO使用成功");
        return true;
    } catch (e) {
        log("DialogModes.NO使用不可、ダイアログ表示を継続: " + e.toString());
        return false;
    }
}

function getDialogModeNO() {
    // executeActionでDialogModes.NOが必要な場合の安全な値
    try {
        return DialogModes.NO;
    } catch (e) {
        // DialogModesが使用できない場合は文字列を返す（Photoshopが解釈可能）
        log("DialogModes.NO取得失敗、文字列'NO'を返します");
        return "NO";
    }
}

function safeExecuteAction(actionID, descriptor, dialogMode) {
    try {
        if (dialogMode !== undefined) {
            executeAction(actionID, descriptor, dialogMode);
        } else {
            executeAction(actionID, descriptor);
        }
    } catch (e) {
        // DialogModeでエラーの場合、DialogMode無しで実行
        log("DialogMode付き実行失敗、Dialog無しで再実行: " + e.toString());
        try {
            executeAction(actionID, descriptor);
        } catch (e2) {
            throw e2; // 再実行でもエラーの場合は元のエラーを投げる
        }
    }
}

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
    try {
        var startTime = new Date().getTime();
        log("ダイアログ作成開始: " + startTime);
        
        // 階層選択ダイアログ
        log("Windowオブジェクト作成中...");
        var dialog = new Window("dialog", "統合処理設定 - 切り抜きから背景色追加まで");
        dialog.orientation = "column";
        dialog.alignChildren = "fill";
        log("Window作成完了: " + (new Date().getTime() - startTime) + "ms");
    
        // ========== 処理選択セクション ==========
        log("処理選択パネル作成中...");
        var processPanel = dialog.add("panel", undefined, "処理選択");
        processPanel.orientation = "column";
        processPanel.alignChildren = "left";
        
        var maskCheckbox = processPanel.add("checkbox", undefined, "AI背景マスク作成");
        maskCheckbox.value = true;
        
        var resizeCheckbox = processPanel.add("checkbox", undefined, "キャンバスサイズ変更と画像配置");
        resizeCheckbox.value = true;
        
        var bgColorCheckbox = processPanel.add("checkbox", undefined, "背景色追加");
        bgColorCheckbox.value = true;
        log("処理選択パネル完了: " + (new Date().getTime() - startTime) + "ms");
        
        // ========== キャンバスサイズセクション ==========
        log("キャンバスサイズパネル作成中...");
        var sizePanel = dialog.add("panel", undefined, "キャンバスサイズ設定");
        sizePanel.orientation = "column";
        sizePanel.alignChildren = "left";
        
        // ブランド選択（ListBoxで高速化）
        log("ブランドリスト作成中...");
        var brandGroup = sizePanel.add("group");
        brandGroup.orientation = "column";
        brandGroup.add("statictext", undefined, "ブランド:");
        
        // ListBoxを使用してパフォーマンス向上
        var brandNames = [];
        for (var i = 0; i < ALL_IN_ONE_CONFIG.brands.length; i++) {
            brandNames.push(ALL_IN_ONE_CONFIG.brands[i].name);
        }
        brandNames.push("カスタム（手動入力）");
        
        var brandDropdown = brandGroup.add("listbox", undefined, brandNames);
        brandDropdown.preferredSize.height = 60; // 3行程度の高さに制限
        brandDropdown.selection = 0;
        log("ブランドリスト完了: " + (new Date().getTime() - startTime) + "ms");
        
        // 商品カテゴリー選択（ListBoxで高速化）
        var categoryGroup = sizePanel.add("group");
        categoryGroup.orientation = "column";
        categoryGroup.add("statictext", undefined, "商品カテゴリー:");
        
        // 事前にカテゴリー名を配列で準備
        var categoryItems = [];
        for (var i = 0; i < ALL_IN_ONE_CONFIG.categories.length; i++) {
            categoryItems.push(ALL_IN_ONE_CONFIG.categories[i].name);
        }
        var categoryDropdown = categoryGroup.add("listbox", undefined, categoryItems);
        categoryDropdown.preferredSize.height = 80; // 4行程度の高さに制限
        categoryDropdown.selection = 0;
        
        // カット選択（ListBoxで高速化）
        var cutGroup = sizePanel.add("group");
        cutGroup.orientation = "column";
        cutGroup.add("statictext", undefined, "カット:");
        var cutDropdown = cutGroup.add("listbox", undefined, []);
        cutDropdown.preferredSize.height = 60; // 3行程度の高さに制限
        
        // カスタムサイズ入力
        var customSizePanel = sizePanel.add("panel", undefined, "カスタムサイズ（手動入力）");
        customSizePanel.enabled = false;
        customSizePanel.orientation = "column";
        
        var customSizeRow1 = customSizePanel.add("group");
        customSizeRow1.add("statictext", undefined, "幅:");
        var widthInput = customSizeRow1.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultCanvasWidth));
        widthInput.characters = 8;
        customSizeRow1.add("statictext", undefined, "px");
        
        var customSizeRow2 = customSizePanel.add("group");
        customSizeRow2.add("statictext", undefined, "高さ:");
        var heightInput = customSizeRow2.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultCanvasHeight));
        heightInput.characters = 8;
        customSizeRow2.add("statictext", undefined, "px");
        
        var customSizeNote = customSizePanel.add("statictext", undefined, "※「カスタム（手動入力）」選択時のみ有効");
        
        // ========== 画像配置セクション ==========
        var positionPanel = dialog.add("panel", undefined, "画像配置設定");
        positionPanel.orientation = "column";
        positionPanel.alignChildren = "left";
        
        // 上部マージン
        var topMarginGroup = positionPanel.add("group");
        topMarginGroup.add("statictext", undefined, "上部マージン:");
        var topMarginInput = topMarginGroup.add("edittext", undefined, "0");
        topMarginInput.characters = 6;
        topMarginGroup.add("statictext", undefined, "px");
        
        // 下部マージン
        var bottomMarginGroup = positionPanel.add("group");
        bottomMarginGroup.add("statictext", undefined, "下部マージン:");
        var bottomMarginInput = bottomMarginGroup.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultBottomMargin));
        bottomMarginInput.characters = 6;
        bottomMarginGroup.add("statictext", undefined, "px");
        
        // 左右マージン（対称）
        var sideMarginGroup = positionPanel.add("group");
        sideMarginGroup.add("statictext", undefined, "左右マージン:");
        var sideMarginInput = sideMarginGroup.add("edittext", undefined, String(ALL_IN_ONE_CONFIG.defaultSideMargin));
        sideMarginInput.characters = 6;
        sideMarginGroup.add("statictext", undefined, "px");
        
        // 左右マージン（非対称）- 俯瞰などで使用
        var asymmetricMarginGroup = positionPanel.add("group");
        asymmetricMarginGroup.add("statictext", undefined, "左マージン:");
        var leftMarginInput = asymmetricMarginGroup.add("edittext", undefined, "513");
        leftMarginInput.characters = 6;
        asymmetricMarginGroup.add("statictext", undefined, "px　右マージン:");
        var rightMarginInput = asymmetricMarginGroup.add("edittext", undefined, "415");
        rightMarginInput.characters = 6;
        asymmetricMarginGroup.add("statictext", undefined, "px");
        asymmetricMarginGroup.enabled = false; // デフォルトで無効
        
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
        
        // ========== 階層選択の初期化（最適化版） ==========
        function updateBrandSettings() {
            try {
                var selectedIndex = brandDropdown.selection ? brandDropdown.selection.index : 0;
                var isCustom = selectedIndex === ALL_IN_ONE_CONFIG.brands.length;
                customSizePanel.enabled = isCustom;
                
                if (!isCustom && selectedIndex < ALL_IN_ONE_CONFIG.brands.length) {
                    var brand = ALL_IN_ONE_CONFIG.brands[selectedIndex];
                    
                    // ブランドのキャンバスサイズを設定
                    widthInput.text = String(brand.width);
                    heightInput.text = String(brand.height);
                    
                    // ブランドのデフォルト背景色を設定
                    if (brand.defaultBgColor !== undefined && brand.defaultBgColor < radioButtons.length) {
                        // 一度にすべてfalseにしてから選択
                        for (var i = 0; i < radioButtons.length; i++) {
                            radioButtons[i].value = (i === brand.defaultBgColor);
                        }
                    }
                }
            } catch (e) {
                log("ブランド設定更新エラー: " + e.toString());
            }
        }
        
        function updateCuts() {
            try {
                var categoryIndex = categoryDropdown.selection ? categoryDropdown.selection.index : 0;
                if (categoryIndex < 0 || categoryIndex >= ALL_IN_ONE_CONFIG.categories.length) return;
                
                var category = ALL_IN_ONE_CONFIG.categories[categoryIndex];
                
                // ListBoxの項目を効率的に更新
                cutDropdown.removeAll();
                
                // 事前に配列を作成してから一括追加（パフォーマンス向上）
                var cutNames = [];
                for (var i = 0; i < category.cuts.length; i++) {
                    cutNames.push(category.cuts[i].name);
                }
                
                // 一括でアイテム追加
                for (var i = 0; i < cutNames.length; i++) {
                    cutDropdown.add("item", cutNames[i]);
                }
                
                // 選択を設定
                if (cutDropdown.items.length > 0) {
                    cutDropdown.selection = 0;
                    updatePositionSettings();
                }
            } catch (e) {
                log("カット更新エラー: " + e.toString());
            }
        }
        
        function updatePositionSettings() {
            try {
                var categoryIndex = categoryDropdown.selection ? categoryDropdown.selection.index : 0;
                var cutIndex = cutDropdown.selection ? cutDropdown.selection.index : 0;
                
                if (categoryIndex < 0 || cutIndex < 0 || 
                    categoryIndex >= ALL_IN_ONE_CONFIG.categories.length) return;
                
                var category = ALL_IN_ONE_CONFIG.categories[categoryIndex];
                if (cutIndex >= category.cuts.length) return;
                
                var cut = category.cuts[cutIndex];
                
                // 基本配置設定を一括適用
                topMarginInput.text = cut.topMargin !== undefined ? String(cut.topMargin) : "0";
                bottomMarginInput.text = cut.bottomMargin !== undefined ? String(cut.bottomMargin) : String(ALL_IN_ONE_CONFIG.defaultBottomMargin);
                sideMarginInput.text = cut.sideMargin !== undefined ? String(cut.sideMargin) : String(ALL_IN_ONE_CONFIG.defaultSideMargin);
                
                // 配置パターンに応じたUI制御
                if (cut.positioning === "center-asymmetric") {
                    // 非対称マージンパターン: 左右非対称、上下は固定値
                    asymmetricMarginGroup.enabled = true;
                    sideMarginGroup.enabled = false;
                    topMarginGroup.enabled = false;  // 上部マージンは設定値で固定
                    bottomMarginGroup.enabled = false; // 下部マージンは設定値で固定
                    leftMarginInput.text = cut.leftMargin !== undefined ? String(cut.leftMargin) : "513";
                    rightMarginInput.text = cut.rightMargin !== undefined ? String(cut.rightMargin) : "415";
                } else if (cut.positioning === "center-symmetric") {
                    // 対称マージンパターン: 左右対称、高さセンター
                    asymmetricMarginGroup.enabled = false;
                    sideMarginGroup.enabled = true;
                    topMarginGroup.enabled = false; // 高さセンターのため上下マージンは無効
                    bottomMarginGroup.enabled = false;
                    sideMarginInput.text = cut.sideMargin !== undefined ? String(cut.sideMargin) : "418";
                } else if (cut.positioning === "bottom-top") {
                    // 上下マージンパターン: 上下調整可能、左右は対称
                    asymmetricMarginGroup.enabled = false;
                    sideMarginGroup.enabled = true;
                    topMarginGroup.enabled = true;
                    bottomMarginGroup.enabled = true;
                } else {
                    // 通常の下部+左右マージンパターン
                    asymmetricMarginGroup.enabled = false;
                    sideMarginGroup.enabled = true;
                    topMarginGroup.enabled = false; // 上部マージンは使用しない
                    bottomMarginGroup.enabled = true;
                }
            } catch (e) {
                log("配置設定更新エラー: " + e.toString());
            }
        }
        
        // ========== イベントハンドラ ==========
        log("イベントハンドラ設定中...");
        brandDropdown.onChange = function() {
            try {
                updateBrandSettings();
            } catch (e) {
                log("ブランド変更エラー: " + e.toString());
            }
        };
        
        categoryDropdown.onChange = function() {
            try {
                updateCuts();
            } catch (e) {
                log("カテゴリ変更エラー: " + e.toString());
            }
        };
        
        cutDropdown.onChange = function() {
            try {
                updatePositionSettings();
            } catch (e) {
                log("カット変更エラー: " + e.toString());
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
        log("イベントハンドラ完了: " + (new Date().getTime() - startTime) + "ms");
        
        okButton.onClick = function() {
            log("処理開始ボタンがクリックされました");
            
            // カスタムサイズ検証
            var isCustom = brandDropdown.selection.index === ALL_IN_ONE_CONFIG.brands.length;
            if (isCustom && resizeCheckbox.value) {
                var width = parseInt(widthInput.text);
                var height = parseInt(heightInput.text);
                
                if (isNaN(width) || width <= 0 || width > 20000) {
                    alert("幅は1から20000の数値を入力してください。");
                    return;
                }
                
                if (isNaN(height) || height <= 0 || height > 20000) {
                    alert("高さは1から20000の数値を入力してください。");
                    return;
                }
            }
            
            // マージン検証
            if (resizeCheckbox.value) {
                var topMargin = parseInt(topMarginInput.text);
                var bottomMargin = parseInt(bottomMarginInput.text);
                var sideMargin = parseInt(sideMarginInput.text);
                
                if (isNaN(topMargin) || topMargin < 0) {
                    alert("上部マージンは0以上の数値を入力してください。");
                    return;
                }
                
                if (isNaN(bottomMargin) || bottomMargin < 0) {
                    alert("下部マージンは0以上の数値を入力してください。");
                    return;
                }
                
                // 非対称マージンの場合の検証
                if (asymmetricMarginGroup.enabled) {
                    var leftMargin = parseInt(leftMarginInput.text);
                    var rightMargin = parseInt(rightMarginInput.text);
                    
                    if (isNaN(leftMargin) || leftMargin < 0) {
                        alert("左マージンは0以上の数値を入力してください。");
                        return;
                    }
                    
                    if (isNaN(rightMargin) || rightMargin < 0) {
                        alert("右マージンは0以上の数値を入力してください。");
                        return;
                    }
                } else {
                    // 通常の左右マージンの検証
                    if (isNaN(sideMargin) || sideMargin < 0) {
                        alert("左右マージンは0以上の数値を入力してください。");
                        return;
                    }
                }
            }
            
            dialog.close(1);
        };
        
        cancelButton.onClick = function() {
            log("キャンセルボタンがクリックされました");
            dialog.close(0);
        };
        
        // ========== 軽量初期化 ==========
        log("初期化開始...");
        
        // 最初のカテゴリーのカット設定
        if (ALL_IN_ONE_CONFIG.categories.length > 0 && ALL_IN_ONE_CONFIG.categories[0].cuts.length > 0) {
            var firstCategory = ALL_IN_ONE_CONFIG.categories[0];
            for (var i = 0; i < firstCategory.cuts.length; i++) {
                cutDropdown.add("item", firstCategory.cuts[i].name);
            }
            if (cutDropdown.items.length > 0) {
                cutDropdown.selection = 0;
            }
        }
        log("カット初期化完了: " + (new Date().getTime() - startTime) + "ms");
        
        // デフォルトブランド設定を直接適用（関数呼び出しを避ける）
        if (ALL_IN_ONE_CONFIG.brands.length > 0) {
            var defaultBrand = ALL_IN_ONE_CONFIG.brands[0];
            widthInput.text = String(defaultBrand.width);
            heightInput.text = String(defaultBrand.height);
            
            // デフォルト背景色設定
            if (defaultBrand.defaultBgColor !== undefined && defaultBrand.defaultBgColor < radioButtons.length) {
                radioButtons[defaultBrand.defaultBgColor].value = true;
            }
        }
        log("ブランド初期化完了: " + (new Date().getTime() - startTime) + "ms");
        
        // デフォルト配置設定を直接適用
        if (ALL_IN_ONE_CONFIG.categories.length > 0 && ALL_IN_ONE_CONFIG.categories[0].cuts.length > 0) {
            var defaultCut = ALL_IN_ONE_CONFIG.categories[0].cuts[0];
            topMarginInput.text = defaultCut.topMargin !== undefined ? String(defaultCut.topMargin) : "0";
            bottomMarginInput.text = defaultCut.bottomMargin !== undefined ? String(defaultCut.bottomMargin) : String(ALL_IN_ONE_CONFIG.defaultBottomMargin);
            sideMarginInput.text = defaultCut.sideMargin !== undefined ? String(defaultCut.sideMargin) : String(ALL_IN_ONE_CONFIG.defaultSideMargin);
        }
        log("配置初期化完了: " + (new Date().getTime() - startTime) + "ms");
        
        // ダイアログ表示
        log("ダイアログ表示前 総所要時間: " + (new Date().getTime() - startTime) + "ms");
        var result = dialog.show();
        log("ダイアログ結果: " + result + " 表示完了時間: " + (new Date().getTime() - startTime) + "ms");
        
        if (result === 1) {
            // 選択されたカットの配置情報を取得（デバッグ情報付き）
            var selectedCut = null;
            var isCustom = brandDropdown.selection.index === ALL_IN_ONE_CONFIG.brands.length;
            if (!isCustom) {
                var categoryIndex = categoryDropdown.selection ? categoryDropdown.selection.index : 0;
                var cutIndex = cutDropdown.selection ? cutDropdown.selection.index : 0;
                log("選択状態 - カテゴリ: " + categoryIndex + ", カット: " + cutIndex);
                if (categoryIndex >= 0 && cutIndex >= 0 && categoryIndex < ALL_IN_ONE_CONFIG.categories.length) {
                    var category = ALL_IN_ONE_CONFIG.categories[categoryIndex];
                    log("選択カテゴリ: " + category.name + " (カット数: " + category.cuts.length + ")");
                    if (cutIndex < category.cuts.length) {
                        selectedCut = category.cuts[cutIndex];
                        log("選択カット: " + selectedCut.name + " (positioning: " + selectedCut.positioning + ")");
                    }
                }
            }
            
            var settings = {
                processMask: maskCheckbox.value,
                processResize: resizeCheckbox.value,
                processBgColor: bgColorCheckbox.value,
                processShadow: shadowCheckbox.value,
                width: parseInt(widthInput.text),
                height: parseInt(heightInput.text),
                topMargin: parseInt(topMarginInput.text),
                bottomMargin: parseInt(bottomMarginInput.text),
                sideMargin: asymmetricMarginGroup.enabled ? undefined : parseInt(sideMarginInput.text),
                leftMargin: asymmetricMarginGroup.enabled ? parseInt(leftMarginInput.text) : undefined,
                rightMargin: asymmetricMarginGroup.enabled ? parseInt(rightMarginInput.text) : undefined,
                autoFit: autoFitCheckbox.value,
                shadowBlur: parseInt(shadowBlurInput.text),
                shadowHighlight: parseInt(shadowLevelsInput.text),
                backgroundColor: null,
                // 選択されたカットの配置設定を追加
                positioning: selectedCut ? selectedCut.positioning : "bottom"
            };
            
            // デバッグ用: 最終的なマージン設定をログ出力
            if (settings.positioning === "center-asymmetric") {
                log("center-asymmetric設定: 左=" + settings.leftMargin + ", 右=" + settings.rightMargin + ", 上=" + settings.topMargin + ", 下=" + settings.bottomMargin);
            }
            
            // 選択された背景色を取得（デバッグ情報付き）
            log("背景色選択状態確認中...");
            for (var i = 0; i < radioButtons.length; i++) {
                log("ラジオボタン " + i + ": " + radioButtons[i].value);
                if (radioButtons[i].value) {
                    if (i === ALL_IN_ONE_CONFIG.backgroundColors.length - 1) {
                        settings.backgroundColor = {
                            name: "カスタム",
                            hex: customColorInput.text,
                            rgb: hexToRgb(customColorInput.text)
                        };
                        log("カスタム色選択: " + customColorInput.text);
                    } else {
                        settings.backgroundColor = ALL_IN_ONE_CONFIG.backgroundColors[i];
                        log("プリセット色選択: " + settings.backgroundColor.name + " " + settings.backgroundColor.hex);
                    }
                    break;
                }
            }
            
            if (!settings.backgroundColor) {
                log("警告: 背景色が選択されていません");
                settings.backgroundColor = ALL_IN_ONE_CONFIG.backgroundColors[0]; // デフォルト色を設定
                log("デフォルト色を適用: " + settings.backgroundColor.name);
            }
            
            return settings;
        }
        return null;
        
    } catch (e) {
        log("ダイアログエラー: " + e.toString());
        log("エラー詳細: " + e.message);
        if (e.line) log("エラー行: " + e.line);
        if (e.source) log("エラー箇所: " + e.source);
        alert("ダイアログ作成エラー: " + e.toString() + "\n詳細: " + e.message);
        return null;
    }
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
            safeExecuteAction(idMk, desc, getDialogModeNO());
            
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
        safeExecuteAction(idautoCutout, desc, getDialogModeNO());
    } catch (e) {
        try {
            var idAS = stringIDToTypeID("autoCutout");
            var desc2 = new ActionDescriptor();
            desc2.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
            safeExecuteAction(idAS, desc2, getDialogModeNO());
        } catch (e2) {
            try {
                var idSelectSubject = charIDToTypeID("SlSb");
                safeExecuteAction(idSelectSubject, undefined, getDialogModeNO());
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
    safeExecuteAction(idQckA, desc, getDialogModeNO());
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
            safeExecuteAction(charIDToTypeID("slct"), desc, getDialogModeNO());
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
            safeExecuteAction(charIDToTypeID("setd"), desc, getDialogModeNO());
            
            var bounds = doc.selection.bounds;
            doc.selection.deselect();
            
            var desc2 = new ActionDescriptor();
            var ref3 = new ActionReference();
            ref3.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("RGB "));
            desc2.putReference(charIDToTypeID("null"), ref3);
            safeExecuteAction(charIDToTypeID("slct"), desc2, getDialogModeNO());
            
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
            // 配置パターンに応じたマージン計算
            var maxWidth, maxHeight;
            if (settings.positioning === "center-asymmetric") {
                // 非対称マージンパターン: 左右異なるマージン、高さは全体を使用
                maxWidth = settings.width - settings.leftMargin - settings.rightMargin;
                maxHeight = settings.height; // 高さセンター合わせのため、全体の高さを使用
                log("center-asymmetricパターン: 最大幅 = " + maxWidth + "px (全体" + settings.width + " - 左" + settings.leftMargin + " - 右" + settings.rightMargin + ")");
                log("center-asymmetricパターン: 最大高さ = " + maxHeight + "px (全体の高さを使用)");
            } else if (settings.positioning === "center-symmetric") {
                // 対称マージンパターン: 左右対称マージン、高さは全体を使用
                maxWidth = settings.width - (settings.sideMargin * 2);
                maxHeight = settings.height; // 高さセンター合わせのため、全体の高さを使用
                log("center-symmetricパターン: 最大幅 = " + maxWidth + "px (全体" + settings.width + " - 左右" + (settings.sideMargin * 2) + ")");
                log("center-symmetricパターン: 最大高さ = " + maxHeight + "px (全体の高さを使用)");
            } else if (settings.positioning === "bottom-top") {
                // bottom-topパターン: 上部と下部の両マージンを考慮、左右は対称
                maxWidth = settings.width - (settings.sideMargin * 2);
                maxHeight = settings.height - settings.topMargin - settings.bottomMargin;
                log("bottom-topパターン: 最大幅 = " + maxWidth + "px (全体" + settings.width + " - 左右" + (settings.sideMargin * 2) + ")");
                log("bottom-topパターン: 最大高さ = " + maxHeight + "px (全体" + settings.height + " - 上部" + settings.topMargin + " - 下部" + settings.bottomMargin + ")");
            } else {
                // bottom-sideパターン: 下部マージンのみ考慮、左右は対称
                maxWidth = settings.width - (settings.sideMargin * 2);
                maxHeight = settings.height - settings.bottomMargin;
                log("bottom-sideパターン: 最大幅 = " + maxWidth + "px (全体" + settings.width + " - 左右" + (settings.sideMargin * 2) + ")");
                log("bottom-sideパターン: 最大高さ = " + maxHeight + "px (全体" + settings.height + " - 下部" + settings.bottomMargin + ")");
            }
            
            var scaleX = maxWidth / maskBounds.width;
            
            var scaleY = maxHeight / maskBounds.height;
            
            scale = Math.min(scaleX, scaleY);
            log("スケール計算: X=" + scaleX.toFixed(3) + ", Y=" + scaleY.toFixed(3) + " → 最終=" + scale.toFixed(3));
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
        
        // 画像を配置（プリセットに応じて配置方法を決定）
        var targetX, targetY;
        
        // 現在のマスク位置をログ出力
        log("現在のマスク位置: left=" + maskBounds.left + ", top=" + maskBounds.top + ", width=" + maskBounds.width + ", height=" + maskBounds.height);
        log("キャンバスサイズ: " + settings.width + "×" + settings.height + "px");
        if (settings.positioning === "center-asymmetric") {
            log("配置設定: positioning=" + settings.positioning + ", topMargin=" + settings.topMargin + ", bottomMargin=" + settings.bottomMargin + ", leftMargin=" + settings.leftMargin + ", rightMargin=" + settings.rightMargin);
        } else {
            log("配置設定: positioning=" + settings.positioning + ", topMargin=" + settings.topMargin + ", bottomMargin=" + settings.bottomMargin + ", sideMargin=" + settings.sideMargin);
        }
        
        // プリセットの配置方式を確認
        if (settings.positioning === "center-asymmetric") {
            // パターン3: 完全な高さセンター合わせ + 非対称左右マージン（俯瞰用）
            // Y軸: キャンバス全体の中央に配置
            targetY = (settings.height - maskBounds.height) / 2;
            
            // X軸: 非対称マージンを考慮した配置
            var availableWidth = settings.width - settings.leftMargin - settings.rightMargin;
            targetX = settings.leftMargin + (availableWidth - maskBounds.width) / 2;
            
            log("配置パターン: 完全高さセンター＋非対称マージン");
            log("  キャンバス高さ: " + settings.height + "px, マスク高さ: " + maskBounds.height + "px");
            log("  利用可能幅: " + availableWidth + "px (キャンバス" + settings.width + " - 左" + settings.leftMargin + " - 右" + settings.rightMargin + ")");
            
            var centerOffsetY = (settings.height - maskBounds.height) / 2;
            var centerOffsetX = (availableWidth - maskBounds.width) / 2;
            log("  完全中央配置Y: " + centerOffsetY + "px = (キャンバス" + settings.height + " - マスク高さ" + maskBounds.height + ") ÷ 2");
            log("  非対称中央配置X: " + centerOffsetX + "px = (利用可能幅" + availableWidth + " - マスク幅" + maskBounds.width + ") ÷ 2");
            log("  目標Y: " + targetY + " (完全中央)");
            log("  目標X: " + targetX + " (左" + settings.leftMargin + " + 中央オフセット" + centerOffsetX + ")");
            
            // 検証: 上下の距離が等しいか確認
            var distanceFromTop = targetY;
            var distanceFromBottom = settings.height - targetY - maskBounds.height;
            log("  検証: 上部からマスクまでの距離 = " + distanceFromTop + "px");
            log("  検証: マスクから下部までの距離 = " + distanceFromBottom + "px");
            log("  検証: 完全センター判定 = " + (Math.abs(distanceFromTop - distanceFromBottom) < 1 ? "OK" : "NG"));
        } else if (settings.positioning === "center-symmetric") {
            // パターン4: 完全な高さセンター合わせ + 対称左右マージン（開き用）
            // Y軸: キャンバス全体の中央に配置
            targetY = (settings.height - maskBounds.height) / 2;
            
            // X軸: 対称マージンを考慮した配置（中央配置）
            targetX = (settings.width - maskBounds.width) / 2;
            
            log("配置パターン: 完全高さセンター＋対称マージン");
            log("  キャンバス高さ: " + settings.height + "px, マスク高さ: " + maskBounds.height + "px");
            log("  対称マージン: " + settings.sideMargin + "px (左右同じ)");
            
            var centerOffsetY = (settings.height - maskBounds.height) / 2;
            var centerOffsetX = (settings.width - maskBounds.width) / 2;
            log("  完全中央配置Y: " + centerOffsetY + "px = (キャンバス" + settings.height + " - マスク高さ" + maskBounds.height + ") ÷ 2");
            log("  完全中央配置X: " + centerOffsetX + "px = (キャンバス" + settings.width + " - マスク幅" + maskBounds.width + ") ÷ 2");
            log("  目標Y: " + targetY + " (完全中央)");
            log("  目標X: " + targetX + " (完全中央)");
            
            // 検証: 上下の距離が等しいか確認
            var distanceFromTop = targetY;
            var distanceFromBottom = settings.height - targetY - maskBounds.height;
            log("  検証: 上部からマスクまでの距離 = " + distanceFromTop + "px");
            log("  検証: マスクから下部までの距離 = " + distanceFromBottom + "px");
            log("  検証: 完全センター判定 = " + (Math.abs(distanceFromTop - distanceFromBottom) < 1 ? "OK" : "NG"));
        } else if (settings.positioning === "bottom-top") {
            // パターン2: 下部マージン + 上部マージン（Y軸中央配置）
            var availableHeight = settings.height - settings.topMargin - settings.bottomMargin;
            targetY = settings.topMargin + (availableHeight - maskBounds.height) / 2;
            targetX = (settings.width - maskBounds.width) / 2;  // X軸は常に中央
            log("配置パターン: 下部＋上部マージン");
            log("  利用可能高さ: " + availableHeight + "px (キャンバス" + settings.height + " - 上部" + settings.topMargin + " - 下部" + settings.bottomMargin + ")");
            log("  目標Y: " + targetY + " (上部" + settings.topMargin + " + 中央配置" + ((availableHeight - maskBounds.height) / 2) + ")");
            log("  目標X: " + targetX + " (X軸中央)");
        } else {
            // パターン1: 下部マージン + 左右マージン（デフォルト）
            targetY = settings.height - settings.bottomMargin - maskBounds.height;
            
            // 左右マージンを考慮したX位置計算
            if (settings.sideMargin && settings.sideMargin > 0) {
                var maxWidth = settings.width - (settings.sideMargin * 2);
                if (maskBounds.width <= maxWidth) {
                    // マージン内に収まる場合は中央配置
                    targetX = (settings.width - maskBounds.width) / 2;
                } else {
                    // マージンを超える場合（スケールで調整済みのはず）
                    targetX = settings.sideMargin;
                }
            } else {
                targetX = (settings.width - maskBounds.width) / 2;
            }
            
            log("配置パターン: 下部＋左右マージン");
            log("  目標Y: " + targetY + " (キャンバス" + settings.height + " - 下部" + settings.bottomMargin + " - マスク高" + maskBounds.height + ")");
            log("  目標X: " + targetX + " (左右マージン: " + (settings.sideMargin || 0) + "px)");
        }
        
        var deltaX = targetX - maskBounds.left;
        var deltaY = targetY - maskBounds.top;
        
        log("移動量: deltaX=" + deltaX + ", deltaY=" + deltaY);
        log("移動前マスク位置: (" + maskBounds.left + ", " + maskBounds.top + ")");
        log("移動後予定位置: (" + targetX + ", " + targetY + ")");
        
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
        
        // グラデーション影効果（上部シャープ、下部ぼかし）
        try {
            log("グラデーション影効果開始");
            
            // マスクの境界を取得
            var maskBounds = doc.activeLayer.bounds;
            var shadowHeight = maskBounds[3].value - maskBounds[1].value;
            var shadowTop = maskBounds[1].value;
            var shadowBottom = maskBounds[3].value;
            
            // 段階的ぼかし処理（上から下へ徐々にぼかしを強くする）
            var numberOfSteps = 5; // ぼかしステップ数
            var stepHeight = shadowHeight / numberOfSteps;
            
            for (var step = 0; step < numberOfSteps; step++) {
                // 各段階の選択範囲を計算（下から上へ処理）
                var stepTop = shadowTop + (step * stepHeight);
                var stepBottom = shadowBottom;
                
                // 段階的なぼかし強度（下に向かうほど強く）
                var blurStrength = (settings.shadowBlur * (step + 1)) / numberOfSteps;
                
                log("ステップ " + (step + 1) + ": " + Math.round(blurStrength) + "px ぼかし");
                
                // この段階の選択範囲を作成
                var selectionArray = [
                    [maskBounds[0].value, stepTop],
                    [maskBounds[2].value, stepTop], 
                    [maskBounds[2].value, stepBottom],
                    [maskBounds[0].value, stepBottom]
                ];
                doc.selection.select(selectionArray, SelectionType.REPLACE, 0, false);
                
                // 選択範囲をマスクと交差させる
                var desc = new ActionDescriptor();
                var ref = new ActionReference();
                ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
                desc.putReference(charIDToTypeID("null"), ref);
                var ref2 = new ActionReference();
                ref2.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
                desc.putReference(charIDToTypeID("With"), ref2);
                var idIntr = charIDToTypeID("Intr");
                desc.putEnumerated(charIDToTypeID("T   "), charIDToTypeID("Slct"), idIntr);
                safeExecuteAction(charIDToTypeID("setd"), desc, getDialogModeNO());
                
                // この段階でガウシアンブラーを適用
                if (blurStrength > 0.5) {
                    var idGsnB = charIDToTypeID("GsnB");
                    var desc2 = new ActionDescriptor();
                    var idRds = charIDToTypeID("Rds ");
                    desc2.putUnitDouble(idRds, charIDToTypeID("#Pxl"), blurStrength);
                    safeExecuteAction(idGsnB, desc2, getDialogModeNO());
                }
                
                // 選択範囲を解除
                doc.selection.deselect();
            }
            
            log("グラデーション影効果完了: 上部シャープ → 下部" + settings.shadowBlur + "px ぼかし");
            
        } catch (e) {
            log("グラデーション影効果エラー: " + e.toString());
            log("フォールバック: 全体ぼかしを適用");
            
            // エラー時は従来の全体ぼかしにフォールバック
            try {
                var blurRadius = settings.shadowBlur;
                var idGsnB = charIDToTypeID("GsnB");
                var desc2 = new ActionDescriptor();
                var idRds = charIDToTypeID("Rds ");
                desc2.putUnitDouble(idRds, charIDToTypeID("#Pxl"), blurRadius);
                safeExecuteAction(idGsnB, desc2, getDialogModeNO());
            } catch (fallbackError) {
                log("フォールバック全体ぼかしもエラー: " + fallbackError.toString());
            }
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
            safeExecuteAction(idLvls, desc4, getDialogModeNO());
            
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
        // DialogModes互換性チェック
        safeSetDisplayDialogs();
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
        
        // 画像ファイル取得（PSDも含む）
        var files = inputFolder.getFiles(/\.(jpg|jpeg|png|tif|tiff|bmp|psd)$/i);
        
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
            
            // 出力ファイル名生成（入力ファイル名と同じ、拡張子のみ.psdに変更）
            var outputName = file.name.replace(/\.[^.]+$/, "") + ".psd";
            
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