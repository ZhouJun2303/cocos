/*
websocket 模块
 */

var webSocket = WebSocket || window.WebSocket || window.MozWebSocket;

const ClientWS = {
    //socket
    mSocket: null,
    //是否开启标志
    mIsOpen: false,
    //是否运行标志
    mIsRunning: false,

    //回调函数
    //连接成功
    mOnConnected: null,
    //接收消息
    mOnMessage: null,
    //错误触发
    mOnError: null,
    //连接关闭
    mOnClosed: null,

    //网络模块初始化
    init: function(thost, tOnConnected, tOnMessage, tOnError, tOnClosed) {
        //判断 是否已连接
        if (true == this.mIsOpen) {
            return this.mIsRunning;
        }
        console.log("ClientWS init:" + thost);
        try {
            //创建新的socket
            this.mSocket = new webSocket(thost,"xujialong");

            //设置 binaryType 为 arraybuffer
            this.mSocket.binaryType = 'arraybuffer';

            //记录回调函数
            //连接成功
            this.mOnConnected = tOnConnected;
            //接收消息
            this.mOnMessage = tOnMessage;
            //错误触发
            this.mOnError = tOnError;
            //连接关闭
            this.mOnClosed = tOnClosed;

            //设置 回调
            this.mSocket.onopen = this.OnConnected.bind(this);
            this.mSocket.onmessage = this.OnMessage.bind(this);
            this.mSocket.onerror = this.OnError.bind(this);
            this.mSocket.onclose = this.OnClosed.bind(this);

            //设置开启标志
            this.mIsOpen = true;
        } catch (error) {
            console.log("ClientWS error:" + error);
        }

        cc.log("ClientWS init return:", this.mIsRunning);
        return this.mIsRunning;
    },

    //client 连接成功事件
    OnConnected: function(env) {

        //设置运行标志
        this.mIsRunning = true;
        //调用回调函数
        if (this.mOnConnected) {
            this.mOnConnected(env)
        }
        cc.log("连接成功");
    },

    //client 收到消息事件
    OnMessage: function(env) {
        if (cc.show_log)
            console.log("ClientWS OnMessage env" + env);
        //调用回调函数
        if (this.mOnMessage) {
            this.mOnMessage(env.data)
        }
    },

    //client 出错事件
    OnError: function(env) {
        if (null !== this.mSocket) {
            try {
                this.mSocket.close();
            } catch (error) {}
        }
        console.log("连接出错" + env);
        //设置运行标志
        this.mIsRunning = false;
        //调用回调函数
        if (this.mOnClosed) {
            this.mOnClosed(env)
        }
    },

    //client 关闭事件
    OnClosed: function(env) {
        if (null !== this.mSocket) {
            try {
                this.mSocket.close();
            } catch (error) {}
        }
        if (cc.show_log)
            console.log("ClientWS OnClosed env" + env);
        //设置运行标志
        this.mIsRunning = false;
        //调用回调函数
        if (this.mOnClosed) {
            this.mOnClosed(env)
        }
    },

    //消息发送
    sendMsg: function(data) {
        this.mSocket.send(data);
    },

    //关闭
    close: function() {
        //关闭 socket
        this.mSocket.close();
        //设置开启标志
        this.mIsOpen = false;
        //删除 socket
        this.mSocket = null;
        //设置运行标志
        this.mIsRunning = false;

        //清除 回调函数
        //连接成功
        this.mOnConnected = null;
        //接收消息
        this.mOnMessage = null;
        //错误触发
        this.mOnError = null;
        //连接关闭
        this.mOnClosed = null;
    },

}

module.exports = ClientWS;