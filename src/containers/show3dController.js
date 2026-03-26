import { deepMerge, isEmpty, deepClone, getToolbarId } from '../utils';
import { initView, loadEntity } from '../utils/container';
import { flyToPosition5, getCurSceneLon, setCameraPosition } from '../utils/view';
import { IDENTITY } from '../utils/cesiumUtils'
import Toolbar from '../modules/toolbar';
import Spinner from '../modules/spinner';
import { DEFULT_VALUE, INIT_LOAD } from '../constants';
import '../style.css';

//工具栏默认设置
let toolbarDef = {
    initpos: {//回到初始位置,默认显示
        display: true,
    },
    rotate: {
        display: true, //旋转按钮,默认显示
        direction: 'left', //旋转方向,默认右转
    },
    saveScene: {
        display: true, //旋转按钮,默认显示
    },
}

class Show3dController {
    constructor(elementId, data) {
        this.elementId = elementId;
        this.data = data;
        this.tbValue = deepMerge(toolbarDef, data.toolBar);
        this.toolBar = {};
        this.viewer = {};
        this.scenePosition = {};
        this.pageType = 'show3d'
    }

    init(viewer0) {
        let spinner = null, containerEl;
        if (window.switchLocalTest) {
            /**本地测试 */
            containerEl = document.getElementById(this.elementId);
            params.resourceProUrl = '';
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
            //父元素this.elementId没有"cesium-viewer"节点时，添加。（解决React中虚拟节点切换时会删除父节点里的节点）
            var viewerEl = document.getElementsByClassName("cesium-viewer");
            if (containerEl && viewerEl && viewerEl.length == 0) {
                containerEl.appendChild(this.viewer._element);
            }
        }

        let viewer = this.viewer;
        viewer.trackedEntity = undefined;

        let scene = this.viewer.scene;
        let entityArr = [],
            urlList = [];
        if (!isEmpty(this.data) && !isEmpty(this.data.dataRes)) {
            let dataRes = this.data.dataRes;
            let params = this.data.params;
            if (dataRes.desOri) {
                this.scenePosition = JSON.parse(dataRes.desOri);
            }
            console.log('111 dataRes',dataRes)
            console.log('111 params',params)
            //加载设备模型
            if (!isEmpty(dataRes.url)) {
                entityArr = loadEntity(dataRes, viewer, params.resourceProUrl);
                spinner = new Spinner(containerEl);
            }

            let posCamera = deepClone(DEFULT_VALUE.POSTION);
            if (params.category == 2) {
                posCamera.alt = 0;
                posCamera.heading = 5; posCamera.pitch = -10; posCamera.range = 60.0;
            } else {
                posCamera.alt = 150;
                posCamera.heading = 5; posCamera.pitch = -30; posCamera.range = 800.0;
            }
            setCameraPosition(posCamera, viewer);

            setTimeout(() => {
                if (!isEmpty(spinner)) {
                    spinner.remove();
                    spinner = null;
                }
                console.log('113 spinner',spinner)
                console.log('113 scene',scene)
                scene.camera.lookAtTransform(IDENTITY);
                this.scenePosition = getCurSceneLon(scene);
                setCameraPosition(posCamera, viewer);
            }, 1000);

            //工具栏实例化
            if (isEmpty(this.toolBar)) {
                this.toolBarCtrl(viewer, containerEl);
            }
            if (window.switchLocalTest) {
                viewer.scene.debugShowFramesPerSecond = true;
            }
            viewer.resolutionScale = params.resolutionScale ? params.resolutionScale : INIT_LOAD.resolutionScale;//默认值为1.0;
            this.initposListener(scene);
            this.saveScenePosObjListener(viewer, scene, dataRes, entityArr, posCamera);
        }
        return this;
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

    //回到初始化位置监听
    initposListener(scene) {
        let initpos3dObj = document.getElementById(getToolbarId('initpos3D', this.pageType));
        if (initpos3dObj) {
            initpos3dObj.addEventListener("click", () => {
                if (!isEmpty(this.scenePosition)) {
                    flyToPosition5(this.scenePosition, 0, scene);
                }
            }, false);
        }
    }

    //保存当前场景
    saveScenePosObjListener(viewer, scene, dataRes, entityArr, pos) {
        let saveScenePosObj = document.getElementById(getToolbarId('saveScenePosition', this.pageType));
        if (saveScenePosObj) {
            saveScenePosObj.addEventListener("click", () => {
                scene.camera.lookAtTransform(IDENTITY);
                // viewer.trackedEntity = undefined;
                var sPos = getCurSceneLon(scene);
                var res = {
                    id: dataRes.id,
                    desOri: sPos,
                };
                window.parent.postMessage({ scenePosition: res }, '*');

                setCameraPosition(pos, viewer);
                // if (entityArr.length > 0) {
                //     viewer.trackedEntity = entityArr[0];
                // }
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
        this.toolBar = {};
        this.scenePosition = {};
    }
}
export default Show3dController;
