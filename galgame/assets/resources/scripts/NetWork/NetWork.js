/*
网络处理模块
 */

const NetWork = {
    //引用 客户端模块 websocket
    mClient: require("ClientWS"),
    //引用 客户端消息 加解码模块
    mMsgParser: require("MsgParserWS"),
    //是否开启标志
    mIsOpen: false,
    //是否运行标志
    mIsRunning: false,
    //是否发送心跳
    mHeartFlag: false,
    //当前host
    mHost: "",
    //重连标志
    mReConnectFlag: false,
    //心跳间隔时间 1S
    mRefreshInvl: 1000,
    //上次消息接收时间(单位ms)
    mLastRecvTime: 0,
    //最长无消息等待时间(即多长时间无消息，则进行重连) 单位ms
    mMaxNoMsgWaitTime: 5000,
    //当前网络类型
    mNetType: 0,
    //重连提示
    mLoadNode: null,
    mLoading: false,

    //当前 强制需回复消息序号
    mForceMsgIndex: 0,

    //重连操作 回调函数
    mFuncReConnect: null,
    //消息解析 回调函数
    mFuncOnMessage: null,
    //网络出错 回调函数
    mFuncOnClosed: null,

    //消息处理函数列表
    _onMessageFuncList: {},

    //消息缓冲区
    _msgBuffer: {},
    //消息缓冲区读指针
    _msgBufferReadPos: 0,
    //消息缓冲区写指针
    _msgBufferWritePos: 0,
    //消息缓冲区中消息 最长等待时间
    _msgBufferMaxWaitTime: 5000,
    //消息缓冲区中消息 最短等待时间
    _msgBufferMinWaitTime: 100,
    //消息是否需要缓冲计数器
    _msgBufferOpenCt: 0,
    //消息缓冲区开启标志
    _msgBufferOpened: false,
    //消息缓冲区等待时间(单位ms)，超过时间后消息会被弹出处理
    _msgBufferWaitTime: 0,
    //消息缓冲区上次消息弹出时间戳
    _msgBufferLastPopTime: 0,

    _reconnectInfo: [],

    //开启 消息缓冲区 等待模式
    OpenMsgBuffer: function(tMaxWaitTime) {
        //缓冲消息 最大等待时间设置
        if (null == tMaxWaitTime) {
            tMaxWaitTime = this._msgBufferMaxWaitTime;
        }

        //消息缓冲区等待时间 设置
        this._msgBufferWaitTime = tMaxWaitTime;
        //设置 消息是否需要缓冲计数器
        this._msgBufferOpenCt++;

        //开启 处理心跳
        this._msgBufferHeart()
        cc.log("on OpenMsgBuffer");
    },

    //关闭 消息缓冲区 等待模式
    CloseMsgBuffer: function(tMinWaitTime) {
        //缓冲消息 最大等待时间设置
        if (null == tMinWaitTime) {
            tMinWaitTime = this._msgBufferMaxWaitTime;
        }

        //设置 消息是否需要缓冲计数器
        this._msgBufferOpenCt--;

        //如果消息缓冲区开启计数器归零，重置消息处理等待时间
        if (this._msgBufferOpenCt <= 0) {
            //消息缓冲区等待时间 设置
            this._msgBufferWaitTime = tMinWaitTime;
        }
        cc.log("on CloseMsgBuffer ! this._msgBufferOpenCt=%d", this._msgBufferOpenCt);
    },

    //清除缓冲区
    _clearMsgBuffer: function() {
        //清理缓冲变量
        //消息缓冲区
        this._msgBuffer = {};
        //消息缓冲区读指针
        this._msgBufferReadPos = 0;
        //消息缓冲区写指针
        this._msgBufferWritePos = 0;
        //消息是否需要缓冲计数器
        this._msgBufferOpenCt = 0;
        //消息缓冲区开启标志
        this._msgBufferOpened = false;
        //消息缓冲区已等待时间
        this._msgBufferWaitTime = 0;
    },

    //消息缓冲区 处理心跳
    _msgBufferHeart: function() {

        let self = this;

        //处理心跳已开启 直接退出
        if (this._msgBufferOpened == true) {
            return;
        } else {
            //设置处理心跳开启标志
            this._msgBufferOpened = true;
            //消息缓冲区上次消息弹出时间戳
            this._msgBufferLastPopTime = (new Date()).getTime();
        }

        //发送 心跳消息
        let tryMsgBufferHeart = function() {
            //cc.log("on _msgBufferHeart ! this._msgBufferOpenCt=%d _msgBufferReadPos=%d _msgBufferWritePos=%d _msgBufferWaitTime=%d", self._msgBufferOpenCt, self._msgBufferReadPos, self._msgBufferWritePos ,self._msgBufferWaitTime);
            //判断 可以停止 消息缓冲区心跳
            if ((self._msgBufferOpenCt <= 0) && (self._msgBufferReadPos >= self._msgBufferWritePos)) {
                //退出心跳
                clearTimeout(tryMsgBufferHeart);
                //清理缓冲变量
                //消息缓冲区
                self._msgBuffer = {};
                //消息缓冲区读指针
                self._msgBufferReadPos = 0;
                //消息缓冲区写指针
                self._msgBufferWritePos = 0;
                //消息是否需要缓冲计数器
                self._msgBufferOpenCt = 0;
                //消息缓冲区开启标志
                self._msgBufferOpened = false;
                //消息缓冲区已等待时间
                self._msgBufferWaitTime = 0;
                return;
            }

            //判断 是否有消息在缓冲区内需要处理
            if (self._msgBufferReadPos < self._msgBufferWritePos) {
                //判断 是否需要强制处理缓冲区消息
                let tNowTime = (new Date()).getTime();
                //上次消息接收时间 距离现在已超过限制时间
                if ((tNowTime - self._msgBufferLastPopTime) > self._msgBufferWaitTime) {
                    //消息缓冲区
                    if (self._msgBuffer[self._msgBufferReadPos]) {
                        let tMsgKey = self._msgBuffer[self._msgBufferReadPos].MsgKey;
                        let tMsgData = self._msgBuffer[self._msgBufferReadPos].MsgData;
                        //cc.log("on _msgBufferHeart ! %s", tMsgKey);
                        //函数 存在 调用该处理函数
                        if (self._onMessageFuncList && self._onMessageFuncList[tMsgKey]) {
                            cc.log("on message Log : ", tMsgData);
                            self._onMessageFuncList[tMsgKey](tMsgData);
                        } else {
                            if (cc.show_log)
                                cc.log("on _msgBufferHeart err! %s is not exsit!", tMsgKey);
                        }
                        //处理消息 清理
                        self._msgBuffer[self._msgBufferReadPos] = null;
                        //读取指针+1
                        self._msgBufferReadPos++;
                    } else {
                        cc.log("on _msgBufferHeart ! _msgBufferReadPos=%d is null", self._msgBufferReadPos);
                        //消息缓冲区读指针
                        self._msgBufferReadPos++;
                    }
                    //弹出一条消息 进行处理
                    self._msgBufferLastPopTime = tNowTime;
                }
            }
            // 消息缓冲区心跳 100MS一次
            setTimeout(tryMsgBufferHeart, 100);
        };
        // 消息缓冲区心跳 100MS一次
        setTimeout(tryMsgBufferHeart, 100);
    },

    //添加 网络出错处理函数
    addOnClosedFunc: function(tFunc) {
        this.mFuncOnClosed = tFunc;
    },
    //删除 网络出错处理函数
    clearOnClosedFunc: function() {
        this.mFuncOnClosed = null;
    },

    //添加 重连操作处理函数
    addReConnectedFunc: function(tFunc) {
        this.mFuncReConnect = tFunc;
    },
    //删除 重连操作处理函数
    clearOnConnectedFunc: function() {
        this.mFuncReConnect = null;
    },

    //添加 消息处理函数
    addOnMessageFunc: function(tKey, tFunc) {
        this._onMessageFuncList[tKey] = tFunc;
    },
    //删除 消息处理函数
    clearOnMessageFunc: function() {
        this._onMessageFuncList = {};
    },

    //网络模块初始化
    init: function(thost) {
        //判断 是否已连接
        if (true == this.mIsOpen) {
            console.log("NetWork  return mIsOpen is true!!!! init:" + thost);
            return;
        }

        console.log("NetWork init:" + thost);

        //当前host
        this.mHost = thost;

        var self = this;

        //客户端模块 初始化
        this.mClient.init(thost, this.OnConnected.bind(this), this.OnMessage.bind(this), this.OnError.bind(this), this.OnClosed.bind(this));
    },

    //活动消息发送
    sendActMsg: function(tDestType, tBigCmd, tActID, tCmd, tData, tForceFlag) {
        tData.actCmd = tCmd;
        this.sendMsg(tDestType, tBigCmd, tActID, tData, tForceFlag);
    },

    //消息发送
    sendMsg: function(tDestType, tBigCmd, tCmd, tData, tForceFlag) {
   
        cc.log(this.isOpen())
        //消息 编码
        let tMsg ={ 
            x: tDestType,
            m: tBigCmd,
            z: tCmd, 
            data : tData
        };

    //    var  msg = {};
    //     msg.mainID = tDestType;
    //     msg.subID =  tBigCmd;
    //     msg.numID =  tCmd;

    //     msg.data = tData;
        
        this.mClient.sendMsg(JSON.stringify(tMsg));
    },

    isOpen() {
        if (this.mClient.mSocket && cc.sys.isObjectValid(this.mClient.mSocket)) {
            return this.mClient.mSocket.readyState === WebSocket.OPEN;
        } else {
            return false;
        }
    },

    /*
        0 (CONNECTING)
        正在链接中
        1 (OPEN)
        已经链接并且可以通讯
        2 (CLOSING)
        连接正在关闭
        3 (CLOSED)
        连接已关闭或者没有链接成功
    */
    //获取当前强连接的连接状态
    GetNetState() {
        return this.mClient.mSocket.readyState;
    },

    //client 连接成功事件
    OnConnected: function(env) {
        //连接成功 向用户服务器 发送1-1 用户登录
        // if (cc.show_log)
        console.log("start sendUserLoginReq");
        //重连标志 设置
        this.mReConnectFlag = false;
        //设置运行标志
        this.mIsRunning = true;
        //设置连接状态
        this.mIsOpen = true;

        //上次消息接收时间
        this.mLastRecvTime = (new Date()).getTime();


        if (cc.gblData && cc.rtData.UserInfos) {
            // if (cc.show_log)
            console.log("sendUserLoginReq");
            let conf = cc.sys.localStorage.getItem('reconnect_info');
            cc.sys.localStorage.setItem('reconnect_info', "");
            let tReConnectStr
            if (this._reconnectInfo.length > 0) {
                let tReConnectInfo = { func: "OnConnected", t: new Date().getTime() };
                this._reconnectInfo.push(tReConnectInfo);
                tReConnectStr = JSON.stringify(this._reconnectInfo);
            }
            this._reconnectInfo = [];
            //发送登录消息
            this.sendMsg(cc.gblData.GlobalConfig.SERVICE_TYPE_USER,
                cc.gblData.GlobalConfig.MSG_BIG_CMD_LOGIN,
                cc.gblData.GlobalConfig.MSG_CMD_LOGIN, { u: cc.rtData.UserInfos.uid, t: cc.rtData.UserInfos.token, rs: conf + tReConnectStr });
        }
        // if (cc.show_log)
        console.log("end sendUserLoginReq");
        // if (cc.show_log)
        console.log("NetWork OnConnected this.mIsRunning =" + this.mIsRunning);
        //删除重连等待界面
        if (this.mLoadNode) {
            cc.find("Canvas/view/topNode").removeChild(this.mLoadNode);
            this.mLoadNode.getComponent("loadingNode").putItem();
            this.mLoadNode = null;
        }
    },

    //消息处理
    _dealMessage: function(tMsgKey, tMsgData) {
        //判断 消息缓冲区是否开启 或者消息缓冲区中还有遗留消息
        if ((this._msgBufferOpenCt > 0) || ((this._msgBufferReadPos < this._msgBufferWritePos))) {
            //cc.log("on _dealMessage err! %s _msgBufferWritePos=%d", tMsgKey, this._msgBufferWritePos);
            //消息缓冲区
            this._msgBuffer[this._msgBufferWritePos] = { MsgKey: tMsgKey, MsgData: tMsgData };
            //消息缓冲区写指针
            this._msgBufferWritePos++;
        } else {
            //函数 存在 调用该处理函数
            if (this._onMessageFuncList && this._onMessageFuncList[tMsgKey]) {
                cc.log("on message Log : ", tMsgData);
                this._onMessageFuncList[tMsgKey](tMsgData);
            } else {
                if (cc.show_log)
                    cc.log("on message err! %s is not exsit!", tMsgKey);
            }
        }
    },

    //client 收到消息事件
    OnMessage: function(data) {       
        var tK = JSON.parse(data);
        var tKey = tK.x + "_" + tK.m + "_" + tK.z; 
        //函数 存在 调用该处理函数
        if (this._onMessageFuncList && this._onMessageFuncList[tKey]) {
            this._onMessageFuncList[tKey](tK.data);
        } else {
                cc.log("on message err! %s is not exsit!", data);
        }
                
    },

    //模拟消息
    SimulateMessage: function(tBigCmd, tCmd, tMsg) {
        //触发消息回调函数
        let tKey = tBigCmd.toString() + "_" + tCmd.toString();

        //函数 存在 调用该处理函数
        if (this._onMessageFuncList && this._onMessageFuncList[tKey]) {
            this._onMessageFuncList[tKey](tMsg);
        } else {
            if (cc.show_log)
                cc.log("on SimulateMessage err! %s is not exsit!", tKey);
        }
    },

    //client 出错事件
    OnError: function(env) {
        if (null !== this.mClient) {
            try {
                this.mClient.close();
            } catch (error) {}
        }
        cc.log("NetWork OnError env=%#v", env);
        //设置运行标志
        this.mIsRunning = false;
        //关闭心跳
        this.mHeartFlag = false;
        //调用 网络关闭处理函数
        if (this.mFuncOnClosed) {
            this.mFuncOnClosed();
        }

        let tReConnectInfo = { func: "OnError", t: new Date().getTime() };
        this._reconnectInfo.push(tReConnectInfo);
        //重连
        this.ReConnect();
    },

    //client 关闭事件
    OnClosed: function(env) {
        if (null !== this.mClient) {
            try {
                this.mClient.close();
            } catch (error) {}
        }
        cc.log("NetWork OnClosed env=%#v", env);
        //设置运行标志
        this.mIsRunning = false;
        //关闭心跳
        this.mHeartFlag = false;
        //调用 网络关闭处理函数
        if (this.mFuncOnClosed) {
            this.mFuncOnClosed();
        }

        let tReConnectInfo = { func: "OnClosed", t: new Date().getTime() };
        this._reconnectInfo.push(tReConnectInfo);

        //重连
        this.ReConnect();
    },

    //网络心跳
    OnHeart: function() {

        let self = this;

        //发送 心跳消息
        let trySendHeart = function() {

            //判断 是否需要重连
            let tNowTime = (new Date()).getTime();
            //上次消息接收时间 距离现在已超过限制时间
            if ((tNowTime - self.mLastRecvTime) > self.mMaxNoMsgWaitTime) {
                let tReConnectInfo = { func: "OnHeart", t: tNowTime, lt: self.mLastRecvTime, mt: self.mMaxNoMsgWaitTime };
                self._reconnectInfo.push(tReConnectInfo);
                //触发重连
                self.ReConnect();
                //退出心跳
                clearTimeout(trySendHeart);
                return;
            }
            // var retDate = new Date();
            // var m = "";
            // if(parseInt(retDate.getMinutes()) < 10)
            // {
            //     m = "0"+retDate.getMinutes();
            // }
            // else
            // {
            //     m = retDate.getMinutes()
            // }
            // cc.log(retDate.getFullYear()+"-"+ (retDate.getMonth()+ 1) +"-"+retDate.getDate()+"      "+retDate.getHours()+":"+ m + ":"+ retDate.getSeconds() );
            //判断是否需要心跳
            if (self.mHeartFlag == true) {
                self.sendMsg(cc.gblData.GlobalConfig.SERVICE_TYPE_NETGATE,
                    cc.gblData.GlobalConfig.MSG_BIG_CMD_LOGIN,
                    cc.gblData.GlobalConfig.MSG_CMD_HEART, { u: cc.rtData.UserInfos.uid, t: new Date().getTime() });
                //发送 心跳消息 3S一次
                setTimeout(trySendHeart, self.mRefreshInvl);

            }
        };
        //发送 心跳消息 3S一次
        setTimeout(trySendHeart, self.mRefreshInvl);
    },

    //关闭连接
    Close: function() {
        console.log("NetWork Close");

        if (null !== this.mClient) {
            try {
                this.mClient.close();
            } catch (error) {}
        }

        //设置运行标志
        this.mIsRunning = false;
        //关闭心跳
        this.mHeartFlag = false;
        //设置开启标志
        this.mIsOpen = false;
    },

    //继续重连
    RetryReConnect: function() {
        //重连标志 设置
        this.mReConnectFlag = false;
        this.ReConnect();
    },

    //重连
    ReConnect: function() {
        //如果 重连中 直接返回
        if (this.mReConnectFlag) {
            cc.log("ReConnect out mReConnectFlag=true");
            return;
        }

        //清理消息缓冲区
        this._clearMsgBuffer();

        //重连标志 设置
        this.mReConnectFlag = true;
        //再次关闭连接
        this.Close();
        //清除 消息缓冲
        this.mMsgParser.freeBuffer();

        let self = this;
        let tRefreshInvl = 500; //500ms
        let tMaxRetryTimes = parseInt(60000 / tRefreshInvl); //尝试最大次数(进行1分钟的重连尝试)
        let tShowLoadTimes = parseInt(1500 / tRefreshInvl);
        let tretryTimes = 0;

        //重连 尝试函数
        let tryReConnect = function() {
           
        }
        //尝试重连 第一次 100ms 后开始
        setTimeout(tryReConnect, 100);
    },

    //网络检查
    NetCheck: function() {
        //判断 网络类型是否改变，如果改变需要进行重连
        if (this.mNetType == GetWifi.Type()) {
            let tReConnectInfo = { func: "NetCheck", t: new Date().getTime(), nt1: this.mNetType, nt2: GetWifi.Type() };
            this._reconnectInfo.push(tReConnectInfo);
            //重连
            this.ReConnect();
        }
    },

}

module.exports = NetWork;