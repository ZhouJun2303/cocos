/*
 * @Copyright: Copyright (c) 2019
 * @Author: pgy
 * @Version: 1.0
 * @Date: 2019-05-21 15:41:00
 */


var LayerMgr = {

    /**
     * @description: 显示游戏开始弹窗
     * @param {number} level 关卡
     * @return: 
     */
    showLevelStart(level){
        if(cc.director.getScene().getChildByName('level_start') != null){
            return;
        }

        cc.loader.loadRes('remote/prefab/levelStart', (err, prefab) => {
            if(err){
                cc.error('remote/prefab/levelStart', err);
                return;
            }

            let node = cc.instantiate(prefab);
            node.parent = cc.director.getScene();
            node.name = 'level_start';

            node.getComponent('LevelStart').startShow(level);
        });
    },

    /**
     * @description: 显示游戏结束弹窗
     * @param {boolen} isSuccess 是否成功
     * @param {number} level 关卡
     * @param {function} againCallback 再次挑战回调
     * @return: 
     */
    showLevelEnd(isSuccess, level, againCallback){
        if(cc.director.getScene().getChildByName('level_end') != null){
            return;
        }

        cc.loader.loadRes('remote/prefab/levelEnd', (err, prefab) => {
            if(err){
                cc.error('remote/prefab/levelEnd', err);
                return;
            }

            let node = cc.instantiate(prefab);
            node.parent = cc.director.getScene();
            node.name = 'level_end';

            node.getComponent('LevelEnd').startShow(isSuccess, level, againCallback);
        });
    },

    /**
     * @description: 显示奖励
     * @param {number} score 积分
     * @return: 
     */
    showReward(score = 0){
        if(cc.director.getScene().getChildByName('reward') != null){
            return;
        }

        cc.loader.loadRes('remote/prefab/reward', (err, prefab) => {
            if(err){
                cc.error('remote/prefab/reward', err);
                return;
            }

            let node = cc.instantiate(prefab);
            node.parent = cc.director.getScene();
            node.name = 'reward';

            node.getComponent('Reward').startShow(score);
        });
    },

    /**
     * @description: 显示游戏规则
     * @return: 
     */
    showRule(){
        if(cc.director.getScene().getChildByName('rule') != null){
            return;
        }

        cc.loader.loadRes('remote/prefab/rule', (err, prefab) => {
            if(err){
                cc.error('remote/prefab/rule', err);
                return;
            }

            let node = cc.instantiate(prefab);
            node.parent = cc.director.getScene();
            node.name = 'rule';
        });
    },

    /**
     * @description: 显示记录
     * @return: 
     */
    showRecord(){
        if(cc.director.getScene().getChildByName('record') != null){
            return;
        }

        cc.loader.loadRes('remote/prefab/record', (err, prefab) => {
            if(err){
                cc.error('remote/prefab/record', err);
                return;
            }

            let node = cc.instantiate(prefab);
            node.parent = cc.director.getScene();
            node.name = 'record';
        });
    },

    /**
     * @description: 显示提示框
     * @return: 
     */
    showMsgBox(score = 0){
        if(cc.director.getScene().getChildByName('msgbox') != null){
            return;
        }

        cc.loader.loadRes('remote/prefab/msgBox', (err, prefab) => {
            if(err){
                cc.error('remote/prefab/msgBox', err);
                return;
            }

            let node = cc.instantiate(prefab);
            node.parent = cc.director.getScene();
            node.name = 'msgbox';

            node.getComponent('MsgBox').startShow(score);
        });
    },
}

export default LayerMgr;