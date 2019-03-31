cordova.define("cordova-vbsoft-bls.bluetoothSerial", function(require, exports, module) {
    /**
        Author By VBSoft
    */
    /*global cordova*/
    module.exports = {
        STX:            0x02,   //报文起始
        ETX:            0x03,   //报文终止
        ACK:            0x06,   //允许
        NAK:            0x15,   //拒绝
        FS:             0x1C,    //域分隔符
        pathEnum:{
            init:           0x00,
            handshake:      0x01,
            handshake_re:   0x02,
            request:        0x03,
            response:       0x04,
        },
        sendEnum:{
            default:    0x02,   //非二维码扫描时候固定写死
            qrscan:     0x99,   //二维码扫描时候固定写死
        },

        /**
         * 开始蓝牙监听服务
         * @param {function} success 成功回调
         * @param {function} failure 失败回调
         */
        listen: function (success, failure) {
            // alert('platforms⁩/android⁩/platform_www⁩/plugins⁩/cordova-vbsoft-bls⁩/www⁩');
            cordova.exec(success, failure, "BluetoothSerial", "listen", []);
        },

        /**
         * 发送请求包
         * @param {sendEnum}            type    发包类型
         * @param {pathEnum}            path    报文类型
         * @param {String or object}    msg     发包内容
         * @param {function}            success 成功回调
         * @param {function}            failure 失败回调
         */
        getRequsetData:function(type,path,msg,success,failure){
            var msgIsString = false;
            if(type==undefined){
                type=this.sendEnum.default;
            }
            if(path==undefined){
                path=this.pathEnum.handshake;
            }
            if(msg==undefined){
                msg="99";
            }
            // app.pathType = path;
            if(typeof(msg)=="string"){
                msgIsString = true;
                msg=this.stringToByte(msg);
            }
            var data = new Array();
            var ID = this.stringToByte((new Date().Format("hhmmss"))+"");
            data.push(this.STX);
            data.push(0x00);
            data.push(0x00);
            data.push(path);
            data.push(type);
            for(var i=0;i<ID.length;i++){
                data.push(ID[i]);
            }
            for(var i=0;i<msg.length;i++){
                if(msgIsString){
                    data.push(msg[i]);
                }else{
                    for(var ii=0;ii<msg[i].length;ii++){
                        data.push(msg[i][ii]);
                    }
                }
            }
            data[1]=parseInt((data.length-1)/256);
            data[2]=parseInt((data.length-1)%256);
            data.push(this.ETX);
            var LRC = 0x00;
            for(var i=1;i<data.length;i++){
                LRC = LRC ^ data[i];
            }
            data.push(LRC);
            this.write(data,typeof(success)==="function"?success:undefined,typeof(failure)==="function"?failure:undefined);
        },

        /**
         * 向蓝牙串口写入数据
         * @param {any}         data    数据 (ArrayBuffer, string, integer array, Uint8Array)
         * @param {function}    success 成功回调
         * @param {function}    failure 失败回调
         */
        write: function (data, success, failure) {

            // convert to ArrayBuffer
            if (typeof data === 'string') {
                data = stringToArrayBuffer(data);
            } else if (data instanceof Array) {
                // assuming array of interger
                data = new Uint8Array(data).buffer;
            } else if (data instanceof Uint8Array) {
                data = data.buffer;
            }

            cordova.exec(success, failure, "BluetoothSerial", "write", [data]);
        },

        /**
         * 允许POS机的连接
         * @param {function}    success 成功回调
         * @param {function}    failure 失败回调
         */
        Accpet: function (success, failure) {

            successWrapper = function(data) {
                // Windows Phone flattens an array of one into a number which
                // breaks the API. Stuff it back into an ArrayBuffer.
                if (typeof data === 'number') {
                    var a = new Uint8Array(1);
                    a[0] = data;
                    data = a.buffer;
                }
                if (typeof data === 'object') {
                    data=new Uint8Array(data);
                    var path=data[3];
                    var type=data[4];
                    var id  =new Uint8Array(6);
                    var cont=new Uint8Array(data.length-13);
                    var lrc=data[data.length-1];
                    var buf=data;
                    var startIndex = 5;
                    for(i=0;i<6;i++){
                        id[i]=data[i+startIndex];
                    }
                    startIndex=11;
                    for(i=0;i<cont.length-2;i++){
                        cont[i]=data[i+startIndex];
                    }
                    data = {
                        path:path,
                        type:type,
                        lrc:lrc,
                        data:data,
                        id:Decodeuint8arr(id),
                        id_data:id,
                        msg:Decodeuint8arr(cont),
                        msg_data:cont,
                    }
                }
                success(data);
            };
            cordova.exec(successWrapper, failure, "BluetoothSerial", "subscribeRaw", []);
        },

        /**
         * 获取格式化后的时间值
         * @param {Date} date       日期时间
         * @param {String} format   格式（如 yyyy-mm-dd）
         * @returns {String}
         */
        getLocalDate:function(date,format){
            if(date==undefined) date=new Date();
            if(format==undefined) format="yyyy-mm-dd";
            return date.Format(format);
        },

        /**
         * 生成POS交易报文
         * @param {String} PlatNo 
         * @param {String} TransType 
         * @param {String} CardType 
         * @param {String} StoreNo 
         * @param {String} BusinessDay 
         * @param {String} CashRegNo 
         * @param {String} CashierNo 
         * @param {String} Amount 
         * @param {String} Ticket_Amount 
         * @param {String} non_sale_Amount 
         * @param {String} CashTraceNo 
         * @param {String} OriginTrace 
         * @param {String} Reserved1 
         * @param {String} Reserved2 
         * @param {String} Reserved3 
         * @param {String} Reserved4 
         * @param {String} Reserved5 
         * @param {String} item_line_qty 
         * @param {String} item_information 
         * @returns {bytes}
         * //----- EFT2.0 接口参数结构
            //----- InputParameter
            typedef struct requestErpStru {
            char PlatNo[2];					// Platform No,
            char TransType[2];				// Transaction type
            char CardType[2];				// Card type
            char StoreNo[20];				// store number. Input the space on the right if 20 bytes
            char BusinessDay[8];            // Business day information , as 'YYYYMMDD' format
            char CashRegNo[6];				// POS number, input the space on the right if 6 bytes
            char CashierNo[6];				// Cashier Operator ID, input space on the right if 6
            char Amount[12];				// Amount need to pay .No decimal. Input the space on the //right if 12 bytes is too long.
            char Ticket_Amount[12];         // Amount of ticket .No decimal. Input the space on the right if
            char non_sale_Amount[12];       // Amount of non-sale item amount.No decimal. Input the
            char CashTraceNo[6];            // Transaction number. Input the space on the right if
            char OriginTrace[64];           // If it is void transaction, it should be filled with CardTraceNo
            char Reserved1[48];	   			// Reserved. Some function need POS input information
            char Reserved2[48];	   			// Reserved. Some function need POS input information
            char Reserved3[48];				// Reserved. Some function need POS input information
            char Reserved4[48];				// Reserved. Some function need POS input information
            char Reserved5[48];				// Reserved. Some function need POS input information
            char item_line_qty[2];          // Total item line quantity in this request
            char item_information[99][50];  // Arrary for every item information in the order
            // 8  bytes system ID
            // +4 bytes qty
            // +8 bytes price
            // +8 bytes original price
            // +1 mealdeal flag (Set it as '1' if the item is part of mealdeal in this order, otherwise, set it as '0')
            // +1 Is Non-sales item (Set it as '1' if the item is non-sales, otherwise set it as '0'
            // +20 Noun name ( Noun name information , limited in 20 character)
            } InputPararmeter;
        */
        requestErpStru:function(
            PlatNo,
            TransType,
            CardType,
            StoreNo,
            BusinessDay,
            CashRegNo,
            CashierNo,
            Amount,
            Ticket_Amount,
            non_sale_Amount,
            CashTraceNo,
            OriginTrace,
            Reserved1,
            Reserved2,
            Reserved3,
            Reserved4,
            Reserved5,
            item_line_qty,
            item_information,
        ){
            var result = new Array();
            if(PlatNo==undefined) PlatNo="";
            if(TransType==undefined) TransType="";
            if(CardType==undefined) CardType="";
            if(StoreNo==undefined) StoreNo="";
            if(BusinessDay==undefined) BusinessDay="";
            if(CashRegNo==undefined) CashRegNo="";
            if(CashierNo==undefined) CashierNo="";
            if(Amount==undefined) Amount="";
            if(Ticket_Amount==undefined) Ticket_Amount="";
            if(non_sale_Amount==undefined) non_sale_Amount="";
            if(CashTraceNo==undefined) CashTraceNo="";
            if(OriginTrace==undefined) OriginTrace="";
            if(Reserved1==undefined) Reserved1="";
            if(Reserved2==undefined) Reserved2="";
            if(Reserved3==undefined) Reserved3="";
            if(Reserved4==undefined) Reserved4="";
            if(Reserved5==undefined) Reserved5="";
            if(item_line_qty==undefined) item_line_qty="";
            if(item_information==undefined) item_information="";
            PlatNo = this.stringToByte(PlatNo,2);
            result.push(PlatNo);
            TransType = this.stringToByte(TransType,2);
            result.push(TransType);
            CardType = this.stringToByte(CardType,2);
            result.push(CardType);
            StoreNo = this.stringToByte(StoreNo,20);
            result.push(StoreNo);
            BusinessDay = this.stringToByte(BusinessDay,8);
            result.push(BusinessDay);
            CashRegNo = this.stringToByte(CashRegNo,6);
            result.push(CashRegNo);
            CashierNo = this.stringToByte(CashierNo,6);
            result.push(CashierNo);
            Amount = this.stringToByte(Amount,12);
            result.push(Amount);
            Ticket_Amount = this.stringToByte(Ticket_Amount,12);
            result.push(Ticket_Amount);
            non_sale_Amount = this.stringToByte(non_sale_Amount,12);
            result.push(non_sale_Amount);
            CashTraceNo = this.stringToByte(CashTraceNo,6);
            result.push(CashTraceNo);
            OriginTrace = this.stringToByte(OriginTrace,64);
            result.push(OriginTrace);
            Reserved1 = this.stringToByte(Reserved1,48);
            result.push(Reserved1);
            Reserved2 = this.stringToByte(Reserved2,48);
            result.push(Reserved2);
            Reserved3 = this.stringToByte(Reserved3,48);
            result.push(Reserved3);
            Reserved4 = this.stringToByte(Reserved4,48);
            result.push(Reserved4);
            Reserved5 = this.stringToByte(Reserved5,48);
            result.push(Reserved5);
            item_line_qty = this.stringToByte(item_line_qty,2);
            result.push(item_line_qty);
            if(typeof(item_information)=="string"){
                item_information = this.stringToByte(item_information,50);
            }else{
                if(typeof(item_information) == "object"){
                    if(item_information.length == undefined){
                        item_information = JSON.stringify(item_information);
                        item_information = this.stringToByte(item_information,50);
                    }else{
                        var tempArr = [];
                        for(var ii in item_information){
                            var tmp = item_information[ii];
                            if(typeof(tmp)=="object"){
                                tmp = JSON.stringify(tmp);
                            }
                            tmp = this.stringToByte(tmp,50);
                            tempArr.push(tmp);
                        }
                        // if(tempArr.length<99){
                        //     for(var ii=0;ii<99-tempArr.length;ii++){
                        //         var tmp = this.stringToByte('',50);
                        //         tempArr.push(tmp);
                        //     }
                        // }
                        item_information = tempArr;
                    }
                }
            }
            result.push(item_information);
            return result;
        },

        /**
         * 判断带入对象是否为空
         * @param {any} object 
         * @returns boolean
         */
        isEmpty:function(object){
            var value=object;
            if(typeof(object)=="object"){
                if(object==undefined||object==null){
                    return true;
                }
                value = object.value || object.innerHTML || object.innerText;
            }
            if(value==""||value==undefined||value==null){
                return true;
            }
            return false;
        },



        /**
         * 系统保留函数不建议使用
         */
        // clears the data buffer
        clear: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "clear", []);
        },
        // removes data subscription
        unsubscribeRawData: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "unsubscribeRaw", []);
        },
        connect: function (macAddress, success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "connect", [macAddress]);
        },
        // Android only - see http://goo.gl/1mFjZY
        connectInsecure: function (macAddress, success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "connectInsecure", [macAddress]);
        },
        disconnect: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "disconnect", []);
        },
        // list bound devices
        list: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "list", []);
        },
        isEnabled: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "isEnabled", []);
        },
        isConnected: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "isConnected", []);
        },
        // the number of bytes of data available to read is passed to the success function
        available: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "available", []);
        },
        // read all the data in the buffer
        read: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "read", []);
        },
        // reads the data in the buffer up to and including the delimiter
        readUntil: function (delimiter, success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "readUntil", [delimiter]);
        },
        // calls the success callback when new data is available
        subscribe: function (delimiter, success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "subscribe", [delimiter]);
        },
        // removes data subscription
        unsubscribe: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "unsubscribe", []);
        },
        // calls the success callback when new data is available with an ArrayBuffer
        subscribeRawData: function (success, failure) {
            successWrapper = function(data) {
                // Windows Phone flattens an array of one into a number which
                // breaks the API. Stuff it back into an ArrayBuffer.
                if (typeof data === 'number') {
                    var a = new Uint8Array(1);
                    a[0] = data;
                    data = a.buffer;
                }
                success(data);
            };
            cordova.exec(successWrapper, failure, "BluetoothSerial", "subscribeRaw", []);
        },
        // reads the RSSI of the *connected* peripherial
        readRSSI: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "readRSSI", []);
        },
        showBluetoothSettings: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "showBluetoothSettings", []);
        },
        enable: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "enable", []);
        },
        discoverUnpaired: function (success, failure) {
            cordova.exec(success, failure, "BluetoothSerial", "discoverUnpaired", []);
        },
        setDeviceDiscoveredListener: function (notify) {
            if (typeof notify != 'function')
                throw 'BluetoothSerial.setDeviceDiscoveredListener: Callback not a function';

            cordova.exec(notify, null, "BluetoothSerial", "setDeviceDiscoveredListener", []);
        },
        clearDeviceDiscoveredListener: function () {
            cordova.exec(null, null, "BluetoothSerial", "clearDeviceDiscoveredListener", []);
        },
        setName: function (newName) {
            cordova.exec(null, null, "BluetoothSerial", "setName", [newName]);
        },
        setDiscoverable: function (discoverableDuration) {
            cordova.exec(null, null, "BluetoothSerial", "setDiscoverable", [discoverableDuration]);
        },

        /**
         * interface begin
         */
        uintFormat:function(uint8array,delimiter,system){
            return UintFormat(uint8array,delimiter,system);
        },
        stringToByte:function(Str,length){
            return StringToByte(Str,length);
        },
        decodeuint8arr:function(uint8array){
            return Decodeuint8arr(uint8array);
        },
        encodeuint8arr:function(String){
            return Encodeuint8arr(String);
        }
    };


    /**
     * 共通工具函数部分
     */

    /**
     * Convert an Uint8Array into a string.
     * @param {Buffer} uint8array   数据缓存
     * @param {int} system          进制
     * @param {String} delimiter    分隔符
     * @returns {String}
     */
    var UintFormat=function(uint8array,delimiter,system){
        if(system==undefined) system=16;
        if(delimiter==undefined) delimiter="";
        var data=new Array();
        for(i in uint8array){
            var tmp = uint8array[i];
            if(system==16){
                tmp=tmp.toString(system);
                if(tmp.length<2) tmp="0"+tmp;
                tmp="0x"+tmp;
            }
            data.push("data["+(i<10?"0"+i:i)+"]:"+tmp);
        }
        if(data.length==0) return "";
        return delimiter+data.join(delimiter);
    }
    
    /**
     * 转换 Uint8Array 为 string.
     * @param {Buffer} uint8array   数据
     * @returns {String}
     */
    var Decodeuint8arr=function(uint8array){
        var data = new TextDecoder("utf-8").decode(uint8array);
        return data===undefined?"":data;
    }

    /**
     * 转换 string 为 Uint8Array.
     * @param {String} String       数据
     * @returns {Uint8Array}        
     */
    var Encodeuint8arr=function(String){
        return new TextEncoder("utf-8").encode(String);
    }

    /**
     * 字符转二进制
     * @param {string}  String      数据
     * @param {int}     length      指定数据长度（不足的以0x00补位）
     * @returns {bytes}
     */
    var StringToByte=function(String,length) {
        if(length == undefined) length = "";
        var bytes = new Array();
        var len, c;
        len = String.length;
        for(var i = 0; i < len; i++) {
            c = String.charCodeAt(i);
            if(c >= 0x010000 && c <= 0x10FFFF) {
                bytes.push(((c >> 18) & 0x07) | 0xF0);
                bytes.push(((c >> 12) & 0x3F) | 0x80);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if(c >= 0x000800 && c <= 0x00FFFF) {
                bytes.push(((c >> 12) & 0x0F) | 0xE0);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if(c >= 0x000080 && c <= 0x0007FF) {
                bytes.push(((c >> 6) & 0x1F) | 0xC0);
                bytes.push((c & 0x3F) | 0x80);
            } else {
                bytes.push(c & 0xFF);
            }
        }
        if(length != ""){
            length = parseInt(length);
            if(length>bytes.length){
                for(var i=0;i<length-bytes.length;i++){
                    bytes.push(0x00);
                }
            }
        }
        return bytes;
    }

    /**
     * 将 string 转换为 Uint8Array
     * @param {String} str      数据
     * @returns {Uint8Array}
     */
    var stringToArrayBuffer = function(str) {
        var ret = new Uint8Array(str.length);
        for (var i = 0; i < str.length; i++) {
            ret[i] = str.charCodeAt(i);
        }
        return ret.buffer;
    };

    /**
     * 日期格式化绑定函数
     * @param {Date} fmt        日期值（日期格式）
     * @returns {String}    
     */
    Date.prototype.Format = function(fmt){
        var o = {   
            "M+" : this.getMonth()+1,                 //月份   
            "d+" : this.getDate(),                    //日   
            "h+" : this.getHours(),                   //小时   
            "m+" : this.getMinutes(),                 //分   
            "s+" : this.getSeconds(),                 //秒   
            "q+" : Math.floor((this.getMonth()+3)/3), //季度   
            "S"  : this.getMilliseconds()             //毫秒   
        };   
        if(/(y+)/.test(fmt))   
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   
        for(var k in o)   
            if(new RegExp("("+ k +")").test(fmt))   
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
        return fmt;
    }
});
