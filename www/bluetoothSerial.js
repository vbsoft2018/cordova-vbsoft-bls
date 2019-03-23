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
         * @param {sendEnum}    type    发包类型
         * @param {pathEnum}    path    报文类型
         * @param {String}      msg     发包内容
         * @param {function}    success 成功回调
         * @param {function}    failure 失败回调
         */
        getRequsetData:function(type,path,msg,success,failure){
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
            msg=this.stringToByte(msg);
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
                data.push(msg[i]);
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
        // writes data to the bluetooth serial port
        // data can be an ArrayBuffer, string, integer array, or Uint8Array
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
        // 允许POS机的连接
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
        uintFormat:function(uint8array,delimiter,system){
            return UintFormat(uint8array,delimiter,system);
        },
        stringToByte:function(Str){
            return StringToByte(Str);
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
     * @returns {String}
     */
    var UintFormat=function(uint8array,delimiter,system){
        if(system==undefined) system=16;
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
     * Convert an Uint8Array into a string.
     * @param {Buffer} uint8array   数据
     */
    var Decodeuint8arr=function(uint8array){
        var data = new TextDecoder("utf-8").decode(uint8array);
        return data===undefined?"":data;
    }
    /**
     * Convert a string into a Uint8Array.
     * @returns {Uint8Array}
     */
    var Encodeuint8arr=function(String){
        return new TextEncoder("utf-8").encode(String);
    }
    /**
     * 字符转二进制
     * @param {string} String 
     */
    var StringToByte=function(String) {
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
        return bytes;
    }
    var stringToArrayBuffer = function(str) {
        var ret = new Uint8Array(str.length);
        for (var i = 0; i < str.length; i++) {
            ret[i] = str.charCodeAt(i);
        }
        return ret.buffer;
    };
    /**
     * 日期格式化绑定函数
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