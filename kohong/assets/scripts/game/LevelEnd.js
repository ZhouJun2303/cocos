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
        nodeSuccess: cc.Node, // 成功
        nodeFail: cc.Node, // 失败
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.node.on(cc.Node.EventType.TOUCH_START, event => {
            event.stopPropagation();
        });
    },

    // update (dt) {},

    startShow(isSuccess){
        if(isSuccess){
            this.nodeSuccess.active = true;
            this.nodeFail.active = false;
    
            this.node.runAction(cc.sequence(
                cc.delayTime(1.1),
                cc.removeSelf(),
            ));
        }
        else{
            this.nodeSuccess.active = false;
            this.nodeFail.active = true;
        }        
    },

    onClick(event, data){
        switch(data){
            case 'home':{
                cc.director.loadScene('home');
                break;
            }
        }
    },
});
