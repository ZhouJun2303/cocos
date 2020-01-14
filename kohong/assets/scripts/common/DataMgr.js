var DataMgr = {
    reset(){
        this.currentLevel = 1;
        this.leftLipstick = 0;
        this.hitLipstick = 0;
    },

    currentLevel: 1, // 当前等级

    leftLipstick: 0, // 剩余的口红（可用的，出现未命中清0）
    hitLipstick: 0, // 命中口红
    
    // 关卡信息
    levelInfo:[
        {
            level: 1, 
            totalLipstick: 5,
            time: 30
        },
        {
            level: 2, 
            totalLipstick: 6, 
            time: 20
        },
        {
            level: 3, 
            totalLipstick: 7, 
            time: 10
        },
    ], // 关卡信息
};

export default DataMgr;