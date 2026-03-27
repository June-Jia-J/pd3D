import { ENHANCEMENT_CONFIG, mergeConfig, HIGHLIGHT_TYPES, SCENE_MODES } from './config';
import CameraEnhancement from './camera';
import MaterialEnhancement from './material';
import LightingEnhancement from './lighting';
import ControlPanel from './ui/ControlPanel';

class Pd3dEnhancements {
    constructor(viewer, userConfig = {}) {
        if (!viewer) {
            throw new Error('Cesium Viewer instance is required');
        }
        
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.config = mergeConfig(ENHANCEMENT_CONFIG, userConfig);
        
        // 初始化各个增强模块
        this._initModules();
        
        // 控制面板（按需创建）
        this._controlPanel = null;
    }

    // 初始化所有模块
    _initModules() {
        // 兼容模式：延迟初始化，避免干扰原有渲染
        // 诊断阶段仅创建空实例，不执行实际修改
        console.log('Enhancements: initializing in compatibility mode');
        
        // 相机增强
        this._camera = new CameraEnhancement(this.viewer, this.config.camera);
        
        // 材质增强
        this._material = new MaterialEnhancement(this.viewer, this.config.material);
        
        // 光照增强
        this._lighting = new LightingEnhancement(this.viewer, this.config.lighting);
    }

    // 获取相机增强模块
    get camera() {
        return this._camera;
    }

    // 获取材质增强模块
    get material() {
        return this._material;
    }

    // 获取光照增强模块
    get lighting() {
        return this._lighting;
    }

    // 获取控制面板（懒加载）
    get controlPanel() {
        if (!this._controlPanel) {
            this._controlPanel = new ControlPanel(this.viewer, {
                camera: this._camera,
                material: this._material,
                lighting: this._lighting,
            }, this.config.ui);
        }
        return this._controlPanel;
    }

    // 显示控制面板
    showControlPanel() {
        this.controlPanel.show();
    }

    // 隐藏控制面板
    hideControlPanel() {
        if (this._controlPanel) {
            this._controlPanel.hide();
        }
    }

    // 快速切换视角预设
    applyViewPreset(sceneType, presetName) {
        const presets = this.config.viewPresets[sceneType];
        if (!presets || !presets[presetName]) {
            console.warn(`View preset "${presetName}" not found for scene "${sceneType}"`);
            return false;
        }
        
        const preset = presets[presetName];
        return this._camera.flyTo(preset.position, 1.5);
    }

    // 快速设置场景模式
    setSceneMode(mode) {
        this._lighting.setSceneMode(mode);
    }

    // 一键应用高性能模式（关闭所有耗性能特性）
    applyPerformanceMode() {
        this._lighting.disableShadows();
        this._lighting.disableIBL();
        this._material.clearAllHighlights();
    }

    // 一键应用高质量模式
    applyQualityMode() {
        this._lighting.enableShadows('enabled', 'high', 0.3);
        this._lighting.enableIBL(0.6);
    }

    // 获取所有模块状态
    getState() {
        return {
            camera: this._camera.getCameraState(),
            lighting: this._lighting.getLightingState(),
            bookmarks: this._camera.getBookmarks(),
            highlights: this._material.getHighlightedObjects(),
        };
    }

    // 重置所有增强
    reset() {
        this._camera.destroy();
        this._material.resetAllMaterials();
        this._lighting.reset();
    }

    // 销毁
    destroy() {
        if (this._controlPanel) {
            this._controlPanel.destroy();
        }
        this._camera.destroy();
        this._material.destroy();
        this._lighting.destroy();
    }
}

// 导出模块和类型
export {
    Pd3dEnhancements as default,
    CameraEnhancement,
    MaterialEnhancement,
    LightingEnhancement,
    ControlPanel,
    HIGHLIGHT_TYPES,
    SCENE_MODES,
    ENHANCEMENT_CONFIG,
};

