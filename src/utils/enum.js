import { isEmpty } from ".";
import { STATUS_COLOR } from "../constants";
import { cesiumColorFromBytes } from '../utils/cesiumUtils'

let getColorBystatus = (status) => {
    var color = '#1890ff';
    switch (Number(status)) {
        case 2:
            color = '#f5222d';
            break;
        case 1:
            color = '#faad14';
            break;
        case 0:
            color = '#1890ff';
            break;
        default:
    }
    return color;
};

//传感器枚举值与模型url对应关系
let getModelUrlByChannel = (key) => {
    var res = {
        typeName: '',
        url: '',
    };
    switch (Number(key)) {
        case 0:
            res.typeName = '内置局放传感器';
            res.url = '';
            break;
        case 1:
        case 2:
            res.typeName = '特高频智能传感器';
            res.url = '3dModels/sensor/UHF.gltf';
            break;
        case 3:
            res.typeName = '高频智能传感器';
            res.url = '3dModels/sensor/HFCT.gltf';
            break;
        case 4:
            res.typeName = '外置三合一智能传感器';
            res.url = '3dModels/sensor/3in1.gltf';
            break;
        case 5:
            res.typeName = '避雷器电流智能传感器';
            res.url = '';
            break;
        case 6:
            res.typeName = '避雷器电压智能传感器';
            res.url = '';
            break;
        case 7:
            res.typeName = '振动智能传感器';
            res.url = '';
            break;
        case 8:
            res.typeName = '环境智能传感器';
            res.url = '';
            break;
        case 9:
            res.typeName = '机械特性智能监视仪（lora）';
            res.url = '';
            break;
        case 10:
            res.typeName = '机械特性传感器（433）';
            res.url = '';
            break;
        case 11:
            res.typeName = '变压器超声智能传感器';
            res.url = '3dModels/sensor/AE.gltf';
            break;
        case 12:
            res.typeName = 'gis超声智能传感器';
            res.url = '3dModels/sensor/AE.gltf';
            break;
        case 46:
            res.typeName = '温湿度智能传感器';
            res.url = '3dModels/sensor/temp.gltf';
            break;
        case 49:
            res.typeName = '空间特高频';
            res.url = '3dModels/sensor/kjuhf.gltf';
            break;
        default:
            break;
    }
    return res;
};

/**
 * 获取不同数据【监(检)测】类型展示的属性值
 * @param {枚举值} key
 */
let getTypeAttr = (key) => {
    var attr = '';
    switch (Number(key)) {
        case 0:
            attr = 'max';
            break;
        case 1:
            attr = 'gain';
            break;
        case 2:
            attr = 'triggerAmp';
            break;
        case 3:
            attr = 'maxValue';
            break;
        case 4:
            attr = 'peak';
            break;
        case 5:
            attr = 'triggerAmp';
            break;
        case 7:
            attr = 'maxq';
            break;
        case 12:
            attr = 'maxTemperature';
            break;
        case 13:
            attr = 'switchState';
            break;
        case 26:
            attr = 'temperature';
            break;
        case 27:
            attr = 'humidity';
            break;
        case 26:
            attr = 'temperature';
            break;
        default:
            break;
    }
    return attr;
};

/**
 * 获取不同数据【监(检)测】类型的枚举对应值
 * @param {枚举值} key
 */
let getTypeEnum = (key) => {
    var type = '';
    switch (Number(key)) {
        case 0:
            type = 'TEV幅值'; //TEV测试幅值，单数值，有用
            break;
        case 1:
            type = 'AE幅值'; //AE测试幅值，单数值，无用
            break;
        case 2:
            type = 'AE波形'; //AE波形图谱数据类型
            break;
        case 3:
            type = 'AE相位'; //AE相位图谱数据类型
            break;
        case 4:
            type = 'AE幅值'; //AE幅值图谱数据类型
            break;
        case 5:
            type = 'AE飞行'; //AE飞行图谱数据类型
            break;
        case 6:
            type = 'UHF幅值'; //UHF测试幅值，单数值，无用
            break;
        case 7:
            type = '特高频'; //UHF PRPS和PRPD图谱数据类型
            break;
        case 8:
            type = 'UHF Per'; //UHF周期检测图谱数据类型
            break;
        case 9:
            type = 'HFCT Amp'; //HFCT测试幅值，单数值，无用
            break;
        case 10:
            type = '高频'; //HFCT PRPS和PRPD图谱数据类型
            break;
        case 11:
            type = 'HFCT Per'; //HFCT周期检测图谱数据类型
            break;
        case 12:
            type = '红外'; //红外检测图谱数据类型
            break;
        case 13:
            type = '机械特性'; //机械特性数据
            break;
        case 14:
            type = 'G1500IMG'; //PDS-G1500中示波器图片
            break;
        case 15:
            type = 'G1500DATA'; //PDS-G1500中示波器Bin数据文件
            break;
        case 16:
            type = 'G1500CHCFG'; //PDS-G1500中示波器Txt通道配置文件
            break;
        case 17:
            type = 'Photo'; //照片（包括手机、相机等）
            break;
        case 18:
            type = 'Voice'; //音频（包括手机录音文件、放电录音文件等）
            break;
        case 19:
            type = 'Video'; //视频（包括手机录像文件等）
            break;
        case 20:
            type = 'TXT'; //文本
            break;
        case 21:
            type = 'UHFPRPSVIDEO'; //UHF PRPS 回放数据
            break;
        case 22:
            type = 'HFCTPRPSVIDEO'; //HFCT PRPS 回放数据
            break;
        case 23:
            type = '避雷器电流'; //避雷器电流
            break;
        case 24:
            type = '避雷器电压'; //避雷器电压
            break;
        case 25:
            type = '振动'; //振动
            break;
        case 26:
            type = '温度'; //温度
            break;
        case 27:
            type = '湿度'; //湿度
            break;
        case 28:
            type = '气压'; //气压
            break;
        case 29:
            type = '降雨量'; //降雨量
            break;
        case 30:
            type = '降雨强度'; //降雨强度
            break;
        case 31:
            type = '光辐射强度'; //光辐射强度
            break;
        case 32:
            type = '噪声'; //噪声
            break;
        case 33:
            type = '风速'; //风速
            break;
        case 34:
            type = '原始测量霜点'; //原始测量霜点
            break;
        case 35:
            type = '标准大气压下霜点'; //标准大气压下霜点
            break;
        case 46:
            type = '断路器'; //断路器
            break;
        case 54:
            type = '水浸'; //水浸
            break;
        case 55:
            type = '声压'; //声压
            break;
        case 56:
            type = '录波'; //录波
            break;
        case 57:
            type = '环境'; //环境
            break;
        case 63:
            type = '低压测量'; //低压测量
            break;
        case 64:
            type = 'SF6'; //包含SF6和氧气-上海配网项目新增
            break;
        case 65:
            type = '烟雾报警'; //烟雾报警
            break;
        case 66:
            type = '水位'; //水位
            break;
        case 67:
            type = '红外热成像'; //红外热成像-new
            break;
        case 68:
            type = '热干温度'; //热干温度-new
            break;
        case 69:
            type = '热干负载电流'; //热干负载电流-new
            break;
        case 70:
            type = '枪机'; //枪机-new
            break;
        case 71:
            type = '技防'; //技防-new
            break;
        case 72:
            type = '蓄电池'; //蓄电池
            break;
        case 73:
            type = 'TEV Pulse'; //Tev 脉冲
            break;
        case 74:
            type = '铁芯电流'; //铁芯电流
            break;
        case 75:
            type = '油色谱'; //油色谱
            break;
        case 80:
            type = 'AE PRPS'; //AE PRPS
            break;
        default:
            type = '未知'; //
            break;
    }
    return type;
};

// 获取不同监测类型数据单位的枚举对应值
let getUnitEnum = (key) => {
    var unit = '';
    switch (Number(key)) {
        case 0:
            unit = '';
            break;
        case 1:
            unit = 'dB';
            break;
        case 2:
            unit = 'dBm';
            break;
        case 3:
            unit = 'dBmV';
            break;
        case 4:
            unit = 'dBμV';
            break;
        case 5:
            unit = 'V';
            break;
        case 6:
            unit = 'mV';
            break;
        case 7:
            unit = 'μV';
            break;
        case 8:
            unit = '%';
            break;
        case 9:
            unit = 'A';
            break;
        case 10:
            unit = 'mA';
            break;
        case 11:
            unit = 'μA';
            break;
        case 12:
            unit = 'Ω';
            break;
        case 13:
            unit = 'mΩ';
            break;
        case 14:
            unit = 'μΩ';
            break;
        case 15:
            unit = 'm/s²';
            break;
        case 16:
            unit = 'mm';
            break;
        case 17:
            unit = '℃';
            break;
        case 18:
            unit = '℉';
            break;
        case 19:
            unit = 'Pa';
            break;
        case 20:
            unit = 'C';
            break;
        case 21:
            unit = 'mC';
            break;
        case 22:
            unit = 'μC';
            break;
        case 23:
            unit = 'nC';
            break;
        case 24:
            unit = 'pC';
            break;
        case 25:
            unit = 'kV';
            break;
        case 26:
            unit = 'KW';
            break;
        case 27:
            unit = 'kVar';
            break;
        case 28:
            unit = 'ppm';
            break;
        case 29:
            unit = 'cm';
            break;
        case 30:
            unit = 'ms';
            break;
        case 31:
            unit = 'μL/L';
            break;
        default:
            break;
    }
    return unit;
};

let getModelColor = (data) => {
    let modelColor = STATUS_COLOR;
    if (!isEmpty(data)) {
        let L0 = data.SELECTED, L1 = data.WARNING, L2 = data.ALARM, L3 = data.SERIOUS, L10 = data.LOSTCONNECT;
        modelColor = {
            SELECTED: L0 ? cesiumColorFromBytes(L0[0], L0[1], L0[2], L0[3]) : STATUS_COLOR.SELECTED,
            ALARM: L2 ? cesiumColorFromBytes(L2[0], L2[1], L2[2], L2[3]) : STATUS_COLOR.ALARM,
            WARNING: L1 ? cesiumColorFromBytes(L1[0], L1[1], L1[2], L1[3]) : STATUS_COLOR.WARNING,
            SERIOUS: L3 ? cesiumColorFromBytes(L3[0], L3[1], L3[2], L3[3]) : STATUS_COLOR.SERIOUS,
            LOSTCONNECT: L10 ? cesiumColorFromBytes(L10[0], L10[1], L10[2], L10[3]) : STATUS_COLOR.LOSTCONNECT,//失联
        }
    }
    return modelColor;
}



export {
    getColorBystatus,
    getModelUrlByChannel,
    getTypeAttr,
    getTypeEnum,
    getUnitEnum,
    getModelColor,
}