import * as Cesium from 'cesium/Cesium'
window.Cesium = Cesium
console.log(Cesium)
import View3dController from './containers/view3dController';
import Edit3dController from './containers/edit3dController';
import Show3dController from './containers/show3dController';
import DetectView3dController from './containers/detectView3dController';

// 可视化与交互增强模块
import CameraSystem from './modules/cameraSystem';
import MaterialSystem from './modules/materialSystem';
import LightingSystem from './modules/lightingSystem';
import VisualizationPanel from './modules/visualizationPanel';

/* 加载一次设备模型（+传感器模型），完成模型可视化展示
*   elementId：加载的dom元素
*   opts：配置参数
*   viewer0:该接口的返回值，（初次加载为空，为了解决反复加载模型，浏览器内存持续增长的问题）
*   application：支持的应用，'monitor'/'detect'  默认'monitor',分别对应-->在线监测View3dController和带电检测DetectView3dController
*/
let view3d = (elementId, opts, viewer0, application = 'monitor') => {
    let view;
    if (application == 'monitor') {
        let view3dController = new View3dController(elementId, opts);
        view = view3dController.init(viewer0);
    } else if (application == 'detect') {
        let detectView3dController = new DetectView3dController(elementId, opts);
        view = detectView3dController.init(viewer0);
    }

    return view;
}

//刷新设备和传感器模型状态
let refreshStatus = (dataStatusUpdate, sensorList, data, deviceType) => {
    if (dataStatusUpdate && dataStatusUpdate.refrashDeviceStatus) {
        dataStatusUpdate.refrashDeviceStatus(sensorList, data, deviceType);
    }
}

//刷新传感器模型状态，根据adu.status
let refreshSensorStatusByAdu = (dataStatusUpdate, data, sensorList, deviceIds, status) => {
    if (dataStatusUpdate && dataStatusUpdate.updateSensorStatusByAdu) {
        dataStatusUpdate.updateSensorStatusByAdu(data, sensorList, deviceIds, status);
    }
}

//刷新设备和传感器模型状态
let refreshLatestData = (dataStatusUpdate, data) => {
    if (dataStatusUpdate && dataStatusUpdate.refrashSensorLatestData) {
        dataStatusUpdate.refrashSensorLatestData(data);
    }
}

//修改toolBar的位置
let updateToolBarStyle = (tbStyle, elementId) => {
    let toolBarObj, containerEl;
    if (elementId) {
        if (window.switchLocalTest) {
            /**本地测试 */
            containerEl = document.getElementById(elementId);
        } else {
            containerEl = elementId;
        }
        toolBarObj = containerEl.querySelector('#toolbar-content');
    } else {
        toolBarObj = document.getElementById('toolbar-content');
    }
    if (toolBarObj && tbStyle) {
        toolBarObj.style.cssText = tbStyle;
    }
}

// let updateToolBarStyle = (styleObj) => {
//     if(styleObj){
//         if(styleObj.toolbar){
//            let toolBarObj = document.getElementById('toolbar-content');
//            if (toolBarObj) {
//                toolBarObj.style.cssText = styleObj.toolbar;
//            }
//         }
//         if(styleObj.initpos){
//             let initpos3DObj = document.getElementById('imgId');
//             if (initpos3DObj) {
//                initpos3DObj.style.cssText = styleObj.initpos;
//             }
//         }
//     } 
// }

let edit3d = (elementId, data, viewer0) => {
    let edit3dController = new Edit3dController(elementId, data);
    let edit = edit3dController.init(viewer0);
    return edit;
}

let show3d = (elementId, opts, viewer0) => {
    let show3dController = new Show3dController(elementId, opts);
    let show = show3dController.init(viewer0);
    return show;
}

//更新isContinuousClick的值
let updateIsContinuousClick = (viewer0, checked) => {
    if (viewer0) {
        viewer0.isContinuousClick = checked
    }
}
//根据相别更新模型的选中状态
let updateEntityByPhase = (detectViewer0, phaseArr, flag) => {
    if (detectViewer0.updateEntity && detectViewer0.updateEntity.updateEntityByPhase) {
        detectViewer0.phaseArr = phaseArr
        detectViewer0.updateEntity.updateEntityByPhase(phaseArr, flag)
    }
}

/**
 * 创建相机系统
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Object} options - 配置选项
 * @returns {CameraSystem} 相机系统实例
 */
let createCameraSystem = (viewer, options = {}) => {
    return new CameraSystem(viewer, options);
};

/**
 * 创建材质系统
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Object} options - 配置选项
 * @returns {MaterialSystem} 材质系统实例
 */
let createMaterialSystem = (viewer, options = {}) => {
    return new MaterialSystem(viewer, options);
};

/**
 * 创建光影系统
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Object} options - 配置选项
 * @returns {LightingSystem} 光影系统实例
 */
let createLightingSystem = (viewer, options = {}) => {
    return new LightingSystem(viewer, options);
};

/**
 * 创建可视化控制面板
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Object} options - 配置选项
 * @returns {VisualizationPanel} 可视化面板实例
 */
let createVisualizationPanel = (viewer, options = {}) => {
    return new VisualizationPanel(viewer, options);
};

export {
    view3d,
    refreshStatus,
    refreshSensorStatusByAdu,
    refreshLatestData,
    updateToolBarStyle,
    edit3d,
    show3d,
    updateIsContinuousClick,
    updateEntityByPhase,
    // 可视化与交互增强模块
    createCameraSystem,
    createMaterialSystem,
    createLightingSystem,
    createVisualizationPanel,
    // 类导出（供高级用户使用）
    CameraSystem,
    MaterialSystem,
    LightingSystem,
    VisualizationPanel,
};
