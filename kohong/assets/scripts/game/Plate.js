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
        nodeLipStick: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.RADIUS = this.node.getComponent(cc.CircleCollider).radius;
        this._lipstick = [];
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
        if(other.node.group == 'fire'){
            other.node.removeFromParent();
            this.addLipstickByDegrees(180 - this.node.rotation);
            this.node.runAction(cc.sequence(cc.moveBy(0.05, 0, 15), cc.moveBy(0.05, 0, -15)));       
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
     * @description: 根据角度添加口红
     * @param {number} degrees 角度
     * @return: 
     */
    addLipstickByDegrees(degrees){
        let radians = cc.misc.degreesToRadians(degrees);
        let node = cc.instantiate(this.nodeLipStick);
        node.x = this.RADIUS * Math.sin(radians);
        node.y = this.RADIUS * Math.cos(radians);
        node.rotation = degrees;
        node.active = true;
        node.parent = this.node;
        this._lipstick.push(node);
    },

    /**
     * @description: 移除所有口红
     * @param {type} 
     * @return: 
     */
    removeAllLipstick(){
        if(this._lipstick == null){
            return;
        }
        
        this._lipstick.forEach( ele => {
            ele.removeFromParent();
        })
        this._lipstick = [];
    },
});
