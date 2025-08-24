// Photoshop AI背景マスク作成 - PSD形式
// 被写体選択 + レイヤーマスク作成方式

// ========== 設定 ==========
var AI_CONFIG = {
    inputFolderName: "images",
    outputFolderName: "output",
    outputFormat: "PSD", // PNG から PSD に変更
    saveAsMultiLayer: true, // マルチレイヤー形式で保存
    useMask: true, // マスクを使用
    showProgress: true
};

// ========== グローバル変数 ==========
var scriptFolder = new File($.fileName).parent;
var inputFolder = new Folder(scriptFolder + "/" + AI_CONFIG.inputFolderName);
var outputFolder = new Folder(scriptFolder + "/" + AI_CONFIG.outputFolderName);

// ========== ログ ==========
function log(message) {
    var logMessage = "[" + new Date().toLocaleTimeString() + "] " + message;
    $.writeln(logMessage);
    
    // ログファイルにも出力
    try {
        var logFile = new File(scriptFolder + "/debug.log");
        logFile.open("a");
        logFile.writeln(logMessage);
        logFile.close();
    } catch (e) {
        // ログファイル書き込みエラーは無視
    }
}

// ========== AI背景マスク作成（修正版） ==========
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
        
        // 方法1: 被写体を選択（AI）
        try {
            selectSubject(doc);
            log("被写体選択成功");
        } catch (e) {
            log("被写体選択エラー: " + e.toString());
            return false;
        }
        
        // レイヤーマスクを追加
        try {
            // ActionDescriptorを使用してレイヤーマスクを追加
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
        
        log("AI背景マスク作成完了: " + doc.name);
        return true;
        
    } catch (e) {
        log("背景マスク作成エラー: " + e.toString());
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

// ========== PSD保存 ==========
function savePSD(doc, path) {
    try {
        log("PSD保存開始: " + path);
        
        var file = new File(path);
        var options = new PhotoshopSaveOptions();
        options.layers = AI_CONFIG.saveAsMultiLayer; // レイヤーを保持
        options.embedColorProfile = true;
        options.alphaChannels = true; // アルファチャンネルを保持
        options.annotations = true;
        options.spotColors = true;
        
        // ファイル保存
        doc.saveAs(file, options, true, Extension.LOWERCASE);
        log("PSD保存成功: " + file.name);
        return true;
        
    } catch (e) {
        log("PSD保存エラー: " + e.toString());
        log("保存先パス: " + path);
        return false;
    }
}

// ========== メイン処理 ==========
function main() {
    try {
        app.displayDialogs = DialogModes.NO;
        app.preferences.rulerUnits = Units.PIXELS;
        
        log("========== Photoshop AI背景マスク作成（PSD形式）開始 ==========");
        log("Photoshopバージョン: " + app.version);
    
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
        var outputName = file.name.replace(/\.[^.]+$/, "_masked.psd");
        var outputPath = outputFolder + "/" + outputName;
        
        log("(" + (i+1) + "/" + files.length + ") " + file.name);
        
        try {
            var doc = app.open(file);
            
            if (createBackgroundMask(doc)) {
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
    
    var result = "AI背景マスク作成完了\n\n";
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