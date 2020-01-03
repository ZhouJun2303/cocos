var Tool = {

    innerHeight : window.innerHeight, //浏览器内部界面的高度（内容显示区域的高度，F12后会实时改变）
    outerHeight : window.outerHeight, //浏览器窗体的高度（浏览器的高度）
    innerWidth : window.innerWidth, //浏览器内部界面的宽度（内容显示区域的宽度，F12后会实时改变）va
    outerWidth : window.outerWidth, //浏览器窗体的宽度（浏览器的宽度）
    sceneSize :null ,  //获取手机屏幕显示区域大小  此方法需要再start方法执行一帧后数据才正常显示

    timer : new cc.Component(),      //初始化一个带定时器的属性

    Progress_bar  : [],   //进度条数组


    //预制体 列表
    _prefabMap: {},


    //获取手机屏幕显示区域大小  此方法需要再start方法执行一帧后数据才正常显示
    get_Mobilephone_size()
    {
        this.sceneSize = cc.view.getVisibleSize();
    },
    
    // 字符串
    stringFormat: function () {
        if (arguments.length == 0)
            return null
        var str = arguments[0]
        for (var i = 1; i < arguments.length; i++) {
            var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
            str = str.replace(re, arguments[i]);
        }
        return str
    },

    //将节点调至与手机屏幕一样大小
    setImgSize(obj)
    {
        if(!obj)
        {
            cc.log("设置节点大小失败，节点为空")
            return;
        }
        cc.log("设置节点大小：",obj.name);
        obj.setContentSize(this.sceneSize);
    },

    // 更换图片
    loadTexture: function (sprite, path) {
        cc.loader.loadRes(path, cc.SpriteFrame, function (err, spriteFrame) {
            sprite.spriteFrame = spriteFrame
        })
    },

    // 更换按钮图片
    loadButton: function (sprite, path1, path2) {
        cc.loader.loadRes(path1, cc.SpriteFrame, function (err, spriteFrame) {
            sprite.normalSprite = spriteFrame
        })

        cc.loader.loadRes(path2, cc.SpriteFrame, function (err, spriteFrame) {
            sprite.pressedSprite = spriteFrame
        })
    },

    // 加载预制体
    loadPrefab: function (path, callBack) {
        cc.loader.loadRes(path, cc.Prefab, function (err, prefab) {
            var obj = cc.instantiate(prefab);
            callBack(obj)
        })
    },
    //按目录 加载 预制体
    loadPrefabsDir: function(tPath, tCallBack) {
        //加载 预制体
        cc.loader.loadResDir(tPath, cc.Prefab, (err, assets, urls) => {
            if (err) {
                    console.log("loadPrefabsDir " + tPath + " err=" + err.toString());
            } else {
                var tKey = "";
                var tUrl = "";
                //获取 加载列表
                for (var i = 0; i < assets.length; ++i) {
                    if (typeof assets[i] === 'string') {
                        tKey = assets[i];
                    } else {
                        tKey = assets[i].url || assets[i]._name || assets[i];
                    }
                    //如果 返回的预制体信息 string 则拼接 url
                    let tList = tKey.split("/");
                    if (tList.length == 1) {
                        tUrl = tPath + tKey;
                    } else { //返回的预制体信息为 url 则切割 key 值
                        tUrl = tKey;
                        tKey = tList[tList.length - 1];
                    }
                    if (urls && urls[i]) {
                        tUrl = urls[i];
                    }
                   this._prefabMap[tKey] =  cc.instantiate(cc.loader.getRes(tUrl, cc.Prefab));
                }
            }
            //执行回调
            if (tCallBack) {
                tCallBack();
            }
            return this._prefabMap;
        })
    },

    //获取当前预制体列表
    GetPrefabs : function()
    {
        return this._prefabMap;
    },

    // 加载更换plist
    loadAtlas: function (sprite, str, path) {
        cc.loader.loadRes(path, cc.SpriteAtlas, function (err, spriteAtlas) {
            sprite.spriteFrame = spriteAtlas._spriteFrames[str]
        })
    },

    // 播放动画
    playAnimation: function (node, durTime, callback) {
        var anim = node.getComponent(cc.Animation)
        if (callback != null) {
            anim.on("finished", callback, this)
        }

        node.active = true
        anim.play()
        if (durTime > 0 && durTime < 100) {
            node.runAction(cc.sequence(cc.delayTime(durTime), cc.callFunc(function () {
                anim.stop()
                node.active = false
            })))
        } else if (durTime == 100) {
            anim.repeatCount = Infinity
        }
    },

    //深拷贝数组，二维数组，对象
    copy_arr(arr) {
        let list = [];
        for (var key in arr) {
            let [...arr1] = arr;
            list[key] = arr1;
        }
        return list;
    },

    /**
     * 
     * @param {路径} url 
     * @param {回调} callback 
     * @param {post请求体} content 
     * @param {响应时间} time 
     */
    send__http: function (url, callback, content, time) {
        console.log("url:", url);
        if (time == null) {
            time = 5000;
        }
        var request = new XMLHttpRequest();
        var timeout = false;
        var timer = setTimeout(function () {
            timeout = true;
            request.abort();
        }, time);
        var type = "GET"
        if (content) {
            type = "POST";
        }
        request.open(type, url);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
        request.onreadystatechange = function () {
            console.log("HTTP request:", request);
            if (request.readyState !== 4) return;
            if (timeout) return;
            clearTimeout(timer);
            if (request.status === 200) {
                callback(request.responseText);
            }
        }
        request.send(content);
    },

    getGUID: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    //string转字节
    stringToByte: function (str) {
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


    //获取手机的唯一ID
    GetUUIDInKeychain: function () {
        //安卓
        if (cc.sys.OS_ANDROID == cc.sys.os) {
            let devID = jsb.reflection.callStaticMethod("org/cocos/AndroidTool", "getUniqueId", "()Ljava/lang/String;");
            return devID;
        }
        //IOS
        else if (cc.sys.OS_IOS == cc.sys.os) {
            var uuid = jsb.reflection.callStaticMethod("UUIDTool", "getUUIDInKeychain");
            return uuid;
        }
        return "";
    },
    //手机横竖屏切换  参数 类型string   例子：v切换竖屏  其余皆为横屏
    setOrientation(dir) {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod('org/cocos/AndroidTool', 'setOrientation', '(Ljava/lang/String;)V', dir);

        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod('AppController', 'setOrientation:', dir);
        }

        let frameSize = cc.view.getFrameSize();
        console.log(frameSize);

        if (dir == 'V' || dir == "v") {
            cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            if (frameSize.width > frameSize.height) {
                cc.view.setFrameSize(frameSize.height, frameSize.width);
            }
            cc.Canvas.instance.designResolution = cc.size(1080, 1920);
            cc.log("切换竖屏");
        } else {
            cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            if (frameSize.height > frameSize.width) {
                cc.view.setFrameSize(frameSize.height, frameSize.width);

            }
            cc.Canvas.instance.designResolution = cc.size(1920, 1080);
            cc.log("切换横屏");

        }

        if (CC_JSB) {
            // 此方法在1.10版本中无效,所以调用此方法需要在跳转场景之前
            window.dispatchEvent(new cc.Event.EventCustom('resize', true));

        }
    },

    //闪光效果。需要一个图片
    light_action: function (node, func, img) {
        node.active = true;
        node.opacity = 180;
        node.scale = 1;
        node.stopAllActions();
        node.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.3, 0),
                cc.scaleTo(0.3, 1.25, 1.25)
            ),
            cc.callFunc(function () {
                node.active = false;
                if (func) {
                    func();
                }
            }, this),
        ));
    },
    //闪光效果。需要一个图片
    Add_light_action: function (node, func) {
        node.on(cc.Node.EventType.TOUCH_START, function (data) {
            var light = data.currentTarget.getChildByName("light");
            var img = data.currentTarget.getChildByName("img");
            this.light_action(light, func, img);
        });
    },

    //截图功能   仅限2.* 版本以上使用
    game_Screenshot: function () {
        let node = new cc.Node();
        node.parent = cc.director.getScene();
        node.setPosition(new cc.v2(parseInt(this.screenSize.width / 2), parseInt(this.screenSize.height / 2)))  //设置节点位置
        let camera = node.addComponent(cc.Camera);

        // 设置你想要的截图内容的 cullingMask
        camera.cullingMask = 0xffffffff;

        // 新建一个 RenderTexture，并且设置 camera 的 targetTexture 为新建的 RenderTexture，这样        camera 的内容将会渲染到新建的 RenderTexture 中。
        let texture = new cc.RenderTexture();


        let gl = cc.game._renderContext;

        // 如果截图内容中不包含 Mask 组件，可以不用传递第三个参数
        texture.initWithSize(cc.visibleRect.width, cc.visibleRect.height, gl.STENCIL_INDEX8);
        camera.targetTexture = texture;

        // 渲染一次摄像机，即更新一次内容到 RenderTexture 中
        camera.render();

        // 这样我们就能从 RenderTexture 中获取到数据了
        let data = texture.readPixels();


        //图片像素点是镜像数据，需要翻转
        var pic = this.filpYImage(data, cc.visibleRect.width, cc.visibleRect.height);
        var filePath = jsb.fileUtils.getWritablePath() + 'Image.jpg';  //   截图只需要jgp格式即可
        var jsdata = jsb.saveImageData(pic, this.screenSize.width, this.screenSize.height, filePath);
        cc.log(filePath);
        return jsdata;
    },
    
    //翻转像素点
    filpYImage(data, width, height) {
        // create the data array
        let picData = new Uint8Array(width * height * 4);
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let start = srow * width * 4;
            let reStart = row * width * 4;
            // save the piexls data
            for (let i = 0; i < rowBytes; i++) {
                picData[reStart + i] = data[start + i];
            }
        }
        return picData;
    },

    //进度条加载进度控制
    /**
     * 
     * @param {进度条处于哪个节点下} obj 
     * @param {进度条持续时间} time 
     * @param {加载至百分百后回调} callBack 
     */
    Progress_bar_control(obj,time,callBack)
    {

        var func = function(prefab,is_storage)
        {
            if(!is_storage)
            {
                this.Progress_bar[this.Progress_bar.length] = prefab;
            }
            
            this.setImgSize(prefab);
            var sp = prefab.getChildByName("Progress").getComponent(cc.Sprite);
            var label = prefab.getChildByName("Progress").getChildByName("label").getComponent(cc.Label);

            obj.addChild(prefab);

            var ts = function()
            {
                if(sp.fillRange >= 1)
                {
                    this.timer.unschedule(ts);
                    this.timer.scheduleOnce(()=>{

                        if(callBack)
                        {
                            callBack();
                        }

                        prefab.removeFromParent();
                        prefab.active = false;

                    },0.1);
                }
                sp.fillRange +=  time / (cc.game.getFrameRate() * time);
                label.string = parseInt(sp.fillRange * 100);
            }.bind(this);

            this.timer.schedule(ts,0);

        }.bind(this);


        if(this.Progress_bar.length  == 0)
        {
            this.loadPrefab("prefab/Common/Progress_bar",func);
        }
        else
        {
            obj.addChild(this.Progress_bar[this.Progress_bar.length - 1]);
            func(this.Progress_bar[this.Progress_bar.length - 1],true);
        }
    },

}

module.exports = Tool;
