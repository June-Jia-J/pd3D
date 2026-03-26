import { setSize, changePosition, changeParamsValue } from '../../utils/edit';
import { findEndStr } from '../../utils/common';
import { updatePositionSize } from '../../utils/view';
import { isEmpty } from '../../utils';
import { cartesian3FromDegrees, headingPitchRoll, headingPitchRollQuaternion, cartographicFromCartesian, CESIUM_MATH } from '../../utils/cesiumUtils'

class EditModel {
    constructor(viewer, sensorurl) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.sensorurl = sensorurl;
    };

    startEdit = () => {
        var pointSelected = null;
        var handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
        var hpRollList = [];
        var _self = this;
        handler.setInputAction(function (movement) {
            pointSelected = _self.scene.pick(movement.position); //选取当前的entity
            if (pointSelected == undefined) {
                pointSelected = null;
            } else {
                if (pointSelected.id) {
                    let name = pointSelected.id.name;
                    let modelType = name && name.split('_') && name.split('_')[0];
                    //当选择的是非设备模型时，进行编辑，pointSelected==null时不执行编辑
                    if (modelType == 'device') {
                        pointSelected = null;
                    } else {
                        var ret2 = hpRollList.find((v) => v.entityName == pointSelected.id.name);
                        if (ret2 == undefined) {
                            let sensorObj = _self.sensorurl.find((item) => item.id == name);
                            let hpRoll0 = headingPitchRoll();
                            if (sensorObj && sensorObj.hpRoll) {
                                hpRoll0 = sensorObj.hpRoll;
                            }
                            var url = pointSelected.id.model && pointSelected.id.model.uri._value;
                            let urlIndex = findEndStr(url, '/', 3);
                            var urlStr = url.slice(urlIndex + 1);
                            hpRollList.push({
                                entityName: pointSelected.id.name,
                                size: pointSelected.primitive._scale,
                                hpRoll: hpRoll0,
                                url: urlStr,
                            });
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        window.focus();
        // let iframeWebglWin = window.parent.window.document.getElementById('iframeWebglEdit')
        //     .contentWindow;
        let iframeLis = window.addEventListener('keydown', (e) => {
            if (pointSelected !== null) {
                var position = pointSelected.id.position;
                var longitude = 0,
                    latitude = 0,
                    height = 0;
                if (position) {
                    let coordinate = Cesium.Cartographic.fromCartesian(position._value);
                    longitude = CESIUM_MATH.toDegrees(coordinate.longitude);
                    latitude = CESIUM_MATH.toDegrees(coordinate.latitude);
                    height = coordinate.height;
                }
                var hpRollRes = hpRollList.find((v) => v.entityName == pointSelected.id.name);
                if (!isEmpty(hpRollRes)) {
                    hpRollRes.position = { latitude, longitude, height };
                } else {
                    hpRollRes = {};
                }
                let res = changeParamsValue(e, hpRollRes);
                let resValue = res.paramsObj;
                let changeType = res.changeType;
                switch (changeType) {
                    case 'postion':
                        if (position) {
                            let resValuePos = resValue.position;
                            var newPosition = cartesian3FromDegrees(
                                resValuePos.longitude,
                                resValuePos.latitude,
                                resValuePos.height
                            );
                            changePosition(newPosition, pointSelected.id);
                        }
                        break;
                    case 'size':
                        setSize(resValue.size, pointSelected.id);
                        break;
                    case 'orientation':
                        if (position) {
                            hpRollList.map((item) => {
                                if (item.entityName == pointSelected.id.name) {
                                    item.hpRoll = resValue.hpRoll;
                                }
                            });
                            pointSelected.id.orientation = headingPitchRollQuaternion(
                                position._value,
                                resValue.hpRoll
                            );
                        }
                        break;
                    default:
                        break;
                }
            }
        });
        // return iframeLis;
        return hpRollList;
    };

    stopEdit = (iframeLis) => {
        // let iframeWebglWin = window.parent.window.document.getElementById('iframeWebgl').contentWindow;
        window.removeEventListener('keydown', iframeLis);
    };

    //保存编辑
    saveEdit = (modelList, sensorList) => {
        var modelPositionList = [];
        if (modelList.length > 0) {
            modelList.map((item, index) => {
                var sensorObj = sensorList.find((v) => v.id == item.entityName);
                var position = {};
                if (item.position) {
                    position = {
                        alt: item.position.height,
                        lat: item.position.latitude,
                        lon: item.position.longitude,
                    };
                } else if (sensorObj) {
                    position = sensorObj.position ? sensorObj.position : { alt: 0, lat: 0, lon: 0 };
                }
                var hpRoll = item.hpRoll ? item.hpRoll : sensorObj.position;
                var posObj = {
                    alt: position.alt,
                    lat: position.lat,
                    lon: position.lon,
                    heading: hpRoll.heading,
                    pitch: hpRoll.pitch,
                    roll: hpRoll.roll,
                };
                modelPositionList[index] = {
                    id: item.entityName,
                    url: item.url,
                    position: posObj,
                    size: item.size ? item.size : sensorObj.size,
                    // labelOrientation: item.labelOrientation ? item.labelOrientation : 'front',
                };
            });
        }
        return modelPositionList;
    }

    //重置传感器位置==》重置最后一个移动的传感器模型
    clearSensorModels = (modelList, sensorList, pos) => {
        let sensorReset = {}, sIndex = 0;
        if (!isEmpty(modelList)) {
            let deletedModel = modelList.pop();
            if (sensorList.length > 0) {
                sensorReset = sensorList.find((v) => v.id == deletedModel.entityName);
                sensorList.map((v, i) => {
                    if (v.id == deletedModel.entityName) {
                        sensorReset = v;
                        sIndex = i;
                    }
                });
            }
            let entityArr = this.viewer.entities._entities._array;
            if (entityArr) {
                entityArr.map(item => {
                    if (item.name == deletedModel.entityName) {
                        updatePositionSize(sensorReset, item, pos, sIndex);
                    }
                });
            }
        }
        return modelList;
    }
}
export default EditModel;