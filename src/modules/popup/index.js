import { popWin, winContent, positionPopUp, getFirstSensorScreenPosition, updateSensorDataDisplay } from './popupManager';
import { getLabelOri } from '../../utils/common';
import { isEmpty } from '../../utils';
import { cartesian3FromDegrees, wgs84ToWindowCoordinates } from '../../utils/cesiumUtils'

class PopUp {
    constructor(viewer, sensorEntityArr, sensorList, popupValue) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.camera = this.scene.camera;
        this.sensorEntityArr = sensorEntityArr;
        this.sensorList = sensorList;
        this.showDefault = popupValue.default;
        this.style = popupValue.style;
        this.changeOne = getFirstSensorScreenPosition(viewer, sensorList);
        this.displayFlag = 'front';

    }

    createPopup = () => {
        var popupObj = document.createElement("div");
        popupObj.id = 'bubble2';
        return popupObj;
    }

    init() {
        if (!isEmpty(this.sensorEntityArr)) {
            this.sensorEntityArr.map((cartesianData, index) => {
                var id = cartesianData._name;
                popWin(id, this.showDefault, this.style);
                //嵌入气泡中显示的内容
                var el = document.getElementsByClassName('trackPopUpLink')[index];
                if (el !== null) {
                    var content = winContent(id, this.sensorList);
                    if (!isEmpty(content)) {
                        el.appendChild(content);
                    }
                }
            });
        }
    }

    updatePopUpPosition = () => {
        var changedC;
        if (this.sensorList.length > 0) {
            //根据第一个传感器的屏幕位置判断scene是否移动
            var changeNew = getFirstSensorScreenPosition(this.viewer, this.sensorList);
            if (changeNew == undefined || changeNew == null) {
                changeNew = { x: 0, y: 0 };
            }
            if (this.changeOne.x != changeNew.x || this.changeOne.y != changeNew.y) {
                this.changeOne = changeNew;
                for (var k = 0; k < this.sensorList.length; k++) {
                    var cartesianData = this.sensorList[k];
                    var cp = { lon: 0, lat: 0 + k * 0.0001, alt: 0 };
                    if (cartesianData.position) {
                        cp = JSON.parse(cartesianData.position);
                    }
                    var c = cartesian3FromDegrees(cp.lon, cp.lat, cp.alt);
                    changedC = wgs84ToWindowCoordinates(this.viewer.scene, c);
                    if (changedC == undefined || changedC == null) {
                        changedC = { x: 0, y: 0 };
                    }
                    //处理没有position的模型弹出框位置
                    if (cartesianData.position == null || cartesianData.position == undefined) {
                        changedC.x = 550;
                        changedC.y = 180 + k * 70;
                    }
                    if (changedC !== undefined && c !== undefined) {
                        if (c.x !== changedC.x || c.y !== changedC.y) {
                            c = changedC;
                        }
                        var id = cartesianData.id;
                        positionPopUp(c, id);
                        //获取当前场景正面front朝前还是背面after
                        this.displayFlag = getLabelOri(this.camera.heading);
                        // 控制传感器显隐
                        updateSensorDataDisplay(this.displayFlag, this.sensorList);
                    }
                }
            }
        }
    }

}
export default PopUp;