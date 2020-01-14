// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

var DataMgr = require('DataMgr');
var LayerMgr = require('LayerMgr');

cc.Class({
    extends: cc.Component,

    properties: {
        nodePlate: cc.Node, // 板子
        nodeTouch: cc.Node, // 触摸节点
        nodeLipstick: cc.Node, // 口红位置
        prefabLipstick: cc.Prefab, // 口红预制
        nodeLipstickContainer: cc.Node, // 总共有多少口红容器
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        let mgr = cc.director.getCollisionManager();
        mgr.enabled = true;
        // mgr.enabledDebugDraw = true;
        // mgr.enabledDrawBoundingBox  = true;
    },

    start () {
        this.nodeTouch.getComponent('Touch').setCallback( () => {
            this.onTouchCallback();
        });       

        this.reloadUI();
        this.startRun();
    },

    // update (dt) {},

    startRun(){
        // 顺时针转一圈，再逆时针转一圈，如此反复
        this.nodePlate.stopAllActions();
        this.nodePlate.rotation = 0;

        let seq = cc.sequence(
            cc.rotateBy(4, 360).easing(cc.easeIn(1.5)),
            cc.rotateBy(4, -360).easing(cc.easeIn(1.5)),
        );
        this.nodePlate.runAction(seq.repeatForever());
    },

    /**
     * @description: 点击屏幕回调
     * @param {type} 
     * @return: 
     */
    onTouchCallback(){
        // 口红用完了
        if(DataMgr.leftLipstick <= 0){
            return;
        }

        if(this.nodeLipstick.active){
            let node = cc.instantiate(this.prefabLipstick);
            node.x = this.nodeLipstick.x;
            node.y = this.nodeLipstick.y;
            node.parent = this.nodeLipstick.parent;
            node.runAction(cc.moveTo(0.5, 0, this.nodePlate.y));
            node.getComponent('Lipstick').setCallback({
                success: () => {
                    this.onSuccessCallback();
                },
                fail: () => {
                    this.onFailCallback();
                }
            });
            DataMgr.leftLipstick--;
            
            let js = this.nodeLipstickContainer.getComponent('LipstickContainer');
            js.reload(DataMgr.leftLipstick, DataMgr.levelInfo[DataMgr.currentLevel - 1].totalLipstick);

            if(DataMgr.leftLipstick <= 0){
                this.nodeLipstick.active = false;
            }
            else{
                this.nodeLipstick.runAction(cc.sequence(
                    cc.hide(),
                    cc.delayTime(0.2),
                    cc.show(),
                ));
            }
            
        }
    },

    /**
     * @description: 重新加载UI
     * @param {type} 
     * @return: 
     */
    reloadUI(){       

        // 关卡信息
        let levelInfo = DataMgr.levelInfo[DataMgr.currentLevel - 1];

        // 游戏开始提示
        LayerMgr.showLevelStart(levelInfo.level);

        // 口红数量
        let js = this.nodeLipstickContainer.getComponent('LipstickContainer');
        js.reload(levelInfo.totalLipstick, levelInfo.totalLipstick);
        
        // 数据清理
        DataMgr.leftLipstick = levelInfo.totalLipstick;
        DataMgr.hitLipstick = 0;

        // 转盘
        this.nodePlate.getComponent('Plate').removeAllLipstick();

        this.nodeLipstick.active = (levelInfo.totalLipstick > 0);
    },


    /**
     * @description: 单个口红命中目标
     * @param {type} 
     * @return: 
     */
    onSuccessCallback(){
        DataMgr.hitLipstick++;

        if(DataMgr.hitLipstick == DataMgr.levelInfo[DataMgr.currentLevel - 1].totalLipstick){
            // 通关
            if(DataMgr.currentLevel == DataMgr.levelInfo[DataMgr.levelInfo.length - 1].level){
                LayerMgr.showReward(1);
                DataMgr.reset();
            }
            // 闯关
            else{
                DataMgr.currentLevel++;

                this.node.runAction(cc.sequence(
                    cc.callFunc( () => {
                        LayerMgr.showLevelEnd(true);
                    }),
                    cc.delayTime(1),
                    cc.callFunc( () => {
                        this.reloadUI();
                    }),
                ));
            }
        }

        // 未全部命中
        else{

        }
    },

    /**
     * @description: 单个口红未命中目标
     * @param {type} 
     * @return: 
     */
    onFailCallback(){
        LayerMgr.showLevelEnd(false);

        DataMgr.reset();
    },

});
