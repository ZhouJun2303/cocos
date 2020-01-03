// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.Init();
    },

    start () {
        this.schedule(()=>
        {
            cc.tool.get_Mobilephone_size();
        },0);
    },

    text()
    {
        //cc.rtData.tool.Progress_bar_control(cc.find("Canvas"),2);
        //cc.tool.loadPrefabsDir("prefab/Common"); 

        cc.Bomb_Box.load_Promptbox(cc.find("Canvas/uiNode"),"啊啊啊啊啊啊！！！！",null,function()
        {

        });
    },

    //初始化游戏所需数据
    Init()
    {
        //初始化用户数据
        cc.rtData = {};

        //初始化通用工具方法
        cc.tool = require("Tool");

        //初始化label逐步显示方法
        cc.rtData.label_tool = require("label_tool");

        //初始化网络方法   引入websoket方法 
        cc.NetWork = require("ClientWS");

        //弹框处理
        cc.Bomb_Box = require("Bomb_Box");
       
    },

    // update (dt) {},
});
