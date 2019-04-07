/**
    Author By VBSoft
 */
window.onerror = function(msg,url,l){
    var txt="";
    txt+="错误: \n" + msg + "\n\n";
    txt+="地址: \n" + url + "\n\n";
    txt+="行数: " + l + "\n\n";
    txt+="点击【确定】继续，【取消】终止\n";
    txt+="=============================\n\n";
    if(confirm(txt)){
        return true;
    }
    return false;
}
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
        paymentbtn.addEventListener(TOUCH_START, this.sendRequest, false);
        resultDiv.addEventListener('dblclick', this.clearResult, false);
        app.objs = [
            qrbtn,
            paymentbtn,
            // messageInput,
        ];
        app.setDisabled(true);
    },
    clearResult:function(){
        resultDiv.innerHTML="";
    },
    onDeviceReady: function() {
        document.getElementById("table").style.width=document.body.clientWidth+"px";
        document.getElementById("BusinessDay").value=bluetoothSerial.getLocalDate(undefined,'yyyyMMdd');

        bluetoothSerial.listen(app.onListen, app.onError);
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
                    if(app.sendType == bluetoothSerial.sendEnum.erpStru){
                        app.setMsg("获得POS端的请求反馈信息，ID:"+data.id);
                        var data = app.msg_data;
                        var dataObject = {
                            ResponseCode:"",
                            ResponseMsg:"",
                            Amount:"",
                            SettleNum:"",
                            MerchantID:"",
                            TerminalID:"",
                            TransDate:"",
                            TransTime:"",
                            CardTraceNo:"",
                            NeedPrint:"",
                            EFTprintFileName:"",
                            Reserved1:"",
                            Reserved2:"",
                            Reserved3:"",
                            Reserved4:"",
                            Reserved5:"",
                            EFT_quantity:"",
                            EFT_Detail_information:[],
                        }
                        // char ResponseCode[2];					// Return code
                        // char ResponseMsg[40];					// Detail error message. Input space for the bytes on the
                        // char Amount[12];						    // Actual total amount, include tenders and coupons . unit is cent,
                        // char SettleNum[6];						// E-Payment transaction settle number
                        // char MerchantID[15];					    // E-Payment merchant number.
                        // char TerminalID[8];						// E-Payment device number.
                        // char TransDate[8];						// System date. YYYYMMDD
                        // char TransTime[6];						// System time. HHMMSS
                        // char CardTraceNo[64];					// for void function. Input space for the bytes on the right if 64
                        // char NeedPrint[2];						// Whether print the EFT receipt
                        // char EFTprintFileName[200];				// full path of the EFT receipt file, which include the
                        // char MD5_check_code[32];				    // MD5 check code
                        // char Reserved1[48];						// Reserved.
                        // char Reserved2[48];						// Reserved.
                        // char Reserved3[48];						// Reserved.
                        // char Reserved4[48];						// Reserved.
                        // char Reserved5[48];						// Reserved.
                        // char EFT_quantity[2];					// EFT line quantity . maximum quantity of EFT line is 10
                        // char EFT_Detail_information[10][157];	// Array for save EFT detail information


                        var startIndex = 0;
                        var length = 2;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.ResponseCode = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 40;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.ResponseMsg = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 12;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.Amount = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 6;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.SettleNum = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 15;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.MerchantID = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 8;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.TerminalID = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 8;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.TransDate = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 6;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.TransTime = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 64;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.CardTraceNo = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 2;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.NeedPrint = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 200;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.EFTprintFileName = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 32;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.MD5_check_code = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 48;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.Reserved1 = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 48;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.Reserved2 = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 48;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.Reserved3 = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 48;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.Reserved4 = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 48;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.Reserved5 = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        length = 2;
                        if(data.length>=startIndex){
                            var buf = new Array();
                            for(var j=startIndex;j<startIndex+length;j++){
                                buf.push(data[j]);
                                startIndex++;
                            }
                            dataObject.EFT_quantity = bluetoothSerial.Decodeuint8arr(buf);
                        }

                        for(k=0;k<10;k++){
                            dataObject.EFT_Detail_information.push("");
                            length = 157;
                            if(data.length>=startIndex){
                                var buf = new Array();
                                for(var j=startIndex;j<startIndex+length;j++){
                                    buf.push(data[j]);
                                    startIndex++;
                                }
                                dataObject.EFT_Detail_information[k] = bluetoothSerial.Decodeuint8arr(buf);
                            }
                        }
                        app.setMsg("获得POS端的请求反馈信息，ID:"+data.id+"，MSG:"+JSON.stringify(dataObjectß));
                    }else{
                        app.setMsg("获得POS端的请求反馈信息，ID:"+data.id+"，MSG:"+data.msg);
                    }
                }
                app.setMsg("Received: <pre>"+bluetoothSerial.uintFormat(data.data,"\n\t")+"</pre>");
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
            app.pathType = bluetoothSerial.pathEnum.init,
            app.setMsg("终端断开，蓝牙服务重新监听...");
            return;
        }
        if(data!=""&&data!=null){
            app.setDisabled(false);
            data=JSON.parse(data);
            app.setMsg("与"+data.name+"["+data.address+"]连接成功");
            bluetoothSerial.Accpet(onMessage, subscribeFailed);
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
        app.sendType = bluetoothSerial.pathEnum.erpStru;
        bluetoothSerial.getRequsetData(undefined,undefined,undefined,function(){
            app.pathType = bluetoothSerial.pathEnum.request;
            setTimeout(function(app){
                bluetoothSerial.getRequsetData(bluetoothSerial.sendEnum.request,app.pathType,"019999",app.sendSuccess,app.sendFailure);
            },666,app);
        },undefined); //发送握手报文
    },

    /**
     * 获取网页中元素的值
     * @param {String} id   元素ID
     */
    getobj:function(id){
        var tmp = document.getElementById(id);
        try{
            if(bluetoothSerial.isEmpty(tmp)){
                return "";
            }else{
                return tmp.value;
            }
        }catch(e){
            return "";
        }
    },

    /**
     * 发送交易请求
     * @param {object} event 点击事件状态
     */
    sendRequest:function(event){
        if(paymentbtn.getAttribute("disabled")==="1") return;
        var data=bluetoothSerial.requestErpStru({
            // PlatNo       : app.getobj("PlatNo"),
            // TransType    : app.getobj("TransType"),
            // CardType     : app.getobj("CardType"),
            // StoreNo      : app.getobj("StoreNo"),
            // BusinessDay  : app.getobj("BusinessDay"),
            // CashRegNo    : app.getobj("CashRegNo"),
            // CashierNo    : app.getobj("CashierNo"),
            // Amount       : app.getobj("Amount"),
            // Ticket_Amount: app.getobj("Ticket_Amount"),
            // non_sale_Amount : app.getobj("non_sale_Amount"),
            // CashTraceNo  : app.getobj("CashTraceNo"),
            // OriginTrace  : app.getobj("OriginTrace"),
            // Reserved1    : app.getobj("Reserved1"),
            // Reserved2    : app.getobj("Reserved2"),
            // Reserved3    : app.getobj("Reserved3"),
            // Reserved4    : app.getobj("Reserved4"),
            // Reserved5    : app.getobj("Reserved5"),
            // item_line_qty: app.getobj("item_line_qty"),
            // item_information: app.getobj("item_information"),

            PlatNo       : app.getobj("PlatNo"),
            TransType    : app.getobj("TransType"),
            CardType     : app.getobj("CardType"),
            storeId      : app.getobj("StoreNo"),
            transTime    : app.getobj("BusinessDay"),
            merchantPosId: app.getobj("CashRegNo"),
            cashierNo    : app.getobj("CashierNo"),
            amount       : app.getobj("Amount"),
            orderAmount: app.getobj("Ticket_Amount"),
            cashTraceNo  : app.getobj("CashTraceNo"),
            originTrace  : app.getobj("OriginTrace"),
            item_line_qty: app.getobj("item_line_qty"),
        });
        if(data.indexOf("error:")>-1){
            alert(data);
            return;
        }
        var sendData = new Array();

        for(key in data){
            var tmp = new Array();
            for(i in data[key]){
                tmp.push(data[key][i].toString(16));
                sendData.push(data[key][i]);
            }
            app.setMsg(tmp.join(" ")+" //"+key);
        }
        app.sendType = bluetoothSerial.pathEnum.erpStru;
        bluetoothSerial.getRequsetData(undefined,undefined,undefined,function(){
            app.pathType = bluetoothSerial.pathEnum.request;
            setTimeout(function(app){
                bluetoothSerial.getRequsetData(
                    bluetoothSerial.sendEnum.request,
                    app.pathType,
                    sendData,
                    app.sendSuccess,
                    app.sendFailure
                );
            },666,app);
        },undefined); //发送握手报文

    },

    /**
     * 发送成功回调
     * @param {any} data 
     */
    sendSuccess:function(data) {
        if(app.pathType == bluetoothSerial.pathEnum.handshake){
            data="发送握手报文";
        }
        if(app.pathType == bluetoothSerial.pathEnum.request){
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
