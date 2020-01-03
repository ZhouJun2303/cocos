const POOLINITCOUNT = 15;
const globals = require('skysc_globals');
const Utils = require('../utils.js');
cc.Class({
    extends: cc.Component,
    properties: {
        blockTmpCtn: {
            default: null,
            type: cc.Node
        },
        blockPb: {
            default: null,
            type: cc.Prefab
        },
        camera: {
            default: null,
            type: cc.Camera
        },
        cameraSpeed: 200,
        crane: {
            default: null,
            type: cc.Node
        },
        craneRotation: {
            default: null,
            type: require('crane_rotate')
        },
        hpUi: {
            default: null,
            type: cc.Label
        },
        scoreUi: {
            default: null,
            type: cc.Label
        },
        hp: 0,
        score: 0,
        blockContainer: {
            default: null,
            type: cc.Node
        },
        gameOverMask: {
            default: null,
            type: cc.Node
        },
        maskCurrScore: {
            default: null,
            type: cc.Label
        },
        maskBestScore: {
            default: null,
            type: cc.Label
        }
    },
    onLoad() {
        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = 0;

        globals.gm = this;
        this.state = 1;
        this.isPut = false;
        this.putCount = 0; //生成并释放的总个数（包括失败）
        this.succeedPutCount = 0; //放置成功个数
        this.isSucceed = true; //放置是否成功
        this.prevBlock = '';
        this.bestScore = Utils.GD.userGameInfo.skyscraperBestScore || 0;

        this.node.on(cc.Node.EventType.TOUCH_END, this.putNext, this);

        this.poolBlock = new cc.NodePool();
        for (let i = 0; i < POOLINITCOUNT; i++) {
            let blockPb = cc.instantiate(this.blockPb);
            this.poolBlock.put(blockPb);
        }
    },
    start() {
        this.craneRotation.craneStrRotate();
        this.updateUi();
        this.generateBlock();
    },
    //重新装载
    generateBlock() {
        this.crane.runAction(cc.fadeIn(.2));
        if (this.waitBlock && this.isSucceed) {
            let rgBody = this.waitBlock.getComponent(cc.RigidBody);
            rgBody.type = cc.RigidBodyType.Static;
        };
        if (this.poolBlock.size() > 0) {
            this.waitBlock = this.poolBlock.get();
        } else {
            this.waitBlock = cc.instantiate(this.blockPb);
        };
        this.blockJsComp = this.waitBlock.getComponent("skysc_block");
        this.blockJsComp.init();
        this.waitBlock.rotation = 0;
        this.waitBlock.setPosition(cc.v2(0, 0));
        this.waitBlock.parent = this.blockTmpCtn;
        this.isPut = true;
        this.isSucceed = true;
    },
    backObjPool(nodeInfo) {
        this.poolBlock.put(nodeInfo);
    },
    //放置
    putNext(e) {
        if (this.state == 1 && this.isPut) {
            this.crane.runAction(cc.fadeOut(.2));
            this.isPut = false;
            this.putCount++;
            this.waitBlock.rotation = 0;
            const rigidbody = this.waitBlock.addComponent(cc.RigidBody); //添加刚体
            const box = this.waitBlock.addComponent(cc.PhysicsBoxCollider); //添加碰撞体
            rigidbody.gravityScale = 9.8;
            rigidbody.enabledContactListener = true;
            rigidbody.type = cc.RigidBodyType.Dynamic;
            box.friction = 1;
            box.size = this.blockJsComp.colliderSize;
            box.tag = 101;
            box.apply();
            this.waitBlock.parent = this.blockContainer;
        }
    },
    //视野移动
    move() {
        if (this.putCount > 1 && this.succeedPutCount >= 3) {
            let i = this.succeedPutCount - 2;
            if (i < 0) i = 0;
            let time = this.blockJsComp.colliderSize.height / this.cameraSpeed;
            this.camera.node.stopAllActions();
            this.crane.stopAllActions();
            let actionMove = cc.moveTo(time, cc.v2(0, this.blockJsComp.colliderSize.height * i));
            this.crane.runAction(actionMove);
            actionMove = cc.moveTo(time, cc.v2(0, this.blockJsComp.colliderSize.height * i));
            this.camera.node.runAction(actionMove);
        }
    },
    //放置成功
    handleResult(isPrefect) {
        if (this.isSucceed) {
            this.succeedPutCount++;
            this.craneRotation.switchDifficulty(); //判断切换吊机旋转速度角度
            if (this.prevBlock) this.prevBlock.getComponent(cc.PhysicsBoxCollider).tag = 100;
            this.waitBlock.getComponent(cc.PhysicsBoxCollider).tag = 102;
            this.prevBlock = this.waitBlock;
            this.score = this.score + (isPrefect ? 10 : 1);
        } else {
            // console.log("放置失败！");
        };
        this.updateUi();
        this.move();
        this.scheduleOnce(() => {
            this.generateBlock();
        }, 0.3)
    },
    updateUi() {
        this.hpUi.string = this.hp;
        this.scoreUi.string = this.score;
        this.maskCurrScore.string = 'Current score: ' + this.score;
        this.maskBestScore.string = 'Best score: ' + this.bestScore;
    },
    gameOverHandle() {
        this.state = 2;
        this.isPut = false;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScore();
        };
        this.gameOverMask.active = true;
        this.gameOverMask.opacity = 1;
        this.gameOverMask.runAction(cc.fadeIn(.3));
        this.updateUi();
    },
    restartTheGame() {
        cc.director.loadScene('skyscraper_game');
    },
    backStartPage() {
        cc.director.loadScene('skyscraper_start');
    },
    updateBestScore() {
        const self = this;
        Utils.GD.updateGameScore({
            skyscraperBestScore: self.bestScore
        }, () => {
            Utils.GD.setUserGameInfo('skyscraperBestScore', self.bestScore);
            console.log('保存成功')
        })
    }
})