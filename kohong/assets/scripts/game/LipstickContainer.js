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
        spfLipstickIn: cc.SpriteFrame, // 未发射的口红
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this._leftCount = 0;
        this._totalCount = 0;
    },

    start () {

    },

    // update (dt) {},

    reload(left, total){
        if(left < 0 || total <= 0 || left > total){
            return;
        }

        this._leftCount = left;
        this._totalCount = total;
        this.node.removeAllChildren();

        let i = 0;
        while(i < left){
            let sp = this.getSpriteBySpriteFrame(this.spfLipstickIn);
            this.node.addChild(sp);
            i++;
        }
    },

    /**
     * @description: 根据纹理添加口红
     * @param {cc.SpriteFrame} spf 纹理
     * @return: 
     */
    getSpriteBySpriteFrame(spf){
        let node = new cc.Node();
        let sp = node.addComponent(cc.Sprite);
        sp.spriteFrame = spf;
        sp.sizeMode = cc.Sprite.SizeMode.RAW;
        sp.type = cc.Sprite.Type.SIMPLE;
        sp.trim = false;
        return node;
    },

    /**
     * @description: 获取没有消耗的口红
     * @param {type} 
     * @return: 
     */
    getLeftCount(){
        return this._leftCount;
    },

    /**
     * @description: 获取一开始有多少口红
     * @param {type} 
     * @return: 
     */
    getTotalCount(){
        return this._totalCount;
    },
});
