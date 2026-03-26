import { CESIUM_MATH } from '../utils/cesiumUtils'

//设置模型大小
let setSize = (size, entity) => {
    entity.model.scale = size;
};

//修改模型位置
let changePosition = (value, entity) => {
    entity.position = value;
};

//修改模型方位角
let changeParamsValue = (e, paramsObj) => {
    var pos = paramsObj.position;
    var hpRoll = paramsObj.hpRoll;
    var deltaRadians = CESIUM_MATH.toRadians(1.0);
    /**
     * 'position'：方向（经纬度增减）
     * 'size'：大小
     * 'orientation'：方位角
     */
    var changeType = 'postion';
    switch (e.keyCode) {
        case 87: //W
            pos.latitude = pos.latitude + 0.00002;
            changeType = 'postion';
            break;
        case 88: //X
            pos.latitude = pos.latitude - 0.00002;
            changeType = 'postion';
            break;
        case 65: //A
            pos.longitude = pos.longitude - 0.00002;
            changeType = 'postion';
            break;
        case 68: //D
            pos.longitude = pos.longitude + 0.00002;
            changeType = 'postion';
            break;
        case 72: //H
            pos.height = pos.height + 2;
            changeType = 'postion';
            break;
        case 76: //L
            pos.height = pos.height - 2;
            changeType = 'postion';
            break;
        case 187: //+  bigger
            paramsObj.size++;
            changeType = 'size';
            break;
        case 189: //- smaller
            paramsObj.size--;
            changeType = 'size';
            break;
        case 40:
            // pitch down
            hpRoll.pitch -= deltaRadians;
            if (hpRoll.pitch < -CESIUM_MATH.TWO_PI) {
                hpRoll.pitch += CESIUM_MATH.TWO_PI;
            }
            changeType = 'orientation';
            break;
        case 38:
            // pitch up
            hpRoll.pitch += deltaRadians;
            if (hpRoll.pitch > CESIUM_MATH.TWO_PI) {
                hpRoll.pitch -= CESIUM_MATH.TWO_PI;
            }
            changeType = 'orientation';
            break;
        case 37:
            if (e.shiftKey) {
                // roll left
                hpRoll.roll += deltaRadians;
                if (hpRoll.roll > CESIUM_MATH.TWO_PI) {
                    hpRoll.roll -= CESIUM_MATH.TWO_PI;
                }
            } else {
                // turn left
                hpRoll.heading += deltaRadians;
                if (hpRoll.heading > CESIUM_MATH.TWO_PI) {
                    hpRoll.heading -= CESIUM_MATH.TWO_PI;
                }
            }
            changeType = 'orientation';
            break;
        case 39:
            if (e.shiftKey) {
                // roll right
                hpRoll.roll -= deltaRadians;
                if (hpRoll.roll < 0.0) {
                    hpRoll.roll += CESIUM_MATH.TWO_PI;
                }
            } else {
                // turn right
                hpRoll.heading -= deltaRadians;
                if (hpRoll.heading < 0.0) {
                    hpRoll.heading += CESIUM_MATH.TWO_PI;
                }
            }
            changeType = 'orientation';
            break;
        default:
            break;
    }
    paramsObj.hpRoll = hpRoll;
    return { paramsObj, changeType };
};
export {
    setSize,
    changePosition,
    changeParamsValue,
}