import { getModelUrlByChannel, getTypeAttr, getUnitEnum, getColorBystatus } from './enum';
import { getArrangeInRowData } from './common';
import { loadgltfByPos, loadgltfByPosOri, changeModelColor, loadmodelPrimitives, getColor } from './view';
import { INIT_LOAD, DEFULT_VALUE, STATUS_COLOR } from '../constants';
import { isEmpty } from '../utils';
import { cartesian3FromDegrees, headingPitchRoll, headingPitchRollQuaternion, cesiumColorfromAlpha, COLOR_TRANSPARENT, SHODOW_MODE_DISABLED } from '../utils/cesiumUtils'

/**
* 初始化场景
* @param {String} elId:加载场景的div元素的id;
*/
let initView = (elId) => {
    let viewer = new Cesium.Viewer(elId, {
        animation: false,//不会创建'动画'小部件
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false, //是否显示3D/2D选择器
        selectionIndicator: true,
        timeline: false,
        navigationHelpButton: false, //是否显示右上角的帮助按钮
        scene3DOnly: true,//每个几何体实例将仅以3D渲染以节省GPU内存
        terrainShadows: SHODOW_MODE_DISABLED,
        // skyAtmosphere: false,
        // requestRenderMode: true,
        // maximumRenderTimeChange: Infinity,
        contextOptions: {
            webgl: {
                alpha: true,
                //通过canvas.toDataURL()实现截图需要将该项设置为true
                preserveDrawingBuffer: true,
            },
        },
    });
    //设置场景
    var scene = viewer.scene;
    scene.backgroundColor = COLOR_TRANSPARENT;
    scene.globe.show = false;
    scene.globe.baseColor = COLOR_TRANSPARENT;
    scene.globe.lightingFadeOutDistance = 650000000;
    scene.skyBox.show = false;
    scene.sun.show = false;
    scene.sunBloom = false;
    scene.moon.show = false;
    // scene.fog.enabled = false;

    // //去除版权信息
    viewer._cesiumWidget._creditContainer.style.display = 'none';
    //最小缩放级别
    scene.screenSpaceCameraController.minimumZoomDistance = 20;
    //最大缩放级别
    scene.screenSpaceCameraController.maximumZoomDistance = 5000;

    // var shadowMap = viewer.shadowMap;
    // shadowMap.enabled = true;
    // shadowMap.darkness = 1.2;
    // scene.globe.depthTestAgainstTerrain = false;

    return viewer;
};

//sence.primitives加载设备模型
let loadDeviceModels = (modelObj, pos, viewer, modelType, params, modifyLabel) => {
    var entityArr = [];
    for (var i = 0; i < modelObj.length; i++) {
        var modelOne = modelObj[i];
        var modelOneUrl = modelOne.url;
        if (modelOneUrl) {
            //id  
            //采用
            //没有id时，使用模型的gltf名称作为modelId;
            //设备模型，使用模型的gltf名称作为modelId；
            var modelId = modelOne.id;
            if (modelId == undefined || modelType == 'device') {
                var url0 = modelOne.url.split('/');
                var url1 = url0[url0.length - 1];
                modelId = url1.substring(0, url1.indexOf('.'));
            }
            //设备模型id前添加device标注
            if (modelType == 'device') {
                //设备模型中剔除包含'infrastructure'（地面或基础辅助设施）的设备模型
                if (modelId && modelId.indexOf('infrastructure') == -1) {
                    modelId = `device_${modelId}`;
                }
            }
            //url
            var modelUrl = params.resourceProUrl + modelOneUrl;
            modelUrl = modelUrl.replace(/\\/g, '/');
            if (window.switchLocalTest) {
                /**本地测试 */
                modelUrl = modelOne.url;
            }
            // modifyLabelUrl = "https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png";// "http://192.168.14.101:7000/static/3dmodels/category_1/type_32/c9e6b848-bb8b-4347-93cd-567c58d3fc0e/images/0_biaoqian_1-20210121.jpg";
            //position
            var posNew = {};
            if (modelOne.position) {
                Object.assign(posNew, pos, JSON.parse(modelOne.position));
            } else {
                posNew = pos;
            }
            //size
            var size = isEmpty(modelOne.size) ? INIT_LOAD.size : modelOne.size;
            entityArr[i] = loadmodelPrimitives(modelId, posNew, size, modelUrl, viewer, modifyLabel);
        }
    }
    return entityArr;
}

/**
 * 批量加载设备/传感器模型
 * @param modelObj
 * @param pos
 * ...
 */
let loadModels = (modelObj, pos, viewer, modelType, params) => {
    var entityArr = [];
    for (var i = 0; i < modelObj.length; i++) {
        var modelOne = modelObj[i];
        var modelId = modelOne.id;
        //处理没有modelId时，使用模型的gltf名称作为modelId;
        if (modelId == undefined) {
            var url0 = modelOne.url.split('/');
            var url1 = url0[url0.length - 1];
            modelId = url1.substring(0, url1.indexOf('.'));
        }
        //设备模型id前添加device标注
        if (modelType == 'device') {
            modelId = `device_${modelId}`;
        }
        var modelOneUrl = modelOne.url;
        //添加传感器模型的默认url;
        if (modelType == 'sensor' && modelOneUrl == '') {
            var modelOneRes = getModelUrlByChannel(modelOne.type);
            modelOneUrl = modelOneRes.url;
        }
        if (modelOneUrl) {
            var modelUrl = params.resourceProUrl + modelOneUrl;
            modelUrl = modelUrl.replace(/\\/g, '/');
            if (window.switchLocalTest) {
                /**本地测试 */
                modelUrl = modelOne.url;
            }
            if (modelOne.position) {
                var posNew = {};
                Object.assign(posNew, pos, JSON.parse(modelOne.position));
                var position = cartesian3FromDegrees(posNew.lon, posNew.lat, posNew.alt);
                var hpr0 = headingPitchRoll(posNew.heading, posNew.pitch, posNew.roll);
                var orientation0 = headingPitchRollQuaternion(position, hpr0);
                var size0 = modelOne.size ? modelOne.size : 80;
                entityArr[i] = loadgltfByPosOri(
                    modelId,
                    position,
                    orientation0,
                    size0,
                    modelUrl,
                    viewer
                );
            } else {
                var posN = pos;
                //模型个数大于1时，考虑按行排列问题，否则采用原位置
                if (modelType == 'sensor' && modelObj.length > 1) {
                    posN = getArrangeInRowData(i, pos, INIT_LOAD.numRow);
                }
                var positionN = cartesian3FromDegrees(posN.lon, posN.lat, posN.alt);
                entityArr[i] = loadgltfByPos(modelId, positionN, null, modelUrl, viewer);
            }
        }
    }
    return entityArr;
}

/**
 * 批量加载模型
 * @param modelObj
 * @param pos
 * ...
 */
let loadEntity = (dataRes, viewer, resourceProUrl) => {
    var entityList = [];
    let urlList = dataRes.url.filter((d) => d.url !== '' && d.url !== null);
    
    console.log('112 urlList',urlList)
    console.log('112 window.Cesium',window.Cesium)
    if (!isEmpty(urlList)) {
        for (var i = 0; i < urlList.length; i++) {
            var urlObj = urlList[i];
            var id = urlObj.id, url = (resourceProUrl + urlObj.url).replace(/\\/g, '/');
            if (id == undefined) {
                var urle0 = urlObj.url.split('/');
                var urle1 = urle0[urle0.length - 1];
                id = urle1.substring(0, urle1.indexOf('.'));
            }
            var posN = DEFULT_VALUE.POSTION;
            if (!isEmpty(dataRes.position)) {
                Object.assign(posN, JSON.parse(dataRes.position));
            }
            var positionE = cartesian3FromDegrees(posN.lon, posN.lat, posN.alt);
            var hprE0 = headingPitchRoll(posN.heading, posN.pitch, posN.roll);
            var orientationE0 = headingPitchRollQuaternion(positionE, hprE0);
            var sizeE0 = dataRes.size ? dataRes.size : 80;
            entityList[i] = loadgltfByPosOri(
                id,
                positionE,
                orientationE0,
                sizeE0,
                url,
                viewer
            );
        }
    }
    
    console.log('112 entityList',entityList)
    return entityList;
}


//更新传感器模型颜色状态
let updateModelStatus = (sensorEntityArr, sensorId, status, statusColor) => {
    sensorEntityArr.map((seItem) => {
        var sensorModelId = seItem.name;
        if (sensorModelId == sensorId) {
            changeModelColor(seItem.model, status, {}, statusColor);
        }
    });
};


let getColor00 = (status) => {
    var color99;
    switch (status) {
        case 10:
            color99 = STATUS_COLOR.LOSTCONNECT;//传感器失联
            break;
        case 3:
            color99 = STATUS_COLOR.SERIOUS;
            break;
        case 2:
            color99 = STATUS_COLOR.ALARM;
            break;
        case 1:
            color99 = STATUS_COLOR.WARNING;
            break;
    }
    return color99;
}

//更新设备模型颜色状态
let updateDeviceModelStatus = (deviceEntityArr, deviceIds = [], status) => {
    deviceEntityArr.map((deItem) => {
        var deviceModelId = deItem.id;
        if (deviceModelId) {
            var start = deviceModelId.indexOf('_');
            deviceModelId = deviceModelId.substring(start + 1);
        }
        if (!isEmpty(deviceIds)) {
            deviceIds.map((dId) => {
                var flag = deviceModelId == dId;
                if (flag) {
                    let colorDevice;
                    if (status == 1) {
                        colorDevice = STATUS_COLOR.WARNING;
                    } else if (status == 2) {
                        colorDevice = STATUS_COLOR.ALARM;
                    } else if (status == 3) {
                        colorDevice = STATUS_COLOR.SERIOUS;
                    } else {
                        colorDevice = STATUS_COLOR.LOSTCONNECT;
                    }
                    deItem.color = cesiumColorfromAlpha(colorDevice, parseFloat(1));
                }
            });
        }
    });
};

//更新实时数据
let updateRealData = (tpLastData) => {
    var res = {
        value: 0,
        color: '#fff',
        unit: '',
    };
    if (tpLastData) {
        var tpLastDataObject = tpLastData.dataObject;
        if (tpLastDataObject) {
            var attr = getTypeAttr(tpLastData.dataType);
            if (attr !== '') {
                res.value = tpLastData.dataObject[attr];
            }
            res.unit = getUnitEnum(tpLastDataObject.dataUnit);
        }
        res.color = getColorBystatus(tpLastData.status);
    }
    return res;
};

export {
    initView,
    loadDeviceModels,
    loadModels,
    updateModelStatus,
    updateDeviceModelStatus,
    updateRealData,
    loadEntity,
}