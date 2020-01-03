var Bomb_Box = 
{
    box_list : {},  //所有弹框列表
    
    box_list_key :[], //box_list的key值列表

    is_many : true,  //是否开启单级弹框， 默认开启状态



    //生成弹框预制体，并显示与界面
    load_Promptbox(obj,str,style,callbck)
    {
        if(str == null)
        {
            cc.log("弹框节点传入的信息提示为空")
            return ;
        }
        var uinode = null;
        if(obj == null)
        {
            uinode = cc.find("Canvas/uiNode")
            if(uinode)
            {
                uinode = new cc.Node;
                uinode.name = "uiNode";
                cc.find("Canvas").addChild(uinode);
            }
        }
        var func = function(prefab)
        {
            prefab.getComponent("Promptbox").Init(str,style,(data)=>{ this.Delete_Box(prefab); if( callbck) { callbck(data) } });
            this.Push_Box(prefab,obj)
        }.bind(this);

        cc.tool.loadPrefab("prefab/UI/Promptbox",func);
    },

    //加载弹框
    Push_Box(prefab,obj)
    {
        //显示弹框前，关闭上一级弹框
        if(this.is_many)
        {
            this.Close_Box();
        }
        
        //关闭所有弹框后，将预制体增加  将每个预制体的唯一ID作为key值
        this.box_list[prefab.uuid] = prefab;
        this.box_list_key.push(prefab.uuid);//将所有的key保存下来

        obj.addChild(prefab);
    },

    //关闭所有弹框
    Close_Box()
    {
        var func = function(pab)
        {
            pab.active = false;
        };

        this.ergodic_Box(func);
    },

    //删除弹框
    Delete_Box(prefab)
    {
        //删除后对象属性
        delete this.box_list[prefab.uuid];
        
        if(this.box_list_key.length == 1)
        {
            //处理完毕后删除数组key数据
            this.box_list_key.splice(this.box_list_key.length - 1,1);
            return ;
        }
        //将上层弹框显示出来  因为最后一层已被销毁，所以-2
        this.box_list[this.box_list_key[this.box_list_key.length - 2]].active = true;

        //处理完毕后删除数组key数据
        this.box_list_key.splice(this.box_list_key.length - 1,1);
    },

    //遍历弹框列表
    ergodic_Box(callbck)
    {
        for(var key in this.box_list)
        {
            callbck(this.box_list[key]);
        }
    },
}
module.exports = Bomb_Box;