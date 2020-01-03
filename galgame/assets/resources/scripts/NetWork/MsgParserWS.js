/*
MsgParserWS 模块

const (
	l_MSG_PAD1 = 0xDE //填充起始符1
	l_MSG_PAD2 = 0xDE //填充起始符2
	l_MSG_END  = 0xDE //消息头结束符
)

//消息结构体
type MessagesStruct struct {
	MsgPad1     uint8  //填充起始符1  0xDE
	MsgPad2     uint8  //填充起始符2  0xDE
	MsgNo       uint8  //当前消息在分隔消息中的序号(无分割消息时为0)
	MsgSum      uint8  //消息总条数(无分割消息时为0)
	MsgSysCmd   uint8  //系统指令号
	MsgDestType uint8  //目标服务器类型
	MsgBigCmd   uint8  //大指令号
	MsgCmd      uint16 //小指令号
	MsgSize     uint16 //消息内容长度
	MsgDest     uint16 //消息目标(c->s 功能服务器ID   s->c 网关服务器ID)
	MsgSrc      uint16 //消息来源(c->s 网关服务器ID   s->c 功能服务器ID)
	MsgRsv1     uint16 //预留位1
	MsgRsv2     uint16 //预留位2
	MsgCheck    uint32 //校验信息(c->s 消息校验信息   s->c 回应的消息序号   s->s 消息路由分配随机值)
	MsgIndex    uint32 //消息序号
	MsgUid      uint32 //用户数字ID
	MsgToken    uint32 //用户消息Token
	MsgTail     uint8  //消息头结束符  0xDE

	MsgData []byte //消息内容
}

 */

//let CryptoJS = require("../global/crypto-js");

const MsgParserWS = {
    //字节大小端顺序 true，小端字节序；false，大端字节序
    mLittleEndian: true,
    //消息解析缓冲，用于存储切分消息
    mMsgBuffer: {},

    //消息数据缓冲，存储消息的原数据，等待完整消息接收完成后，才进行消息的具体解析
    //消息内容的最大长度，防止异常数据
    _mMaxMessageDataSize: 4096,
    //原数据缓冲区
    _mMsgDataBuffer: null,
    //当前原数据读长度
    _mMsgDataBufferLength: 0,

    //
    //mCryptoJS : require("crypto-js"),
    // //网络模块初始化
    // init : function( ) {
    //     //如果返回true，就是小端字节序；如果返回false，就是大端字节序
    //     this.mLittleEndian = (function() {
    //         let buffer = new ArrayBuffer(2);
    //         new DataView(buffer).setInt16(0, 256, true);
    //         return new Int16Array(buffer)[0] === 256;
    //       })();
    // },

    //清空缓冲
    freeBuffer: function() {
        //清空缓冲
        this.mMsgBuffer = {};
    },

    //字符串 转 utf-8字节数组
    stringToBytes: function( str )  {  
        var bytes = new Array();
        var len, c;
        len = str.length;
        for (var i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 0x010000 && c <= 0x10FFFF) {
                bytes.push(((c >> 18) & 0x07) | 0xF0);
                bytes.push(((c >> 12) & 0x3F) | 0x80);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000800 && c <= 0x00FFFF) {
                bytes.push(((c >> 12) & 0x0F) | 0xE0);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000080 && c <= 0x0007FF) {
                bytes.push(((c >> 6) & 0x1F) | 0xC0);
                bytes.push((c & 0x3F) | 0x80);
            } else {
                bytes.push(c & 0xFF);
            }
        }
        return bytes;
    },

    //utf-8字节数组 转 字符串
    byteToString: function(arr) {
        if (typeof arr === 'string') {
            return arr;
        }
        var str = '',
            _arr = arr;
        for (var i = 0; i < _arr.length; i++) {
            var one = _arr[i].toString(2),
                v = one.match(/^1+?(?=0)/);
            if (v && one.length == 8) {
                var bytesLength = v[0].length;
                var store = _arr[i].toString(2).slice(7 - bytesLength);
                for (var st = 1; st < bytesLength; st++) {
                    store += _arr[st + i].toString(2).slice(2);
                }
                str += String.fromCharCode(parseInt(store, 2));
                i += bytesLength - 1;
            } else {
                str += String.fromCharCode(_arr[i]);
            }
        }
        return str;
    },

    //消息编码
    MsgEncode: function(tMsgHead, tMsgData) {
        //消息体转化为json字符串
        let tMsgStr = JSON.stringify(tMsgData);

        if (cc.show_log) {
            cc.rtData.Utils._log("tMsgStr=%s", tMsgStr);
        } else {
            if (tMsgData == null || typeof(tMsgData.t) == 'string') {
                cc.rtData.Utils._log("tMsgStr=%s", tMsgStr);
            }
        }


        let tMsgBytes = this.stringToBytes(tMsgStr);
        tMsgHead.MsgSize = tMsgBytes.length;
        let buffer = new ArrayBuffer(tMsgHead.MsgSize + 36);
        let dv = new DataView(buffer);

        //计算消息校验码
        let tTmpValue = 1515469118;
        for (let i = 0;
            (i < tMsgHead.MsgSize) && (i < 32); i++) {
            tTmpValue |= (tMsgBytes[i] * 1024);
        }
        if (cc.show_log)
            cc.rtData.Utils._log("tTmpValue=%d", tTmpValue);
        let tMsgCheck = 0;
        tMsgCheck = tMsgHead.MsgBigCmd |
            tMsgHead.MsgCmd |
            tMsgHead.MsgSize &
            tMsgHead.MsgToken |
            tTmpValue &
            1554777252;

        if (cc.show_log)
            cc.rtData.Utils._log("MsgBigCmd=%d MsgCmd=%d MsgSize=%d MsgIndex=%d MsgToken=%d tMsgCheck=%d", tMsgHead.MsgBigCmd, tMsgHead.MsgCmd, tMsgHead.MsgSize, tMsgHead.MsgIndex, tMsgHead.MsgToken, tMsgCheck);
        tMsgCheck = tMsgCheck % 20180109;

        if (cc.show_log)
            cc.rtData.Utils._log("tMsgCheck=%d ", tMsgCheck);
        /*
        DataView  set 方法 第三个参数 为false或者undefined表示使用大端字节序写入，true表示使用小端字节序写入
        */
        let tPos = 0;
        //先写入消息头
        // MsgPad1     uint8  //填充起始符1  0xDE
        dv.setUint8(tPos, 222, this.mLittleEndian);
        tPos++;
        // MsgPad2     uint8  //填充起始符2  0xDE
        dv.setUint8(tPos, 222, this.mLittleEndian);
        tPos++;
        // MsgNo       uint8  //当前消息在分隔消息中的序号(无分割消息时为0)
        dv.setUint8(tPos, 0, this.mLittleEndian);
        tPos++;
        // MsgSum      uint8  //消息总条数(无分割消息时为0)
        dv.setUint8(tPos, 0, this.mLittleEndian);
        tPos++;
        // MsgSysCmd   uint8  //系统指令号
        dv.setUint8(tPos, 0, this.mLittleEndian);
        tPos++;
        // MsgDestType uint8  //目标服务器类型
        dv.setUint8(tPos, tMsgHead.MsgDestType, this.mLittleEndian);
        tPos++;
        // MsgBigCmd   uint8  //大指令号
        dv.setUint8(tPos, tMsgHead.MsgBigCmd, this.mLittleEndian);
        tPos++;
        // MsgCmd      uint16 //小指令号
        dv.setUint16(tPos, tMsgHead.MsgCmd, this.mLittleEndian);
        tPos += 2;
        // MsgSize     uint16 //消息内容长度
        dv.setUint16(tPos, tMsgHead.MsgSize, this.mLittleEndian);
        tPos += 2;
        // MsgDest     uint16 //消息目标(c->s 功能服务器ID   s->c 网关服务器ID)
        dv.setUint16(tPos, 0, this.mLittleEndian);
        tPos += 2;
        // MsgSrc      uint16 //消息来源(c->s 网关服务器ID   s->c 功能服务器ID)
        dv.setUint16(tPos, 0, this.mLittleEndian);
        tPos += 2;
        // MsgRsv1     uint16 //预留位1
        dv.setUint16(tPos, 0, this.mLittleEndian);
        tPos += 2;
        // MsgRsv2     uint16 //预留位2
        dv.setUint16(tPos, 0, this.mLittleEndian);
        tPos += 2;
        // MsgCheck    uint32 //校验信息(c->s 消息校验信息   s->c 回应的消息序号   s->s 消息路由分配随机值)
        dv.setUint32(tPos, tMsgCheck, this.mLittleEndian);
        tPos += 4;
        // MsgIndex    uint32 //消息序号
        dv.setUint32(tPos, tMsgHead.MsgIndex, this.mLittleEndian);
        tPos += 4;
        // MsgUid      uint32 //用户数字ID
        dv.setUint32(tPos, tMsgHead.MsgUid, this.mLittleEndian);
        tPos += 4;
        // MsgToken    uint32 //用户消息Token
        dv.setUint32(tPos, tMsgHead.MsgToken, this.mLittleEndian);
        tPos += 4;
        // MsgTail     uint8  //消息头结束符  0xDE
        dv.setUint8(tPos, 222, this.mLittleEndian);
        tPos++;

        //MsgData []byte //消息内容
        for (var i = 0, strLen = tMsgBytes.length; i < strLen; i++) {
            dv.setUint8(tPos, tMsgBytes[i], this.mLittleEndian);
            tPos++;
        }

        return buffer;
    },

    //消息解码
    MsgDecode: function(tMsgHead, tMsgData) {
        //消息结构体
        let tMsg = {};
        tMsg.MsgHead = tMsgHead;

        //消息为 切分消息 需要拼接
        if (tMsg.MsgHead.MsgSum > 0) {
            if (tMsg.MsgHead.MsgNo > 0) {
                //将 消息内容加入到 缓冲中
                if (null == this.mMsgBuffer[tMsg.MsgHead.MsgIndex]) {
                    this.mMsgBuffer[tMsg.MsgHead.MsgIndex] = {};
                    this.mMsgBuffer[tMsg.MsgHead.MsgIndex].MsgNum = 0;
                }
                //记录数据
                this.mMsgBuffer[tMsg.MsgHead.MsgIndex][tMsg.MsgHead.MsgNo] = tMsgData;
                //记录条数
                this.mMsgBuffer[tMsg.MsgHead.MsgIndex].MsgNum++;
                //判断是否 已接收完成
                if (this.mMsgBuffer[tMsg.MsgHead.MsgIndex].MsgNum == tMsg.MsgHead.MsgSum) {
                    let tMsgDataLen = 0;
                    for (var i = 1; i <= tMsg.MsgHead.MsgSum; i++) {
                        tMsgDataLen += this.mMsgBuffer[tMsg.MsgHead.MsgIndex][i].byteLength;
                    }
                    let tDataBuffer = new Uint8Array(tMsgDataLen);
                    let tWritePos = 0;
                    for (var i = 1; i <= tMsg.MsgHead.MsgSum; i++) {
                        tDataBuffer.set(this.mMsgBuffer[tMsg.MsgHead.MsgIndex][i], tWritePos);
                        tWritePos += this.mMsgBuffer[tMsg.MsgHead.MsgIndex][i].byteLength;
                    }
                    //非分隔消息 直接解析
                    let tMsgStr = ""
                        //解析消息体 
                    tMsgStr = this.byteToString(tDataBuffer); //String.fromCharCode.apply(null,tUint8Array.slice(tPos,sigBytes));

                    //MsgData []byte //消息内容
                    tMsg.MsgData = JSON.parse(tMsgStr);

                    //清空对应消息缓冲
                    this.mMsgBuffer[tMsg.MsgHead.MsgIndex] = null;

                    if (cc.show_log)
                        if(tMsg.MsgData.rt != null || tMsg.MsgData.b == 100) {
                            cc.rtData.Utils._Msg("tMsgStr=%s MsgData=%#v", tMsgStr, tMsg.MsgData);
                        }else{
                            cc.rtData.Utils._log("tMsgStr=%s MsgData=%#v", tMsgStr, tMsg.MsgData);
                        }
                    else {
                        if (tMsg.MsgData.rt != null || tMsg.MsgData.b == 100) {
                            cc.rtData.Utils._Msg("tMsgStr=%s MsgData=%#v", tMsgStr, tMsg.MsgData);
                        }
                    }
                    return tMsg;
                } else {
                    return null;
                }
            } else {
                cc.rtData.Utils._Msg("cmd=" + tMsg.MsgHead.MsgBigCmd + "-" + tMsg.MsgHead.MsgCmd + " MsgSum=" + tMsg.MsgHead.MsgSum + " MsgNo=" + tMsg.MsgHead.MsgNo);
            }
        } else {
            //非分隔消息 直接解析
            let tMsgStr = "";
            //解析消息体 
            tMsgStr = this.byteToString(tMsgData); //String.fromCharCode.apply(null,tUint8Array.slice(tPos,sigBytes));
            //MsgData []byte //消息内容
            tMsg.MsgData = JSON.parse(tMsgStr);
            if (cc.show_log)
                if(tMsg.MsgData.rt != null || tMsg.MsgData.b == 100) {
                    cc.rtData.Utils._Msg("tMsgStr=%s MsgData=%#v", tMsgStr, tMsg.MsgData);
                }else{
                    cc.rtData.Utils._log("tMsgStr=%s MsgData=%#v", tMsgStr, tMsg.MsgData);
                }
            else {
                if (tMsg.MsgData.rt != null || tMsg.MsgData.b == 100) {
                    cc.rtData.Utils._Msg("tMsgStr=%s MsgData=%#v", tMsgStr, tMsg.MsgData);
                    if(tMsg.MsgData.b == 100 && tMsg.MsgData.s == 1){
                        cc.rtData.isGameStart = true;//是否在游戏中
                    }
                    if(tMsg.MsgData.b == 100 && tMsg.MsgData.s == 17){
                        cc.rtData.isGameStart = false;
                    }
                }
            }
            return tMsg;
        }
    },


    //解析消息头
    DecodeMsgHead: function(tUint8Array, tMsgHead) {

        //生成视图
        let dv = new DataView(tUint8Array.buffer.slice(0));

        /*
        DataView的get方法使用大端字节序解读数据，如果需要使用小端字节序解读，必须在get方法的第二个参数指定true
        */
        let tPos = 0;
        //先写入消息头
        // MsgPad1     uint8  //填充起始符1  0xDE
        tMsgHead.MsgPad1 = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        if (tMsgHead.MsgPad1 != 0xDE)
            return tPos;
        // MsgPad2     uint8  //填充起始符2  0xDE
        tMsgHead.MsgPad2 = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        if (tMsgHead.MsgPad2 != 0xDE)
            return tPos;
        // MsgNo       uint8  //当前消息在分隔消息中的序号(无分割消息时为0)
        tMsgHead.MsgNo = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        // MsgSum      uint8  //消息总条数(无分割消息时为0)
        tMsgHead.MsgSum = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        // MsgSysCmd   uint8  //系统指令号
        tMsgHead.MsgSysCmd = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        // MsgDestType uint8  //目标服务器类型
        tMsgHead.MsgSysCmd = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        // MsgBigCmd   uint8  //大指令号
        tMsgHead.MsgBigCmd = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        // MsgCmd      uint16 //小指令号
        tMsgHead.MsgCmd = dv.getUint16(tPos, this.mLittleEndian);
        tPos += 2;
        // MsgSize     uint16 //消息内容长度
        tMsgHead.MsgSize = dv.getUint16(tPos, this.mLittleEndian);
        tPos += 2;
        // MsgDest     uint16 //消息目标(c->s 功能服务器ID   s->c 网关服务器ID)
        tMsgHead.MsgDest = dv.getUint16(tPos, this.mLittleEndian);
        tPos += 2;
        // MsgSrc      uint16 //消息来源(c->s 网关服务器ID   s->c 功能服务器ID)
        tMsgHead.MsgSrc = dv.getUint16(tPos, this.mLittleEndian);
        tPos += 2;
        // MsgRsv1     uint16 //预留位1
        tMsgHead.MsgRsv1 = dv.getUint16(tPos, this.mLittleEndian);
        tPos += 2;
        // MsgRsv2     uint16 //预留位2
        tMsgHead.MsgRsv2 = dv.getUint16(tPos, this.mLittleEndian);
        tPos += 2;
        // MsgCheck    uint32 //校验信息(c->s 消息校验信息   s->c 回应的消息序号   s->s 消息路由分配随机值)
        tMsgHead.MsgCheck = dv.getUint32(tPos, this.mLittleEndian);
        tPos += 4;
        // MsgIndex    uint32 //消息序号
        tMsgHead.MsgIndex = dv.getUint32(tPos, this.mLittleEndian);
        tPos += 4;
        // MsgUid      uint32 //用户数字ID
        tMsgHead.MsgUid = dv.getUint32(tPos, this.mLittleEndian);
        tPos += 4;
        // MsgToken    uint32 //用户消息Token
        tMsgHead.MsgToken = dv.getUint32(tPos, this.mLittleEndian);
        tPos += 4;
        // MsgTail     uint8  //消息头结束符  0xDE
        tMsgHead.MsgTail = dv.getUint8(tPos, this.mLittleEndian);
        tPos++;
        if (tMsgHead.MsgTail != 0xDE)
            return tPos;

        return 0;
    },

    //消息解码
    ReadMsgData: function(tMsgData, doMessage) {
        //消息头长度为 36字节
        var tMsgHeadLength = 36;

        // words 转 uint8 数组
        var tTmpUint8Array = new Uint8Array(tMsgData);
        var sigBytes = tTmpUint8Array.byteLength;

        var tUint8Array = null;
        var tUint8ArrayLength = 0;
        //判断数据缓冲区是否有未解析完全的消息
        if (this._mMsgDataBufferLength > 0) {
            tUint8ArrayLength = sigBytes + this._mMsgDataBufferLength;
            tUint8Array = new Uint8Array(tUint8ArrayLength);
            //将缓冲区中残留数据，和当前数据进行整合
            tUint8Array.set(this._mMsgDataBuffer, 0);
            tUint8Array.set(tTmpUint8Array, this._mMsgDataBufferLength);
        } else {
            tUint8Array = tTmpUint8Array;
            tUint8ArrayLength = sigBytes;
        }

        //如果消息长度 < 消息头长度 不进行解析，等待后续消息到达
        if (tUint8ArrayLength < tMsgHeadLength) {
            this._mMsgDataBuffer = tUint8Array;
            this._mMsgDataBufferLength = tUint8ArrayLength;
            return;
        }

        //消息解析循环，将缓冲区内所有完成消息都解析出
        //当前解析位置
        var tReadPos = 0;
        do {
            //判断是否还有足够的数据解析
            if ((tUint8ArrayLength - tReadPos) < tMsgHeadLength)
                break;
            //消息结头构体
            let tMsgHead = {};
            //解析消息头
            let tRetPos = this.DecodeMsgHead(tUint8Array.subarray(tReadPos, tReadPos + tMsgHeadLength), tMsgHead);
            //判断 是否解析成功
            if (tRetPos > 0) {
                tReadPos += tRetPos;
                continue;
            }

            //成功解析出消息头，判断消息体是否完整的在消息缓冲区内
            //当前消息体非完整在消息缓冲内，跳出解析，等待后续消息
            if ((tUint8ArrayLength - tReadPos) < tMsgHead.MsgSize)
                break;
            //读取位置 偏移消息头的长度
            tReadPos += tMsgHeadLength;
            //验证 消息内容的最大长度，防止异常数据，收到异常不解析该数据
            if (tMsgHead.MsgSize > this._mMaxMessageDataSize)
                continue;
            //有完整消息 消息解码  !!!! PS: 这里使用 slice 传递数据切片到消息解析，防止缓冲区数据被修改
            let tMsg = this.MsgDecode(tMsgHead, tUint8Array.slice(tReadPos, tReadPos + tMsgHead.MsgSize));
            //消息读取位置下移
            tReadPos += tMsgHead.MsgSize;
            //触发消息处理
            doMessage(tMsg);
        } while (true);

        //如果还有未解析完成的，等待下条消息
        if (tReadPos < tUint8ArrayLength) {
            this._mMsgDataBufferLength = tUint8ArrayLength - tReadPos;
            this._mMsgDataBuffer = tUint8Array.slice(tReadPos, tReadPos + this._mMsgDataBufferLength);
        } else {
            //已读取完成 清空数据缓冲区
            this._mMsgDataBufferLength = 0;
            this._mMsgDataBuffer = null;
        }
    },
}

module.exports = MsgParserWS;