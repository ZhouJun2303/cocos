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
        Promptbox_str : cc.Label, //提示内容显示节点

        Promptbox_btn_confirm : cc.Node, //确定按钮

        Promptbox_btn_cancel : cc.Node, //取消按钮

        _callBack: null,//回调函数
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //设置拦截弹框大小
        cc.tool.setImgSize(cc.find("blockinput",this.node));
    },

    onclick(btn,data)
    {
        if(this._callBack)
        {
            this._callBack(data);
        }
        this.node.destroy();
    },
    
    set_Box_str(str)
    {
        this.Promptbox_str.string = str;
    },

    /**
     * 
     * @param {设置样式  1：只有确定按钮   2： 只有取消按钮  4： 确定和取消按钮都有   默认样式4} style 
     */
    set_Box_style(style)
    {
        style =  style == null ? style = 4 : style;
        var size = this.node.width / 2; 
        if(style == 1)
        {
            this.Promptbox_btn_cancel.active = false;
            this.Promptbox_btn_confirm.y = size
        }
        else if(style == 2)
        {
            this.Promptbox_btn_confirm.active = false;
            this.Promptbox_btn_cancel.y = size
        }
        else if(style == 4)
        {
            //默认样式4  不需要做处理
        }
        else
        {
            cc.log("暂时无改样式，请重新设置");
            return ;
        }
    },

    //初始化弹框节点
    Init(str,style,callBack)
    {
        //设置弹框内容
        this.set_Box_str(str);

        //设置弹框样式
        this.set_Box_style(style);

        //设置弹框回调
        this._callBack = callBack;
    },

    // update (dt) {},
});
