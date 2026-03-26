import { SONSOR_POSITION_ALT, SSONSOR_POSITION_ALT_DEFAULT, STATUS_COLOR, INIT_LOAD } from '../constants';
import { isEqual, isEmpty } from '../utils';
import { setSize, changePosition } from '../utils/edit';
import { cartesian3FromDegrees, cesiumColor, headingPitchRoll, cesiumCartesian3, headingPitchRollQuaternion, headingPitchRange, headingPitchRollToFixedFrame, CESIUM_MATH, SHODOW_MODE_RECEIVE_ONLY, EASING_FUNCTION_SINUSOIDAL_IN, EASING_FUNCTION_LINEAR_NONE } from '../utils/cesiumUtils'
import { getArrangeInRowData } from './common';

let updateImage = (model, json, modifyLabel) => {
    var textureIndexToReplace = -1;
    if (json && json.images) {
        let i = 0;
        for (var key in json.images) {
            if (key == modifyLabel.key) {
                textureIndexToReplace = i;
            } else {
                i++;
            }
        }
        if (textureIndexToReplace !== -1) {
            let modifyLabelUrl = "/static" + modifyLabel.imageUrl;
            modifyLabelUrl = modifyLabelUrl.replace(/\\/g, '/');
            if (window.switchLocalTest) {
                /**本地测试 */
                modifyLabelUrl = modifyLabel.imageUrl;
            }
            Cesium.Resource.fetchImage({
                url: modifyLabelUrl
            }).then(function (image) {
                var textures = model._rendererResources.textures;
                var texture = textures[textureIndexToReplace];
                // texture.copyFrom(image);
                texture.copyFrom({
                    source: image,
                });
                texture.generateMipmap(); // Also replaces textures in mipmap
            });
        }
    }
}

let modelBiaoqian = (model, modifyLabelList) => {
    // var imageUrl = './public/data/models/ZBYQ01/images/BYQ_088.jpg';
    Cesium.Resource.fetchJson({
        url: model._resource.url,
    }).then(function (json) {
        if (!isEmpty(modifyLabelList)) {
            modifyLabelList.map(modifyLabel => {
                updateImage(model, json, modifyLabel);
            });
        }

    });
}

let updateImage2 = (model, modifyLabel) => { 
    let jsonImage = model.gltf.images;
     var textureIndexToReplace = -1;
    if (jsonImage) {
        for (let i = 0; i < jsonImage.length;i++) { 
            if (jsonImage[i].uri == modifyLabel.key) {
                textureIndexToReplace = i;
            }
        }
        if (textureIndexToReplace !== -1) {
            let modifyLabelUrl = "/static" + modifyLabel.imageUrl;
            modifyLabelUrl = modifyLabelUrl.replace(/\\/g, '/');
            if (window.switchLocalTest) {
                /**本地测试 */
                modifyLabelUrl = modifyLabel.imageUrl;
            }
            Cesium.Resource.fetchImage({
                url: modifyLabelUrl
            }).then(function (image) {
                var textures = model._rendererResources.textures;
                var texture = textures[textureIndexToReplace];
                // texture.copyFrom(image);
                texture.copyFrom({
                    source: image,
                });
                texture.generateMipmap(); // Also replaces textures in mipmap
            });
        }
    }
}

let modelBiaoqian2 = (model, modifyLabelList) => { 
 if (!isEmpty(modifyLabelList)) {
            modifyLabelList.map(modifyLabel => {
                updateImage2(model, modifyLabel);
            });
        }
}

let loadmodelPrimitives = (id, position, size, url, viewer, modifyLabel) => {
    var posNew = cartesian3FromDegrees(position.lon, position.lat, position.alt);
    var hpr = headingPitchRoll(position.heading, position.pitch, position.roll);
    var orientation = headingPitchRollToFixedFrame(posNew, hpr);
    var model = viewer.scene.primitives.add(Cesium.Model.fromGltf({
        id: id,
        url: url,
        modelMatrix: orientation,
        //dequantizeInShader:false,
        scale: size,
        incrementallyLoadTextures: false,
        colorBlendMode: 2,
        colorBlendAmount: 0
    }), id);
    model.readyPromise.then(function () {
        if (!isEmpty(modifyLabel)) {
           modelBiaoqian2(model, modifyLabel);
        }
    });
    return model;
}

let loadgltfByPos = (id, position, orientation, url, viewer) => {
    var entity = viewer.entities.add({
        name: id,
        position: position,
        model: {
            uri: url,
            shadows: SHODOW_MODE_RECEIVE_ONLY,
            scale: INIT_LOAD.size,
        },
    });
    return entity;
};

let loadgltfByPosOri = (id, position, orientation, size, url, viewer) => {
    var entity = viewer.entities.add({
        name: id,
        position: position,
        orientation: orientation,
        model: {
            uri: url,
            shadows: SHODOW_MODE_RECEIVE_ONLY,
            scale: size,
        },
    });
    return entity;
};

//定位飞行 3 参数格式不同，pos参数值为笛卡尔类型 json
let flyToPosition3 = (pos, duration, scene) => {
    scene.camera.flyTo({
        destination: cesiumCartesian3(pos.lon, pos.lat, pos.alt),
        duration: duration,
        orientation: {
            heading: pos.heading, //左右偏移
            pitch: pos.picth, //上下偏移
            roll: pos.roll,
        },
        easingFunction: EASING_FUNCTION_LINEAR_NONE,
    });
};

//pos为经纬度
let flyToPosition5 = (pos, duration, scene) => {
    if (!isEmpty(pos)) {
        scene.camera.flyTo({
            destination: cartesian3FromDegrees(pos.lon, pos.lat, pos.alt),
            duration: duration,
            orientation: {
                heading: pos.heading, //左右偏移
                pitch: pos.picth, //上下偏移
                roll: pos.roll,
            },
            // pitchAdjustHeight : 220,
            // flyOverLongitude: 1  CIRCULAR_IN
            easingFunction: EASING_FUNCTION_SINUSOIDAL_IN,
        });
    }
};

//设置camera的位置 经纬度
let setCameraPosition = (pos, viewer) => {
    var center = cartesian3FromDegrees(pos.lon, pos.lat, pos.alt);
    var heading = CESIUM_MATH.toRadians(pos.heading);
    var pitch = CESIUM_MATH.toRadians(pos.pitch);
    var range = pos.range;
    viewer.camera.lookAt(center, headingPitchRange(heading, pitch, range));
};

//获取当前场景视角
let getCurSceneView = (scene) => {
    var myCamera = scene.camera;
    var myPosition = myCamera.position;
    var myPositionX = myPosition.x;
    var myPositionY = myPosition.y;
    var myPositionZ = myPosition.z;
    var myHeading = myCamera.heading;
    var myPitch = myCamera.pitch;
    var myRoll = myCamera.roll;
    console.log(
        `"lon":${myPositionX},"lat":${myPositionY},"alt":${myPositionZ},"heading":${myHeading},"picth":${myPitch},"roll":${myRoll}`
    );
    return {
        initPos: {
            lon: myPositionX,
            lat: myPositionY,
            alt: myPositionZ,
            heading: myHeading,
            picth: myPitch,
            roll: myRoll,
        },
    };
};

//获取当前角度的经纬度值
let getCurSceneLon = (scene) => {
    var myCamera = scene.camera;
    var myPosition = myCamera.position;
    var cartographic = scene.globe.ellipsoid.cartesianToCartographic(myPosition);
    var lat = CESIUM_MATH.toDegrees(cartographic.latitude);
    var lng = CESIUM_MATH.toDegrees(cartographic.longitude);
    var alt = cartographic.height;
    var myHeading = myCamera.heading;
    var myPitch = myCamera.pitch;
    var myRoll = myCamera.roll;
    var res = `"lon":${lng},"lat":${lat},"alt":${alt},"heading":${myHeading},"picth":${myPitch},"roll":${myRoll}`;
    console.log(res);
    return {
        lon: lng,
        lat: lat,
        alt: alt,
        heading: myHeading,
        picth: myPitch,
        roll: myRoll,

    };
};

//修改模型颜色
let changeModelColor = (model, status, v, statusColor) => {
    var color = undefined;
    let modelColor = isEmpty(statusColor) ? STATUS_COLOR : statusColor;
    switch (status) {
        case 'selected':
            color = modelColor.SELECTED;
            break;
        case 10:
            color = modelColor.LOSTCONNECT;//传感器失联
            break;
        case 3:
            color = modelColor.SERIOUS;
            break;
        case 2:
            color = modelColor.ALARM;
            break;
        case 1:
            color = modelColor.WARNING;
            break;

        case 0:
            color = undefined; //透明色
            break;
        case 'cesiumColor':
            color = cesiumColor(v.red, v.green, v.blue, v.alpha);
            break;
        default:
    }
    if (model) {
        model.color = color;
    }
    return color;
};

//处理传感器选中状态
let handlerSensorSelectedStatus = (selectedObj, sensorEntityArr) => {
    //选中的传感器设置选中色；其他传感器，判断其颜色是否是选中色，是选中色才清除；避免清除报警状态；
    let selectedColor = STATUS_COLOR.SELECTED;
    sensorEntityArr.map((item) => {
        if (item.id == selectedObj.id) {
            changeModelColor(selectedObj.model, 'selected');
        } else {
            if (item.model.color) {
                let mColor = item.model.color;
                if (isEqual(mColor._value, selectedColor)) {
                    changeModelColor(item.model, 0);
                }
            }
        }
    });
}


//处理传感器状态
let handlerSensorStatus = (selectedObj, oldColorList) => {
    //选中的传感器设置选中色；其他传感器，设置其原状态；
    oldColorList.map((item) => {
        if (item.id == selectedObj.name) {
            changeModelColor(selectedObj.model, 'selected');
        } else {
            if (item.value == undefined) {
                changeModelColor(item.model, 0, item.value);
            } else {
                changeModelColor(item.model, 'cesiumColor', item.value);
            }
        }
    });
}

//修改模型颜色--根据cesium的color值
let changeModelCesiumColor = (model, v) => {
    model.color = cesiumColor(v.red, v.green, v.blue, v.alpha);
}

//返回传感器模型初始加载位置的高度
let getSensorPosAlt = (deviceType) => {
    // return pos.alt = deviceType == 1 ? 520 : deviceType == 32 ? 420 : 220; 
    let res = SONSOR_POSITION_ALT.find(v => v.deviceType == deviceType);
    return res ? res.alt : SSONSOR_POSITION_ALT_DEFAULT;
}

//修改模型位置，包括经纬度测试，方位角和模型大小；
//sensorReset 传感器属性信息（位置，大小）
//item 传感器模型实例
//pos 场景加载是的初始化位置，高度添加了设备高度偏移；
//sIndex需要重置的传感器在原传感器列表中的序列号，用于获取按行排序后的位置
let updatePositionSize = (params, model, pos, sIndex) => {
    let resPos = params.position;
    if (isEmpty(resPos)) {
        resPos = getArrangeInRowData(sIndex, pos, INIT_LOAD.numRow);
        params.size = INIT_LOAD.size;
    } else {
        var posNew = {};
        Object.assign(posNew, pos, JSON.parse(resPos));
        resPos = posNew;
    }
    let newPosition = cartesian3FromDegrees(
        resPos.lon,
        resPos.lat,
        resPos.alt
    );
    changePosition(newPosition, model);//位置
    setSize(params.size, model);//大小
    var hpr = headingPitchRoll(resPos.heading, resPos.pitch, resPos.roll);
    //方位角
    model.orientation = headingPitchRollQuaternion(
        newPosition,
        hpr
    );
}

export {
    loadmodelPrimitives,
    loadgltfByPos,
    loadgltfByPosOri,
    flyToPosition3,
    flyToPosition5,
    setCameraPosition,
    getCurSceneView,
    getCurSceneLon,
    changeModelColor,
    handlerSensorSelectedStatus,
    handlerSensorStatus,
    changeModelCesiumColor,
    getSensorPosAlt,
    updatePositionSize,
}