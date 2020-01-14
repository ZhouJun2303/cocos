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
        this._SuccessCallback = null;
        this._FailCallback = null;
    },

    start () {

    },

    // update (dt) {},

    /**
     * 当碰撞产生的时候调用
     * @param  {Collider} other 产生碰撞的另一个碰撞组件
     * @param  {Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionEnter: function (other, self) {
        // 未击中
        if(other.node.group == 'hold'){
            // 撞飞
            this.node.stopAllActions();
            let seq = cc.sequence(
                cc.repeat(cc.spawn(cc.rotateBy(0.1, 90), cc.moveBy(0.1, 100, -100)), 10),
                cc.removeSelf(),
            );
            this.node.runAction(seq);

            if(this._FailCallback != null){
                this._FailCallback();
            }
        }

        // 击中
        else if(other.node.group == 'plate'){
            if(this._SuccessCallback != null){
                this._SuccessCallback();
            }
        }
    },
    /**
     * 当碰撞产生后，碰撞结束前的情况下，每次计算碰撞结果后调用
     * @param  {Collider} other 产生碰撞的另一个碰撞组件
     * @param  {Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionStay: function (other, self) {
        // console.log('on collision stay');
    },
    /**
     * 当碰撞结束后调用
     * @param  {Collider} other 产生碰撞的另一个碰撞组件
     * @param  {Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionExit: function (other, self) {
        // console.log('on collision exit');
    },

    /**
     * @description: 设置回调
     * @param {object} obj 回调参数
     * @param {function} obj.success 成功回调
     * @param {function} obj.fail 失败回调
     * @return: 
     */
    setCallback(obj){
        this._SuccessCallback = obj.success;
        this._FailCallback = obj.fail;
    },
});
