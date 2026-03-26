import { deepMerge, isEmpty, deepClone, getToolbarId } from '../utils';
import { initView, loadModels } from '../utils/container';
import { flyToPosition5, getCurSceneLon, getSensorPosAlt, handlerSensorSelectedStatus } from '../utils/view';
import Toolbar from '../modules/toolbar';
import EditModel from '../modules/editModel';
import { DEFULT_VALUE, INIT_LOAD } from '../constants';
import '../style.css';

let toolbarEditDef = {
    initpos: {//回到初始位置,默认显示
        display: true,
    },
    saveScene: {
        display: true, //旋转按钮,默认显示
    },
    savePosition: {
        display: true,
    },
    resetPosition: {//上传模型按钮,默认不显示
        display: true,
    },
    operaDes: {//编辑按钮,默认不显示
        display: true,
    },
}
class Edit3dController {
    constructor(elementId, data) {
        this.elementId = elementId;
        this.data = data;
        this.tbValue = data.toolBar ? deepMerge(toolbarEditDef, data.toolBar) : toolbarEditDef;
        this.toolBar = {};
        this.viewer = {};
        this.pageType = 'edit3d'
    }

    init(viewer0) {
        // let viewer = initView(this.elementId);
        let containerEl;
        if (window.switchLocalTest) {
            /**本地测试 */
            containerEl = document.getElementById(this.elementId);
        } else {
            if (this.elementId) {
                containerEl = this.elementId;
            }
        }
        if (isEmpty(viewer0)) {
            this.viewer = initView(this.elementId);
        } else {
            this.viewer = viewer0.viewer;
            let entityArr = this.viewer.entities._entities._array;
            if (entityArr) {
                entityArr.map(item => {
                    item.entityCollection.removeAll();
                    this.destroyEL(containerEl);
                });
            }

            if (containerEl) {
                var viewerEl = containerEl.querySelector('#cesium-viewer')
                if (isEmpty(viewerEl)) {
                    containerEl.appendChild(this.viewer._element);
                }
            }
        }
        let sencePositionDevice = DEFULT_VALUE.SENCE_POSITION_DEVICE;
        let viewer = this.viewer;
        let scene = viewer.scene;
        let scenePosition = sencePositionDevice[0].position;
        let deviceEntityArr = [],
            deviceList = [],
            sensorEntityArr = [],
            sensorList = [];
        let updateDataStatusEntity = {};
        if (!isEmpty(this.data) && !isEmpty(this.data.dataRes)) {
            let dataRes = this.data.dataRes;
            let params = this.data.params;
            var deviceType = params.deviceType;
            if (dataRes.desOri) {
                scenePosition = JSON.parse(dataRes.desOri);
            } else {
                var devicePosObj = sencePositionDevice.find(item => item.deviceType == Number(deviceType));
                if (devicePosObj) {
                    scenePosition = devicePosObj.position;
                }
            }
            let pos = DEFULT_VALUE.POSTION;
            pos = deepMerge(pos, this.data.position);

            //加载设备模型
            if (!isEmpty(dataRes.deviceUrl)) {
                deviceList = dataRes.deviceUrl.filter((d) => d.url !== '' && d.url !== null);
                deviceEntityArr = loadModels(deviceList, pos, viewer, 'device', params);
            }
            //加载传感器模型
            sensorList = dataRes.sensorList;
            if (sensorList) {
                //设备模型为空时，更新场景位置为传感器的默认场景位置；
                //设备模型不为空时，场景的初始位置为设备模型的初始位置；
                let posSensor = deepClone(pos);
                posSensor.alt = getSensorPosAlt(deviceType);
                if (isEmpty(dataRes.deviceUrl)) {
                    scenePosition = DEFULT_VALUE.SENCE_POSITION_SENSOR;
                }
                sensorEntityArr = loadModels(sensorList, posSensor, viewer, 'sensor', params);
            }
            if (scenePosition) {
                flyToPosition5(scenePosition, 1, scene);
            }

            //工具栏实例化
            this.toolBar = new Toolbar(viewer, this.tbValue, this.pageType);
            let toolBarObj = this.toolBar.createToolBar();
            let naviHelpObj = this.toolBar.navigationHelp();
            if (window.switchLocalTest) {
                /**本地测试 */
                if (document.getElementById(this.elementId)) {
                    document.getElementById(this.elementId).appendChild(toolBarObj);
                    document.getElementById(this.elementId).parentNode.appendChild(naviHelpObj);
                }
            } else {
                if (this.elementId) {
                    this.elementId.appendChild(toolBarObj);
                    this.elementId.parentNode.appendChild(naviHelpObj);
                }
            }
            if (window.switchLocalTest) {
                viewer.scene.debugShowFramesPerSecond = true;
            }
            viewer.resolutionScale = params.resolutionScale ? params.resolutionScale : INIT_LOAD.resolutionScale;//默认值为1.0;
            //编辑功能实例化
            this.editModel = new EditModel(viewer, sensorList);
            let modelList = this.editModel.startEdit();
            //工具栏按钮监听事件
            this.initposListener(containerEl, scenePosition, scene);
            //保存当前场景
            let saveScenePosObj = document.getElementById(getToolbarId('saveScenePosition', this.pageType));
            if (saveScenePosObj) {
                saveScenePosObj.addEventListener("click", () => {
                    var sPos = getCurSceneLon(scene);
                    var res = {
                        id: dataRes.id,
                        desOri: sPos,
                    };
                    console.log('scenePosition:' + res);
                    window.parent.postMessage({ scenePosition: res }, '*');
                }, false);
            }
            //保存传感器位置
            let saveEditObj = document.getElementById(getToolbarId('saveEdit', this.pageType));
            if (saveEditObj) {
                let _self = this;
                saveEditObj.addEventListener("click", () => {
                    let modelPositionList = _self.editModel.saveEdit(modelList, sensorList);
                    console.log('modelPositionList:' + modelPositionList);
                    window.parent.postMessage({ modelPositionList: modelPositionList }, '*');
                }, false);
            }
            //重置传感器位置
            let resetPosObj = document.getElementById(getToolbarId('resetPos', this.pageType));
            if (resetPosObj) {
                let _self = this;
                resetPosObj.addEventListener("click", () => {
                    pos.alt = getSensorPosAlt(deviceType);
                    modelList = _self.editModel.clearSensorModels(modelList, sensorList, pos);
                }, false);
            }

            //鼠标监听事件
            var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            //移除左键双击事件
            viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            //右键点击事件：取消传感器选中效果
            handler.setInputAction(function (movement) {
                var obj = viewer.scene.pick(movement.position);
                if (!Cesium.defined(obj)) {
                    handlerSensorSelectedStatus({}, sensorEntityArr);
                }
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            // 鼠标移上事件：显示传感器id
            let selectedObj = {};
            handler.setInputAction(function (movement) {
                var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
                if (cartesian) {
                    var obj = viewer.scene.pick(movement.endPosition);
                    if (Cesium.defined(obj) && sensorEntityArr) {
                        var selectedFlag = false;
                        var sensorObj = sensorEntityArr.find((item) => obj.id === item);
                        if (sensorObj) {
                            selectedFlag = true;
                            selectedObj = sensorObj;
                            console.log('sensorId:' + selectedObj._name);
                            handlerSensorSelectedStatus(selectedObj, sensorEntityArr);
                        }
                        if (!selectedFlag) {
                            selectedObj = {};
                        }
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        }
        // return updateDataStatusEntity;
        return this;
    }

    //回到初始化位置监听
    initposListener(containerEl, scenePosition, scene) {
        let idEl = '#' + getToolbarId('initpos3D', this.pageType)
        var initpos3dObj = containerEl.querySelector(idEl);
        if (initpos3dObj) {
            initpos3dObj.addEventListener("click", () => {
                if (!isEmpty(scenePosition)) {
                    flyToPosition5(scenePosition, 0, scene);
                }
            }, false);
        }
    }

    destroyEL(containerEl) {
        if (containerEl) {
            var elToolbar = containerEl.querySelector('#toolbar-content');
            if (elToolbar) {
                elToolbar.outerHTML = "";
            }
        }
        var naviHelp = document.getElementById(getToolbarId('navigationHelp', this.pageType));
        if (naviHelp) {
            naviHelp.outerHTML = "";
        }
        this.toolBar = {};
    }
}
export default Edit3dController;
