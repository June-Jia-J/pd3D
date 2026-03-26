import { flyToPosition5 } from '../../utils/view';
import { isEmpty, deepClone, deepMerge, getToolbarId } from '../../utils';
import { CARTESIAN3_UNIT_Z } from '../../utils/cesiumUtils'
//工具栏
// - ToolBar: {
//     1. 回到初始位置：
//     initpos: {
//         display: true, 是否显示该按钮
//     } 
//     2. 模型旋转
//     rotate: {
//         display: true, 是否显示旋转按钮
//         direction:'right', 旋转方向
//     }
//     3. 数据气泡显示与隐藏
//     popup: {
//         display: true, 是否显示气泡显示按钮
//         default: true, 默认显示状态
//     }
//     4. 上传模型按钮
//     upload: {
//         display: true, 是否显示按钮
//         click:clickFunc,点击事件
//      }
//     5. 编辑按钮
//     edit: {
//         display: true, 是否显示按钮
//         click:clickFunc,点击事件
//      }
// }

class ToolBar {
    constructor(viewer, tbValue, pageFlag) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.tbValue = tbValue;
        this.pageFlag = pageFlag
        this.previousTime;
    }

    getRotateObj = (rotateValue) => {
        let rotate = deepClone(rotateValue), stopRotate = {};
        if (!isEmpty(rotateValue) && !isEmpty(rotateValue.attribute)) {
            let attr = rotateValue.attribute;
            rotate.title = attr[0].title;
            stopRotate.title = attr[1].title;
        }
        return { rotate, stopRotate };
    }

    createToolBar = () => {
        var toolBarObj = document.createElement("div");
        toolBarObj.id = 'toolbar-content';
        toolBarObj.className = 'toolbar';
        let rotateObj = this.getRotateObj(this.tbValue.rotate);
        let data = [
            { id: 'initpos3D', key: 'initpos', title: '回到初始位置', value: this.tbValue.initpos },
            { id: 'rotate', key: 'rotate', title: '旋转', value: rotateObj.rotate, click: this.rotateClick },
            { id: 'stopRotate', key: 'rotate', title: '停止旋转', value: { ...rotateObj.stopRotate, display: false }, click: this.rotateClick },
            { id: 'realData', key: 'popup', title: '显示实时数据', value: this.tbValue.popup, },
            { id: 'upload', key: 'upload', title: '上传', value: this.tbValue.upload, click: this.uploadClick },
            { id: 'edit', key: 'edit', title: '编辑', value: this.tbValue.edit, click: this.editClick },
            { id: 'saveScenePosition', key: 'saveScene', value: this.tbValue.saveScene, title: '保存当前场景', },
            { id: 'saveEdit', key: 'savePosition', value: this.tbValue.savePosition, title: '保存传感器位置', },
            { id: 'resetPos', key: 'resetPosition', value: this.tbValue.resetPosition, title: '重置传感器位置', },
            { id: 'operaDes', key: 'operaDes', value: this.tbValue.operaDes, title: '操作说明', click: this.operaDesClick },
        ];
        let dataList = [];
        for (var i in this.tbValue) {
            let dL = data.filter(item => item.key == i);
            dataList.push(...dL);
        }
        dataList.map(item => {
            toolBarObj.appendChild(this.createItem(item));
        });
        return toolBarObj;
    }

    createItem = (item) => {
        let obj = document.createElement("a");
        obj.id = getToolbarId(item.id, this.pageFlag);
        obj.className = ['d3OperaBtn', item.id].join(' ');
        obj.title = item.value && item.value.title ? item.value.title : item.title;
        if (item.click) {
            obj.addEventListener("click", item.click, false);
        }
        if (!isEmpty(item.value)) {
            this.updateToolBarItemDisplay(obj, item.value.display);
        }
        return obj;
    }

    //更新工具栏项目的显隐状态
    updateToolBarItemDisplay = (elObj, flag) => {
        if (elObj) {
            elObj.style.display = flag ? 'block' : 'none';
        }
    }

    //点击事件--旋转/停止旋转
    rotateClick = (e) => {
        let rotateObj = document.getElementById(getToolbarId('rotate', this.pageFlag));
        let stopRotateObj = document.getElementById(getToolbarId('stopRotate', this.pageFlag));
        if (e.target) {
            if (e.target.id == getToolbarId('rotate', this.pageFlag)) {
                rotateObj.style.display = 'none';
                stopRotateObj.style.display = 'block';
                this.viewer.selectedEntity = undefined;
                this.viewer.clock.multiplier = 200; //速度
                this.viewer.clock.shouldAnimate = true;
                this.previousTime = this.viewer.clock.currentTime.secondsOfDay;
                if (!isEmpty(this.viewer.clock.onTick._listeners)) {
                    this.viewer.clock.onTick.removeEventListener(this.onTickCallback);
                }
                this.viewer.clock.onTick.addEventListener(this.onTickCallback);
            } else if (e.target.id == getToolbarId('stopRotate', this.pageFlag)) {
                stopRotateObj.style.display = 'none';
                rotateObj.style.display = 'block';
                this.viewer.clock.shouldAnimate = false;
                this.viewer.clock.onTick.removeEventListener(this.onTickCallback);
            }
        }
    }

    onTickCallback = () => {
        var spinRate = 1;
        var currentTime = this.viewer.clock.currentTime.secondsOfDay;
        var delta = (currentTime - this.previousTime) / 1000;
        this.previousTime = currentTime;
        //根据direction设置左转/右转；默认右转；
        let rotateValue = this.tbValue.rotate;
        if (rotateValue.direction == 'left') {
            //向左旋转
            this.viewer.scene.camera.rotate(CARTESIAN3_UNIT_Z, -spinRate * delta);
        } else {
            //向右旋转
            this.viewer.scene.camera.rotateRight(-spinRate * delta);
        }
    }

    uploadClick = () => {
        let uploadValue = this.tbValue.upload;
        if (uploadValue.click) {
            uploadValue.click('上传页面未实现');
        }
    }
    //点击事件--编辑传感器位置、场景视角位置
    editClick = () => {
        let editValue = this.tbValue.edit;
        if (editValue.click) {
            editValue.click();
        }
    }

    //点击事件--操作说明
    operaDesClick = () => {
        let navigationHelp = document.getElementById(getToolbarId('navigationHelp', this.pageFlag));
        navigationHelp.style.display = navigationHelp.style.display == 'none' ? 'block' : 'none';
    }

    navigationHelp = () => {
        var content = {
            text: '操作说明',
            direction: '方向',
            directionLeftRight: '左移/右移',
            directionFrontAfter: '前移/后移',
            directionHighLow: '升高/降低',
            size: '大小',
            sizeLargeSmall: '变大/变小',
            rotate: '旋转',
            rotateRollLeft: 'roll left',
            rotateLeft: 'turn left',
            rotateRollRight: 'roll right',
            rotateRight: 'turn right',
            rotatePitchUp: 'pitch up',
            rotatePitchDown: 'pitch down',
        }
        if (!isEmpty(this.tbValue.operaDes) && !isEmpty(this.tbValue.operaDes.content)) {
            content = deepMerge(content, this.tbValue.operaDes.content);
        }
        let naviHelpObj = document.createElement("div");
        naviHelpObj.id = getToolbarId('navigationHelp', this.pageFlag);
        naviHelpObj.className = 'cesium-navigation-help cesium-navigation-help-visible';
        naviHelpObj.style.display = 'none';
        naviHelpObj.innerHTML = '<button type="button" class="cesium-navigation-button cesium-navigation-button-left cesium-navigation-button-selected">' + content.text + '</button>' +
            '<div class="cesium-click-navigation-help cesium-navigation-help-instructions cesium-click-navigation-help-visible">' +
            '<table>' +
            '<tbody>' +
            ' <tr>' +
            '<div class="cesium-navigation-help-pan">' + content.direction + '</div>' +
            '<div class="cesium-navigation-help-details">[A/D] ' + content.directionLeftRight + '</div>' +
            '<div class="cesium-navigation-help-details">[X/W] ' + content.directionFrontAfter + '</div>' +
            '<div class="cesium-navigation-help-details">[H/L] ' + content.directionHighLow + '</div>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>' +
            ' <div class="cesium-navigation-help-zoom">' + content.size + '</div>' +
            '<div class="cesium-navigation-help-details">[+/-] ' + content.sizeLargeSmall + '</div>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>' +
            '<div class="cesium-navigation-help-rotate">' + content.rotate + '</div>' +
            '<div class="cesium-navigation-help-details">[← + shift] ' + content.rotateRollLeft + '</div>' +
            '<div class="cesium-navigation-help-details">[←] ' + content.rotateLeft + '</div>' +
            '<div class="cesium-navigation-help-details">[→ + shift] ' + content.rotateRollRight + '</div>' +
            '<div class="cesium-navigation-help-details">[→] ' + content.rotateRight + '</div>' +
            '<div class="cesium-navigation-help-details">[ ↑ ] ' + content.rotatePitchUp + '</div>' +
            '<div class="cesium-navigation-help-details">[ ↓ ] ' + content.rotatePitchDown + '</div>' +
            '</td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            ' </div>';
        return naviHelpObj;
    }

}
export default ToolBar;