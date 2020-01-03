var label_tool = {
        
    //初始化自定义回调
    callback : null,
    //初始化一个带定时器的属性
    timer : new cc.Component(),
    //初始化定时器是否执行
    timercall : false,
    //初始化逐步执行时间
    workAnimation_time : 2,

    //调用入口
    /**
     * 
     * @param {显示string组件} m_node 
     * @param {显示文本} txt 
     * @param {模式选择 1： 直接显示} Pattern 
     * @param {传入回调方法} callback 
     */
    setLabel(m_node,txt,Pattern,callback)
    {
        this.callback = callback;
        //直接显示模式
        if(Pattern == 1)
        {
            m_node.string = txt;
            this.callfunc();
        }
        //按时间轴显示文本
        else if(Pattern == 2)
        {
            this.workAnimation(m_node,txt);
        }
    },
    //调用回调方法
    callfunc()
    {
        if(this.callback == null || typeof this.callback  == 'function' )
        {
            return false;
        }
        this.callback();
        return true;
    },

    //根据内容逐步显示文字
    workAnimation(m_node,txt)
    {
        if(this.timercall)
        {
            this.workAnimation_time = this.workAnimation_time / 2;
            this.timer.schedule(this.workTemp, this.workAnimation_time);
            return ;
        }
        this.timercall = true;
        var txt_list = txt.split("");
        var txt_number = 0;
        m_node.string += txt_list[txt_number++];

        
            this.workTemp = function()
            {
                m_node.string += txt_list[txt_number++];
                if(txt_number >= txt_list.length)
                {
                    this.timer.unschedule(this.workTemp);
                    //因label组件刷新要等下一帧，所以，延时下一帧执行回调
                    this.timer.scheduleOnce(function() {
                        
                        this.callfunc();
                        this.timercall = false;
                        this.workAnimation_time = 2;
                        cc.log("回调执行完成")
                    }.bind(this));
                    return;
                };
            }.bind(this)
        
      
  
        this.timer.schedule(this.workTemp, this.workAnimation_time);
    },
    //设置逐步显示时间
    SetworkAnimation_time(tis)
    {
        if(tis == 0 || typeof tis != "number")
        {
            return this.workAnimation_time;
        }
        this.workAnimation_time = tis;
        return this.workAnimation_time;
    },
    //获取逐步显示时间
    GetworkAnimation_time()
    {
        return this.workAnimation_time;
    },

};
module.exports = label_tool;