// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

// import HttpMgr from 'HttpMgr';
// import tioMgr from 'tioMgr';
// import DataMgr from 'DataMgr';
// import Utils from 'Utils';
// import Http from 'Http';

cc.Class({
    extends: cc.Component,

    properties: {
        progressBar: {
            default: null,
            type: cc.ProgressBar,
            tooltip: "加载进度"
        },

        labelProgress: {
            default: null,
            type: cc.Label,
            tooltip:"加载进度"
        },

        _progress: {
            default: 0,
            visible: false,
            tooltip: "进度"
        },

        _isLoading: {
            default: false,
            tooltip: "是否正在加载"
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 屏蔽触摸事件
        this.node.on(cc.Node.EventType.TOUCH_START, event => {
            event.stopPropagation();
        });
    },

    start () {
        this.startPreload();
    },

    update (dt) {
        // 更新资源加载进度
        if(this._isLoading){
            this.setProgress();
        }
    },

    setProgress(){
        this.labelProgress.string = Math.floor(this._progress * 100) + "%";
        this.progressBar.progress = this._progress;
    },

    /**
     * 开始加载资源
     *
     */
    startPreload(){
        this._isLoading = true;

        cc.loader.loadResDir("remote",
            // 加载进度
            ( completedCount, totalCount,  item ) => {
                if(this._isLoading){
                    this._progress = completedCount * 1.0 / totalCount;
                }
            },

            // 加载完成
            (err, assets) => {
                this._progress = 1;
                this.onLoadComplete();
            }
        );
    },


    /**
     * 加载完成
     *
     */
    onLoadComplete(){
        this.setProgress();
        this._isLoading = false;

        cc.director.loadScene('home');
    },

    onDisable(){

    },
});
