/**
    Author By VBSoft
 */
var app = {
    objs:       [],
    pathType:   0x00,
    sendType:   0x00,
    initialize: function() {
        this.bindEvents();
    },
    setDisabled:function(isDisabled){
        for(obj in app.objs){
            if(isDisabled){
                app.objs[obj].setAttribute("disabled","1");
            }else{
                app.objs[obj].removeAttribute("disabled");
            }
        }
    },
    bindEvents: function() {
        var TOUCH_START = 'touchstart';
        if (window.navigator.msPointerEnabled) { // windows phone
            TOUCH_START = 'MSPointerDown';
        }
        document.addEventListener('deviceready', this.onDeviceReady, false);
        qrbtn.addEventListener(TOUCH_START, this.sendQR, false);
        resultDiv.addEventListener('dblclick', this.clearResult, false);
        app.objs = [
            qrbtn,
            // sendbtn,
            // messageInput,
        ];
        app.setDisabled(true);
    },
    clearResult:function(){
        resultDiv.innerHTML="";
    },
    onDeviceReady: function() {
        VBSoftBls.listen(app.onListen, app.onError);
    },
    onListen:function(data){
        /**
         * 返回蓝牙端的消息数据
         * @param {any} data 消息内容 
         */
        var onMessage=function(data) {
            if(typeof(data)==="string"){
                app.setMsg("Received: " + data);
            }else{
                /**
                 *  返回数据格式：
                    data = {
                        path,
                        type,
                        lrc,
                        data,       //全部二进制数据
                        id,         //id解析后的文本数据
                        id_data,    //id的二进制数据
                        msg,       //msg解析后的文本数据
                        msg_data,  //msg的二进制数据
                    }
                */
                if(data.path==2){
                    app.setMsg("获得POS端的握手反馈信息，ID:"+data.id+"，MSG:"+data.msg);
                }else if(data.path==4){
                    app.setMsg("获得POS端的请求反馈信息，ID:"+data.id+"，MSG:"+data.msg);
                }
                app.setMsg("Received: <pre>"+VBSoftBls.uintFormat(data.data,"\n\t")+"</pre>");
            }
        }
        /**
         * 签署失败回调
         */
        var subscribeFailed=function() {
            app.setMsg("subscribeFailed: subscribe failed");
        }
        if(data==="relisten"){
            app.setDisabled(true);
            app.pathType = VBSoftBls.pathEnum.init,
            app.setMsg("终端断开，蓝牙服务重新监听...");
            return;
        }
        if(data!=""&&data!=null){
            app.setDisabled(false);
            data=JSON.parse(data);
            app.setMsg("与"+data.name+"["+data.address+"]连接成功");
            VBSoftBls.Accpet(onMessage, subscribeFailed);
            return;
        }
        app.setMsg("蓝牙服务成功监听...");
    },
    onError:function(data){
        app.setMsg("ListenError: "+JSON.stringify(data));
    },

    /**
     * 发送二维码扫描请求
     * @param {object} event 点击事件状态
     */
    sendQR:function(event){
        if(qrbtn.getAttribute("disabled")==="1") return;
        app.sendType = app.qrscan;
        VBSoftBls.getRequsetData(undefined,undefined,undefined,function(){
            app.pathType = VBSoftBls.pathEnum.request;
            setTimeout(function(app){
                VBSoftBls.getRequsetData(app.sendType,app.pathType,"019999",app.sendSuccess,app.sendFailure);
            },666,app);
        },undefined); //发送握手报文
    },


    /**
     * 发送成功回调
     * @param {any} data 
     */
    sendSuccess:function(data) {
        if(app.pathType == VBSoftBls.pathEnum.handshake){
            data="发送握手报文";
        }
        if(app.pathType == VBSoftBls.pathEnum.request){
            data="发送请求报文";
        }
        app.setMsg(data+"成功");
    },
    /**
     * 发送失败回调
     * @param {any} data 
     */
    sendFailure:function(data) {
        app.setMsg(data);
    },

    /**
     * 设置日志信息
     * @param {string} msg 日志字符数据
     */
    setMsg:function(msg){
        resultDiv.innerHTML = resultDiv.innerHTML + msg + "<br/>";
        resultDiv.scrollTop = resultDiv.scrollHeight;
    },
};
