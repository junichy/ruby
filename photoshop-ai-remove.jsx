// Photoshop AI背景削除 - 修正版
// 被写体選択 + 削除方式

// ========== 設定 ==========
var AI_CONFIG = {
    inputFolderName: "images",
    outputFolderName: "output",
    outputFormat: "PNG",
    pngCompression: 6,
    showProgress: true
};

// ========== グローバル変数 ==========
var scriptFolder = new File($.fileName).parent;
var inputFolder = new Folder(scriptFolder + "/" + AI_CONFIG.inputFolderName);
var outputFolder = new Folder(scriptFolder + "/" + AI_CONFIG.outputFolderName);

// ========== ログ ==========
function log(message) {
    $.writeln("[" + new Date().toLocaleTimeString() + "] " + message);
}

// ========== AI背景削除（修正版） ==========
function removeBackgroundAI(doc) {
    try {
        log("AI背景削除開始: " + doc.name);
        
        // ドキュメント準備
        if (doc.mode != DocumentMode.RGB) {
            doc.changeMode(ChangeMode.RGB);
        }
        if (doc.bitsPerChannel != BitsPerChannelType.EIGHT) {
            doc.bitsPerChannel = BitsPerChannelType.EIGHT;
        }
        if (doc.activeLayer.isBackgroundLayer) {
            doc.activeLayer.isBackgroundLayer = false;
            doc.activeLayer.name = "Layer 0";
        }
        
        // 方法1: 被写体を選択（AI）
        try {
            selectSubject(doc);
            log("被写体選択成功");
        } catch (e) {
            log("被写体選択エラー: " + e.toString());
            return false;
        }
        
        // 選択範囲を反転（背景を選択）
        doc.selection.invert();
        
        // 背景を削除
        doc.selection.clear();
        
        // 選択解除
        doc.selection.deselect();
        
        log("AI背景削除完了: " + doc.name);
        return true;
        
    } catch (e) {
        log("背景削除エラー: " + e.toString());
        return false;
    }
}

// ========== 被写体を選択（AI機能） ==========
function selectSubject(doc) {
    // Adobe Senseiによる被写体選択
    var idautoCutout = stringIDToTypeID("autoCutout");
    var desc = new ActionDescriptor();
    desc.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
    
    try {
        // まず試す: autoCutout
        executeAction(idautoCutout, desc, DialogModes.NO);
    } catch (e) {
        // 代替方法: selectSubject
        try {
            var idAS = stringIDToTypeID("autoCutout");
            var desc2 = new ActionDescriptor();
            desc2.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
            executeAction(idAS, desc2, DialogModes.NO);
        } catch (e2) {
            // さらに代替: メニューコマンドID
            try {
                var idSelectSubject = charIDToTypeID("SlSb");
                executeAction(idSelectSubject, undefined, DialogModes.NO);
            } catch (e3) {
                // 最終手段: クイックアクション経由
                executeQuickAction();
            }
        }
    }
}

// ========== クイックアクション実行 ==========
function executeQuickAction() {
    // Quick Actions > Remove Background
    var idQckA = stringIDToTypeID("quickAction");
    var desc = new ActionDescriptor();
    var idActn = stringIDToTypeID("action");
    desc.putString(idActn, "removeBackground");
    executeAction(idQckA, desc, DialogModes.NO);
}

// ========== PNG保存 ==========
function savePNG(doc, path) {
    var file = new File(path);
    var options = new PNGSaveOptions();
    options.compression = AI_CONFIG.pngCompression;
    options.interlaced = false;
    
    doc.saveAs(file, options, true);
    log("保存: " + file.name);
}

// ========== メイン処理 ==========
function main() {
    app.displayDialogs = DialogModes.NO;
    app.preferences.rulerUnits = Units.PIXELS;
    
    log("========== Photoshop AI背景削除（修正版）開始 ==========");
    
    // フォルダ確認
    if (!inputFolder.exists) {
        inputFolder.create();
        alert("imagesフォルダを作成しました。");
        return;
    }
    if (!outputFolder.exists) {
        outputFolder.create();
    }
    
    // 画像取得
    var files = inputFolder.getFiles(/\.(jpg|jpeg|png|tif|tiff|bmp)$/i);
    
    if (files.length == 0) {
        alert("処理する画像がありません。");
        return;
    }
    
    log("処理対象: " + files.length + "ファイル");
    
    var success = 0;
    var error = 0;
    var startTime = new Date();
    
    // 各ファイル処理
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var outputName = file.name.replace(/\.[^.]+$/, "_removed.png");
        var outputPath = outputFolder + "/" + outputName;
        
        log("(" + (i+1) + "/" + files.length + ") " + file.name);
        
        try {
            var doc = app.open(file);
            
            if (removeBackgroundAI(doc)) {
                savePNG(doc, outputPath);
                success++;
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
    
    var result = "AI背景削除完了\n\n";
    result += "成功: " + success + " ファイル\n";
    result += "エラー: " + error + " ファイル\n";
    result += "処理時間: " + totalSeconds + " 秒\n\n";
    result += "出力: " + outputFolder.fsName;
    
    alert(result);
}

// ========== 実行 ==========
main();