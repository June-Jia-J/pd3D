import { deepMerge, isEmpty, deepClone, getToolbarId } from '../utils';
import { initView, loadModels, loadDeviceModels, updateModelStatus, updateDeviceModelStatus } from '../utils/container';
import { changeModelColor, flyToPosition5, getSensorPosAlt, handlerSensorSelectedStatus, handlerSensorStatus, setCameraPosition } from '../utils/view';
import { getModelColor } from '../utils/enum';
import Toolbar from '../modules/toolbar';
import Popup from '../modules/popup';
import UpdateDataStatus from '../modules/updateDataStatus';
import Spinner from '../modules/spinner';
import CameraManager from '../modules/camera';
import MaterialManager from '../modules/material';
import LightManager from '../modules/light';
import { DEFULT_VALUE, INIT_LOAD, ENHANCEMENT_DEFAULTS, CAMERA_CONFIG, LIGHT_CONFIG } from '../constants';
import '../style.css';

//工具栏默认设置
let toolbarDef = {
    initpos: {//回到初始位置,默认显示
        display: true,
    },
    rotate: {
        display: true, //旋转按钮,默认显示
        direction: 'right', //旋转方向,默认右转
    },
    popup: {
        display: true, //气泡按钮
        default: false, //是否加载气泡， 默认不加载
        style: 'top:5px;left:0',
    },
    upload: {//上传模型按钮,默认不显示
        display: true,
    },
    edit: {//编辑按钮,默认不显示
        display: true,
    },
}

class View3dController {
    constructor(elementId, data) {
        this.elementId = elementId;
        this.data = data;
        this.tbValue = deepMerge(toolbarDef, data.toolBar);
        this.toolBar = {};
        this.popUp = {};
        this.dataStatusUpdate = {};
        this.viewer = {};
        this.oldColorList = [];
        this.pageType = 'view3d_monitor'
        
        this.enhancementConfig = deepMerge(ENHANCEMENT_DEFAULTS, data.enhancement || {});
        this.cameraManager = null;
        this.materialManager = null;
        this.lightManager = null;
    }

    init(viewer0) {
        let spinner = null, containerEl;
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
            //清空模型自转 
            this.viewer.clock.shouldAnimate = false;
            if (!isEmpty(this.viewer.clock.onTick._listeners) && this.viewer.clock.onTick._listeners.length > 2) {
                this.viewer.clock.onTick._listeners.pop();
                this.viewer.clock.onTick._scopes.pop();
            }
            let entityArr = this.viewer.entities._entities._array;
            if (entityArr) {
                entityArr.map(item => {
                    item.entityCollection.removeAll();
                });
            }
            if (viewer0.toolBar) {
                this.destroyEL(containerEl);
            }
            this.viewer.scene.primitives.removeAll();
            //父元素this.elementId没有"cesium-viewer"节点时，添加。（解决React中虚拟节点切换时会删除父节点里的节点）
            var viewerEl = document.getElementsByClassName("cesium-viewer");
            if (containerEl && viewerEl && viewerEl.length == 0) {
                containerEl.appendChild(this.viewer._element);
            }
        }

        let viewer = this.viewer;
        viewer.trackedEntity = undefined;
        //捕获异常
        // let glContext = viewer.scene.context && viewer.scene.context._gl;
        let sencePositionDevice = DEFULT_VALUE.SENCE_POSITION_DEVICE;
        let scene = this.viewer.scene;
        let scenePosition = sencePositionDevice[0].position;
        let popupValue = this.tbValue.popup;
        let deviceEntityArr = [],
            deviceList = [],
            sensorEntityArr = [],
            sensorList = [],
            realDataFlag = popupValue.default; //标记popup是否显示，true表示显示；
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
                deviceEntityArr = loadDeviceModels(deviceList, pos, viewer, 'device', params, dataRes.labelInfoList);
                // deviceEntityArr = loadModels(deviceList, pos, viewer, 'device', params);
                spinner = new Spinner(containerEl);
            }

            // 加载传感器模型
            if (!isEmpty(dataRes.sensorList)) {
                sensorList = dataRes.sensorList;
                //设备模型为空时，更新场景位置为传感器的默认场景位置；
                //设备模型不为空时，场景的初始位置为设备模型的初始位置；
                let posSensor = deepClone(pos);
                posSensor.alt = getSensorPosAlt(deviceType);
                if (isEmpty(dataRes.deviceUrl)) {
                    scenePosition = DEFULT_VALUE.SENCE_POSITION_SENSOR;
                }
                sensorEntityArr = loadModels(sensorList, posSensor, viewer, 'sensor', params);
                if (sensorEntityArr.length > 0) {
                    sensorList.map((item) => {
                        updateModelStatus(sensorEntityArr, item.id, item.status);
                        if (deviceEntityArr.length > 0) {
                            updateDeviceModelStatus(deviceEntityArr, item.deviceIds, item.status);
                        }
                        // if (!isEmpty(item.testpointList)) {
                        //     item.testpointList.map((tpl) => {
                        //         updateModelStatus(sensorEntityArr, tpl.testpointId, tpl.status);
                        //     });
                        // }
                    });
                }
            }
            let posCamera = deepClone(pos);
            posCamera.heading = 5; posCamera.pitch = -20; posCamera.range = 2000.0;
            setCameraPosition(posCamera, viewer);
            if (scenePosition) {
                flyToPosition5(scenePosition, 1, scene);
            }
            if (!isEmpty(spinner)) {
                spinner.remove();
                spinner = null;
            }
            //工具栏实例化
            if (isEmpty(this.toolBar)) {
                this.toolBarCtrl(viewer, containerEl);
            }
            if (window.switchLocalTest) {
                viewer.scene.debugShowFramesPerSecond = true;
            }
            viewer.resolutionScale = params.resolutionScale ? params.resolutionScale : INIT_LOAD.resolutionScale;//默认值为1.0;
            //气泡实例化
            this.popupCtrl(viewer, sensorEntityArr, sensorList, containerEl);
            //气泡实时数据点击事件
            realDataFlag = this.realDataClick(realDataFlag);
            //传感器状态监听
            if (sensorEntityArr.length > 0) {
                let ssListenerRes = this.sensorStatusListener(sensorEntityArr, this.oldColorList, params.statusColor);
                this.oldColorList = ssListenerRes.oldColorList;
                let ssListener = ssListenerRes.sensorStatusListener;
                //更新数据状态
                this.dataStatusUpdate = new UpdateDataStatus(viewer, sensorEntityArr, deviceEntityArr, params.statusColor, ssListener, this.oldColorList, sensorList);
            }
            //按钮监听事件
            this.initposListener(containerEl, scenePosition, scene);
            //鼠标监听事件
            let _self = this;
            this.mouseEventHandler(viewer, sensorEntityArr, realDataFlag, _self);
            //监听屏幕视角位置更新
            viewer.scene.postRender.addEventListener(function () {
                _self.popUp.updatePopUpPosition();
            });
            
            this._initEnhancementModules(viewer, scenePosition, deviceEntityArr, sensorEntityArr, params);
        }
        return this;
    }

    _initEnhancementModules(viewer, scenePosition, deviceEntityArr, sensorEntityArr, params) {
        if (this.enhancementConfig.camera.enableBookmarks || this.enhancementConfig.camera.enableOrbit) {
            this.cameraManager = new CameraManager(viewer, {
                cameraConfig: CAMERA_CONFIG,
            });
            
            if (scenePosition) {
                this.cameraManager.setDefaultPosition(scenePosition);
            }
            
            if (this.enhancementConfig.camera.enableBookmarks && this.data.viewPresets) {
                this.cameraManager.setScenePresets(this.data.viewPresets);
            }
        }
        
        if (this.enhancementConfig.material.enablePBR || this.enhancementConfig.material.enablePhaseHighlight) {
            this.materialManager = new MaterialManager(viewer, {
                stateColors: params.statusColor ? {
                    WARNING: params.statusColor.WARNING,
                    ALARM: params.statusColor.ALARM,
                } : undefined,
            });
        }
        
        if (this.enhancementConfig.light.enableDirectional || this.enhancementConfig.light.enableAmbient) {
            this.lightManager = new LightManager(viewer, {
                lightConfig: deepMerge(LIGHT_CONFIG, this.data.lightConfig || {}),
            });
            
            if (this.data.lightPreset) {
                this.lightManager.applyPreset(this.data.lightPreset);
            }
        }
    }

    getCameraManager() {
        return this.cameraManager;
    }

    getMaterialManager() {
        return this.materialManager;
    }

    getLightManager() {
        return this.lightManager;
    }

    flyToView(options) {
        if (this.cameraManager) {
            return this.cameraManager.flyTo(options);
        }
        return this;
    }

    flyToBookmark(name) {
        if (this.cameraManager) {
            return this.cameraManager.flyToBookmark(name);
        }
        return this;
    }

    saveViewBookmark(name, options) {
        if (this.cameraManager) {
            return this.cameraManager.saveBookmark(name, options);
        }
        return null;
    }

    setModelState(model, state, options) {
        if (this.materialManager) {
            return this.materialManager.setModelState(model, state, options);
        }
        return this;
    }

    setPhaseHighlight(model, phase, options) {
        if (this.materialManager) {
            return this.materialManager.setPhaseHighlight(model, phase, options);
        }
        return this;
    }

    setLightPreset(presetName) {
        if (this.lightManager) {
            return this.lightManager.applyPreset(presetName);
        }
        return this;
    }

    toggleShadows() {
        if (this.lightManager) {
            return this.lightManager.toggleShadows();
        }
        return this;
    }

    //传感器状态监听
    sensorStatusListener(sensorEntityArr, oldColorList, statusColor) {
        sensorEntityArr.map(v => {
            oldColorList.push({
                id: v.name,
                model: v.model,
                value: v.model.color ? v.model.color._value : {},
            });
        });
        // 自定义事件
        var sensorStatusListener = new CustomEvent('sensorStatusEvent', {
            "bubbles": true,//是否冒泡    回调函数中调用，e.stopPropagation();可以阻止冒泡
            "cancelable": false,//是否可以取消  为true时，event.preventDefault();才可以阻止默认动作行为
        });
        // 绑定监听事件
        document.addEventListener('sensorStatusEvent', (e) => {
            let latestData = e.latestData;
            if (oldColorList.length > 0) {
                oldColorList.map(ocl => {
                    let itemLA = latestData ? latestData.find(la => la.aduId == ocl.id) : {};
                    if (itemLA) {
                        let statusColor001 = getModelColor(statusColor);
                        let color = changeModelColor({}, itemLA.status, {}, statusColor001);
                        ocl.value = color;
                    }
                });
            }
        });
        return { oldColorList, sensorStatusListener };
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
    //工具栏实例化
    toolBarCtrl(viewer, containerEl) {
        //工具栏实例化
        this.toolBar = new Toolbar(viewer, this.tbValue, this.pageType);
        let toolBarObj = this.toolBar.createToolBar();
        if (containerEl) {
            containerEl.appendChild(toolBarObj);
        }
    }
    //气泡实例化
    popupCtrl(viewer, sensorEntityArr, sensorList, containerEl) {
        //气泡实时数据实例化
        let popupValue = this.tbValue.popup;
        this.popUp = new Popup(viewer, sensorEntityArr, sensorList, popupValue);
        let popUpObj = this.popUp.createPopup();
        if (containerEl) {
            containerEl.parentNode.appendChild(popUpObj);
        }
        this.popUp.init();
    }
    //气泡实时数据点击事件
    realDataClick(realDataFlag) {
        //气泡实时数据点击事件
        let realDataObj = document.getElementById(getToolbarId('realData', this.pageType));
        if (realDataObj) {
            realDataObj.addEventListener("click", () => {
                realDataFlag = !realDataFlag;
                var trackPopUpEl = document.getElementById('bubble2');
                if (trackPopUpEl && trackPopUpEl.children) {
                    var tpuElArr = trackPopUpEl.children;
                    if (tpuElArr.length > 0) {
                        var dFlag = false;
                        for (var k = 0; k < tpuElArr.length; k++) {
                            var childrenEl = tpuElArr[k];
                            if (childrenEl.style.display == 'block') {
                                dFlag = true;
                            }
                        }
                        for (var i = 0; i < tpuElArr.length; i++) {
                            var childrenEl = tpuElArr[i];
                            if (dFlag) {
                                childrenEl.style.display = 'none';
                            } else {
                                childrenEl.style.display = 'block';
                            }
                        }
                    }
                }
            }, false);
        }
        return realDataFlag;
    }
    //鼠标监听事件
    mouseEventHandler(viewer, sensorEntityArr, realDataFlag, _self) {
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        //左键点击事件：弹出详细信息弹出框
        handler.setInputAction(function (movement) {
            var obj = viewer.scene.pick(movement.position);
            if (Cesium.defined(obj) && obj.id) {
                var modelId = obj.id.name;
                if (modelId && modelId.split('_')[0] == 'device') {
                    viewer.selectedEntity = undefined;
                } else {
                    for (var i = 0; i < sensorEntityArr.length; i++) {
                        if (Cesium.defined(obj) && obj.id === sensorEntityArr[i]) {
                            var modelId = obj.id.name;
                            //触发父页面的点击事件
                            window.postMessage({ modelId: modelId }, '*');
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //右键点击事件：取消传感器选中效果
        handler.setInputAction(function (movement) {
            var obj = viewer.scene.pick(movement.position);
            if (!Cesium.defined(obj)) {
                handlerSensorSelectedStatus({}, sensorEntityArr);
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        // 鼠标移上事件：显示传感器id
        let selectedObj = {},
            trackPopUpContentEl = null;
        //更新模型颜色在鼠标移上的时候，并在移出是仍然显示原始模型颜色；
        let oldColor = { flag: false, value: {} };
        handler.setInputAction(function (movement) {
            var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            if (cartesian) {
                var obj = viewer.scene.pick(movement.endPosition);
                if (Cesium.defined(obj) && sensorEntityArr) {
                    var selectedFlag = false;
                    var sensorObj = sensorEntityArr.find((item) => obj.id.id === item.id);
                    //--加载气泡--
                    var modelId = obj.id.name;
                    if (realDataFlag && trackPopUpContentEl == null) {
                        trackPopUpContentEl = document.querySelector(
                            `div[type="trackPopUpContent${modelId}"]`
                        );
                    }
                    //--加载气泡--
                    if (sensorObj) {
                        selectedFlag = true;
                        selectedObj = sensorObj;
                        if (!oldColor.flag) {
                            //保存模型的原始颜色
                            oldColor = {
                                flag: true,
                                value: selectedObj.model.color ? selectedObj.model.color._value : {},
                            }
                        }
                        handlerSensorStatus(selectedObj, _self.oldColorList);
                        //--加载气泡--
                        if (realDataFlag && trackPopUpContentEl && trackPopUpContentEl.parentNode) {
                            trackPopUpContentEl.parentNode.style.display = 'block';
                        }
                        //--加载气泡--
                    }
                    if (!selectedFlag) {
                        handlerSensorStatus({}, _self.oldColorList);
                        if (selectedObj.model !== undefined) {
                            //--加载气泡--
                            if (
                                !realDataFlag &&
                                trackPopUpContentEl &&
                                trackPopUpContentEl.parentNode
                            ) {
                                trackPopUpContentEl.parentNode.style.display = 'none';
                                trackPopUpContentEl = null;
                            }
                            //--加载气泡--
                        }
                        selectedObj = {};
                        oldColor = { flag: false, value: {} };
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    destroyEL(containerEl) {
        if (containerEl) {
            var elToolbar = containerEl.querySelector('#toolbar-content');
            if (elToolbar) {
                elToolbar.outerHTML = "";
            }
        }
        var elBubble2 = document.getElementById("bubble2");
        if (elBubble2) {
            elBubble2.outerHTML = "";
        }
        this.toolBar = {};
        this.popUp = {};
        this.dataStatusUpdate = {};
        
        if (this.cameraManager) {
            this.cameraManager.destroy();
            this.cameraManager = null;
        }
        if (this.materialManager) {
            this.materialManager.destroy();
            this.materialManager = null;
        }
        if (this.lightManager) {
            this.lightManager.destroy();
            this.lightManager = null;
        }
    }
}
export default View3dController;
