//=============================================================================
// aninterruptionsave.js 1.03
//=============================================================================

/*:
 * @plugindesc ゲーム終了時に中断セーブを行います。
 * @author AWs(蒼井 刹那)
 *
 * @help プラグインコマンドとして「AnInterruption open」を
 * 　　　使用すると任意のタイミングで中断セーブを行うことができます。
 * 
 * 　　　中断セーブはメニューの「ゲーム中断」を選択すると
 * 　　　中断セーブを行うか否かを選択し、セーブを行った場合は
 * 　　　次回起動時「中断セーブ」をロードするとセーブファイルが
 * 　　　削除されます(通常のセーブデータは削除されません)
 *
 * Plugin Command:
 *   AnInterruption open #中断セーブ画面を表示
 */
 
(function() {

    var _Game_Interpreter_pluginCommand =
            Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'AnInterruption') {
            switch (args[0]) {
            case 'open':
                SceneManager.push(Scene_aninterruption);
                break;
            }
        }
    };
	
DataManager.maxSavefiles = function() {
    return 20;
};

DataManager.maxSavefiles2 = function() {
    return 1;
};

StorageManager.localFilePath = function(savefileId) {
    var name;
    if (savefileId < 0) {
        name = 'config.rpgsave';
    } else if (savefileId === 0) {
        name = 'global.rpgsave';
    } else if (savefileId === 1) {
		name = 'aninterruption.rpgsave';
    } else {
        name = 'file%1.rpgsave'.format(savefileId - 1);
    }
    return this.localFileDirectoryPath() + name;
};

StorageManager.webStorageKey = function(savefileId) {
    if (savefileId < 0) {
        return 'RPG Config';
    } else if (savefileId === 0) {
        return 'RPG Global';
    } else if (savefileId === 1) {
		return 'aninterruption.rpgsave';
    } else {
        return 'RPG File%1'.format(savefileId);
    }
};


Scene_Menu.prototype.commandGameEnd = function() {
    SceneManager.push(Scene_aninterruption);
};

Scene_Save.prototype.onSavefileOk = function(savefileId) {
    Scene_File.prototype.onSavefileOk.call(this);
    $gameSystem.onBeforeSave();
	savefileId = this.savefileId();
	if (savefileId === 1){
        this.onSaveFailure();
	} else {
    if (DataManager.saveGame(this.savefileId())) {
        this.onSaveSuccess();
    } else {
        this.onSaveFailure();
    }
	}
};

Scene_Load.prototype.reloadMapIfUpdated = function(savefileId) {
	savefileId = this.savefileId();
    if ($gameSystem.versionId() !== $dataSystem.versionId) {
        $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
        $gamePlayer.requestMapReload();
    }
    if (savefileId === 1) {
		StorageManager.remove(1);
	}
};

Window_MenuCommand.prototype.addGameEndCommand = function() {
    var enabled = this.isGameEndEnabled();
    this.addCommand('ゲーム中断', 'gameEnd', enabled);
};

Window_SavefileList.prototype.isCommandEnabled = function() {
    return false;//this.isEnabled;
};

Window_SavefileList.prototype.drawItem = function(index) {
    var id = index + 1;
    var valid = DataManager.isThisGameFile(id);
    var info = DataManager.loadSavefileInfo(id);
    var rect = this.itemRectForText(index);
    this.resetTextColor();
    if (this._mode === 'load') {
        this.changePaintOpacity(valid);
    }
    this.drawFileId(id, rect.x, rect.y);
    if (info) {
        this.changePaintOpacity(valid);
        this.drawContents(info, rect, valid);
        this.changePaintOpacity(true);
    }
};

Window_SavefileList.prototype.drawFileId = function(id, x, y, rect) {
    if (this._mode === 'load') {
	if (id === 1){
    this.drawText("中断セーブ", x, y, 180);
	} else {
    this.drawText(TextManager.file + ' ' + (id - 1) , x, y, 180);
	}
	} else {
	if (id === 1){
    this.changePaintOpacity(this.isCommandEnabled());
    this.drawText("中断セーブ", x, y, 180);
	} else {
    this.changePaintOpacity(true);
    this.drawText(TextManager.file + ' ' + (id - 1) , x, y, 180);
	}
	}
};

function Scene_File2() {
    this.initialize.apply(this, arguments);
}

Scene_File2.prototype = Object.create(Scene_MenuBase.prototype);
Scene_File2.prototype.constructor = Scene_File2;

Scene_File2.prototype.initialize = function() {

            Scene_MenuBase.prototype.initialize.call(this);
            this.openness = 0;
};

Scene_File2.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createListWindow();
    this.createCommandWindow();
};

Scene_File2.prototype.createCommandWindow = function() {
    var x = (Graphics.boxWidth - 480) / 2;
//    var x = 500;
    var y = 300;
    var width = 200;
    var height = 160;
    this._commandWindow = new Window_SavefileList2(x, y, width, height);
    this._commandWindow.setHandler('ok',     this.onSavefileOk.bind(this));
    this._commandWindow.setHandler('gameEnd', this.onGameEnd.bind(this));
    this._commandWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._commandWindow);
};

Scene_File2.prototype.createListWindow = function() {
    var x = (Graphics.boxWidth - 480) / 2;
//    var x = 0;
    var y = 0;
    var width = Graphics.boxWidth;
    var height = 160;
    this._listWindow = new Window_Base(x,240,480,72);
	this._listWindow.drawText('中断セーブを行いますか？',48,y,width,height);
    this.addWindow(this._listWindow);
};

Scene_File2.prototype.savefileId = function() { return 1; };

Scene_File2.prototype.activateListWindow = function() {
    this._listWindow.activate();
};

Scene_File2.prototype.helpWindowText = function() {
    return '';
};

Scene_File2.prototype.firstSavefileIndex = function() {
    return 0;
};

Scene_File2.prototype.onSavefileOk = function() {

};

Scene_File2.prototype.onGameEnd = function() {
    this.fadeOutAll();
    SceneManager.goto(Scene_Title);
};

function Scene_aninterruption() {
    this.initialize.apply(this, arguments);
}

Scene_aninterruption.prototype = Object.create(Scene_File2.prototype);
Scene_aninterruption.prototype.constructor = Scene_aninterruption;

Scene_aninterruption.prototype.initialize = function() {
    Scene_File2.prototype.initialize.call(this);
};

Scene_aninterruption.prototype.mode = function() {
    return 'save';
};

Scene_aninterruption.prototype.helpWindowText = function() {
    return TextManager.saveMessage;
};

Scene_aninterruption.prototype.firstSavefileIndex = function() {
    return DataManager.lastAccessedSavefileId() - 1;
};

Scene_aninterruption.prototype.onSavefileOk = function() {
    Scene_File2.prototype.onSavefileOk.call(this);
    $gameSystem.onBeforeSave();
    if (DataManager.saveGame(this.savefileId())) {
        this.onSaveSuccess();
    } else {
       this.onSaveFailure();
    }
};

Scene_aninterruption.prototype.onSaveSuccess = function() {
    SoundManager.playSave();
	StorageManager.cleanBackup(this.savefileId());
	this.onGameEnd();
};

Scene_aninterruption.prototype.onSaveFailure = function() {
    SoundManager.playBuzzer();
    this.activateListWindow();
};

function Window_SavefileList2() {
    this.initialize.apply(this, arguments);
}

Window_SavefileList2.prototype = Object.create(Window_HorzCommand.prototype);
Window_SavefileList2.prototype.constructor = Window_SavefileList2;

Window_SavefileList2.prototype.initialize = function() {
    Window_HorzCommand.prototype.initialize.call(this, (Graphics.boxWidth - 480) / 2, 312);
};

Window_SavefileList2.prototype.windowWidth = function() {
    return 480;
};

Window_SavefileList2.prototype.maxCols = function() {
    return 3;
};

Window_SavefileList2.prototype.update = function() {
    Window_HorzCommand.prototype.update.call(this);
    if (this._commandWindow) {
        this._commandWindow.setCategory(this.currentSymbol());
    }
};

Window_SavefileList2.prototype.makeCommandList = function() {
            this.addCommand('はい', 'ok');
            this.addCommand('強制終了', 'gameEnd');
            this.addCommand('取消', 'cancel');
};

Window_SavefileList2.prototype.setItemWindow = function(commandWindow) {
    this._commandWindow = commandWindow;
    this.update();
};

})();

