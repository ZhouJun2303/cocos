const Utils = require('../utils.js');

cc.Class({
    extends: cc.Component,
    properties: {
        canvas: {
            default: null,
            type: cc.Node
        },
        btn1: {
            default: null,
            type: cc.Node
        },
        scoreLabel: {
            default: null,
            type: cc.Label
        },
        bestScore: {
            default: null,
            type: cc.Label
        }
    },
    onLoad() {
        let bestScore = Utils.GD.userGameInfo.snakeBestScore || 0;

        let theScore = this.canvas.getComponent("snake_game").score;
        this.scoreLabel.string = "Score:" + theScore.toString();

        if (theScore > bestScore) {
            bestScore = theScore;
            Utils.GD.updateGameScore({snakeBestScore: bestScore}, () => {
                Utils.GD.setUserGameInfo('snakeBestScore', bestScore);
                console.log('保存成功');
            })
        };

        this.bestScore.string = 'best:' + bestScore;

        this.btn1.on(cc.Node.EventType.TOUCH_START, (e) => {
            this.node.runAction(
                cc.sequence(
                    cc.fadeOut(0.2),
                    cc.callFunc(() => {
                        // 加载列表
                        this.node.active = false;
                        cc.director.loadScene('snake');
                    }, this)
                )
            )
        }, this)
    },
    backToList() {
        cc.director.loadScene('startscene');
    }
})
