import { deepMerge, isEmpty, deepClone, getToolbarId } from '../utils';
import { initView, loadDeviceModels } from '../utils/container';
import { flyToPosition5, setCameraPosition } from '../utils/view';
import { handlerIsContinuousClick, getPhaseByName } from '../utils/detect';
import Toolbar from '../modules/toolbar';
import Spinner from '../modules/spinner';
import CameraManager from '../modules/camera';
import MaterialManager from '../modules/material';
import LightManager from '../modules/light';
import { DEFULT_VALUE, INIT_LOAD, ENHANCEMENT_DEFAULTS, CAMERA_CONFIG, LIGHT_CONFIG } from '../constants';
import '../style.css';
import UpdateEntity from '../modules/updateEntity';

//工具栏默认设置
let toolbarDef = {
    initpos: {//回到初始位置,默认显示
        display: true,
    },
    rotate: {
        display: true, //旋转按钮,默认显示
        direction: 'right', //旋转方向,默认右转
    }
}

class DetectView3dController {
    constructor(elementId, data) {
        this.elementId = elementId;
        this.data = data;
        this.tbValue = deepMerge(toolbarDef, data.toolBar);
        this.toolBar = {};
        this.viewer = {};
        this.phaseArr = [];
        this.isContinuousClick = false
        this.updateEntity = {}
        this.handler = {}
        this.pageType = 'view3d_detect'
        
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

            this.destroyEL(containerEl, viewer0);
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
        let deviceEntityArr = [],
            deviceList = [];
        if (!isEmpty(this.data) && !isEmpty(this.data.dataRes)) {
            let dataRes = this.data.dataRes;
            let params = this.data.params;
            var deviceType = params.deviceType;
            this.isContinuousClick = params.isContinuousClick ? params.isContinuousClick : this.isContinuousClick
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
                spinner = new Spinner(containerEl);
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
            viewer.resolutionScale = params.resolutionScale ? params.resolutionScale : INIT_LOAD.resolutionScale;//默认值为1.0
            //按钮监听事件
            this.initposListener(containerEl, scenePosition, scene);
            //鼠标监听事件
            let _self = this;
            this.mouseEventHandler(viewer, deviceEntityArr, _self);
            this.handleUpdateIsContinuousClick = this.updateIsContinuousClick
            //更新数据状态
            this.updateEntity = new UpdateEntity(viewer, deviceEntityArr)
            
            this._initEnhancementModules(viewer, scenePosition, deviceEntityArr, params);
        }
        return this;
    }

    _initEnhancementModules(viewer, scenePosition, deviceEntityArr, params) {
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

    updateIsContinuousClick(checked) {
        this.isContinuousClick = checked;
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

    //鼠标监听事件
    mouseEventHandler(viewer, entityArr, _self) {
        _self.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        //右键点击事件：取消传感器选中效果
        _self.handler.setInputAction(function (movement) {
            var obj = viewer.scene.pick(movement.position);
            if (!Cesium.defined(obj)) {
                _self.phaseArr = []
                _self.updateEntity.updateEntityByPhase([], true)
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        //左键点击事件：弹出详细信息弹出框
        _self.handler.setInputAction(function (movement) {
            var obj = viewer.scene.pick(movement.position);
            if (Cesium.defined(obj) && obj.id) {
                var modelId = obj.id;
                if (modelId && modelId.split('_')[0] !== 'device') {
                    viewer.selectedEntity = undefined;
                } else {
                    // console.log('isContinuousClick::' + _self.isContinuousClick)
                    let isSelectedEntitry = obj.id
                    //根据被选择实体的名称获取对应的相别
                    let selectedPhase = getPhaseByName(isSelectedEntitry)
                    //根据是否连续点击，返回当前被选择的相别集合
                    let phaseArrRes = handlerIsContinuousClick(selectedPhase, _self.isContinuousClick, _self.phaseArr)
                    _self.phaseArr = phaseArrRes;
                    _self.updateEntity.updateEntityByPhase(phaseArrRes, true)
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    destroyEL(containerEl, viewer) {
        if (containerEl) {
            var elToolbar = containerEl.querySelector('#toolbar-content');
            if (elToolbar) {
                elToolbar.outerHTML = "";
            }
        }
        this.toolBar = {};
        this.phaseArr = [];
        this.isContinuousClick = false
        this.updateEntity = {};
        if (!isEmpty(viewer.handler)) {//移除事件
            viewer.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
            viewer.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
            viewer.handler = {}
        }
        
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
export default DetectView3dController;
