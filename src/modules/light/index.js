import { isEmpty, deepMerge } from '../../utils';
import { cesiumColor, cesiumColorFromBytes } from '../../utils/cesiumUtils';

const DEFAULT_LIGHT_CONFIG = {
    enabled: true,
    directional: {
        enabled: true,
        color: { r: 1, g: 1, b: 1 },
        intensity: 1.0,
        direction: { x: 0.5, y: 0.5, z: -1 },
    },
    ambient: {
        enabled: true,
        color: { r: 0.4, g: 0.4, b: 0.4 },
        intensity: 0.5,
    },
    shadow: {
        enabled: false,
        darkness: 0.3,
        softShadows: true,
        size: 2048,
    },
};

const LIGHT_PRESETS = {
    day: {
        name: '日间模式',
        directional: {
            color: { r: 1, g: 0.98, b: 0.95 },
            intensity: 1.2,
            direction: { x: 0.3, y: 0.5, z: -0.8 },
        },
        ambient: {
            color: { r: 0.5, g: 0.55, b: 0.6 },
            intensity: 0.6,
        },
    },
    evening: {
        name: '黄昏模式',
        directional: {
            color: { r: 1, g: 0.7, b: 0.4 },
            intensity: 0.8,
            direction: { x: 0.8, y: 0.3, z: -0.5 },
        },
        ambient: {
            color: { r: 0.4, g: 0.3, b: 0.25 },
            intensity: 0.4,
        },
    },
    night: {
        name: '夜间模式',
        directional: {
            color: { r: 0.6, g: 0.7, b: 0.9 },
            intensity: 0.3,
            direction: { x: 0.2, y: 0.8, z: -0.5 },
        },
        ambient: {
            color: { r: 0.15, g: 0.18, b: 0.25 },
            intensity: 0.3,
        },
    },
    indoor: {
        name: '室内模式',
        directional: {
            color: { r: 1, g: 1, b: 1 },
            intensity: 0.8,
            direction: { x: 0, y: 0, z: -1 },
        },
        ambient: {
            color: { r: 0.6, g: 0.6, b: 0.6 },
            intensity: 0.7,
        },
    },
    inspection: {
        name: '检测模式',
        directional: {
            color: { r: 0.9, g: 0.95, b: 1 },
            intensity: 1.0,
            direction: { x: 0.4, y: 0.4, z: -0.8 },
        },
        ambient: {
            color: { r: 0.5, g: 0.5, b: 0.55 },
            intensity: 0.5,
        },
    },
};

const SCREENSHOT_COMPATIBILITY = {
    preserveDrawingBuffer: true,
    notes: '透明背景与截图兼容：需要 preserveDrawingBuffer: true，已在 initView 中配置',
    limitations: [
        '启用阴影可能影响透明背景效果',
        'IBL环境贴图可能增加内存占用',
        '高分辨率阴影可能影响性能',
    ],
};

class LightManager {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        
        this.config = deepMerge(DEFAULT_LIGHT_CONFIG, options.lightConfig || {});
        this.currentPreset = null;
        this.directionalLight = null;
        this.ambientLight = null;
        
        this._originalSettings = {
            sunShow: this.scene.sun.show,
            moonShow: this.scene.moon.show,
            skyBoxShow: this.scene.skyBox.show,
            backgroundColor: this.scene.backgroundColor.clone(),
            globeShow: this.scene.globe.show,
            shadowMapEnabled: this.scene.shadowMap ? this.scene.shadowMap.enabled : false,
        };
        
        this._init();
    }

    _init() {
        this._setupLocalStage();
        
        if (this.config.enabled) {
            this._createLights();
        }
    }

    _setupLocalStage() {
        this.scene.sun.show = false;
        this.scene.moon.show = false;
        this.scene.skyBox.show = false;
        this.scene.globe.show = false;
        this.scene.backgroundColor = Cesium.Color.TRANSPARENT;
    }

    _createLights() {
        this._createDirectionalLight();
        this._createAmbientLight();
        
        if (this.config.shadow.enabled) {
            this._enableShadows();
        }
    }

    _createDirectionalLight() {
        if (!this.config.directional.enabled) return;
        
        const dirConfig = this.config.directional;
        
        this.directionalLight = new Cesium.SunLight({
            color: cesiumColor(
                dirConfig.color.r,
                dirConfig.color.g,
                dirConfig.color.b,
                1
            ),
            intensity: dirConfig.intensity,
        });
        
        this.scene.light = this.directionalLight;
    }

    _createAmbientLight() {
        if (!this.config.ambient.enabled) return;
        
        const ambConfig = this.config.ambient;
        const ambientIntensity = ambConfig.intensity;
        
        if (this.scene.light) {
            this.scene.light.intensity = this.config.directional.intensity + ambientIntensity * 0.5;
        }
    }

    _enableShadows() {
        if (!this.scene.shadowMap) {
            console.warn('Shadow map not available in this Cesium version');
            return;
        }
        
        const shadowConfig = this.config.shadow;
        const shadowMap = this.scene.shadowMap;
        
        shadowMap.enabled = true;
        shadowMap.darkness = shadowConfig.darkness;
        shadowMap.softShadows = shadowConfig.softShadows;
        
        if (shadowMap.size !== undefined) {
            shadowMap.size = shadowConfig.size;
        }
        
        this._setModelShadowMode(Cesium.ShadowMode.ENABLED);
    }

    _disableShadows() {
        if (this.scene.shadowMap) {
            this.scene.shadowMap.enabled = false;
        }
        this._setModelShadowMode(Cesium.ShadowMode.DISABLED);
    }

    _setModelShadowMode(mode) {
        const primitives = this.scene.primitives;
        for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives.get(i);
            if (primitive instanceof Cesium.Model) {
                primitive.shadows = mode;
            }
        }
    }

    setDirectionalLight(options = {}) {
        const dirConfig = deepMerge(this.config.directional, options);
        this.config.directional = dirConfig;
        
        if (this.directionalLight) {
            if (options.color) {
                this.directionalLight.color = cesiumColor(
                    options.color.r,
                    options.color.g,
                    options.color.b,
                    1
                );
            }
            if (options.intensity !== undefined) {
                this.directionalLight.intensity = options.intensity;
            }
        }
        
        return this;
    }

    setAmbientLight(options = {}) {
        const ambConfig = deepMerge(this.config.ambient, options);
        this.config.ambient = ambConfig;
        
        this._createAmbientLight();
        return this;
    }

    setLightDirection(x, y, z) {
        if (this.config.directional) {
            this.config.directional.direction = { x, y, z };
            
            if (this.directionalLight) {
                const direction = new Cesium.Cartesian3(x, y, z);
                Cesium.Cartesian3.normalize(direction, direction);
            }
        }
        return this;
    }

    setLightIntensity(intensity) {
        if (this.directionalLight) {
            this.directionalLight.intensity = intensity;
            this.config.directional.intensity = intensity;
        }
        return this;
    }

    enableShadows(options = {}) {
        this.config.shadow = deepMerge(this.config.shadow, options);
        this.config.shadow.enabled = true;
        this._enableShadows();
        return this;
    }

    disableShadows() {
        this.config.shadow.enabled = false;
        this._disableShadows();
        return this;
    }

    toggleShadows() {
        if (this.config.shadow.enabled) {
            return this.disableShadows();
        } else {
            return this.enableShadows();
        }
    }

    setShadowDarkness(darkness) {
        this.config.shadow.darkness = darkness;
        if (this.scene.shadowMap && this.scene.shadowMap.enabled) {
            this.scene.shadowMap.darkness = darkness;
        }
        return this;
    }

    applyPreset(presetName) {
        const preset = LIGHT_PRESETS[presetName];
        if (!preset) {
            console.warn(`Light preset "${presetName}" not found`);
            return this;
        }
        
        this.config.directional = deepMerge(this.config.directional, preset.directional);
        this.config.ambient = deepMerge(this.config.ambient, preset.ambient);
        
        this._createDirectionalLight();
        this._createAmbientLight();
        
        this.currentPreset = presetName;
        return this;
    }

    getCurrentPreset() {
        return this.currentPreset;
    }

    getAvailablePresets() {
        return Object.keys(LIGHT_PRESETS).map(key => ({
            id: key,
            name: LIGHT_PRESETS[key].name,
        }));
    }

    enable() {
        this.config.enabled = true;
        this._createLights();
        return this;
    }

    disable() {
        this.config.enabled = false;
        this._removeLights();
        return this;
    }

    _removeLights() {
        this.scene.light = undefined;
        this._disableShadows();
    }

    reset() {
        this.scene.sun.show = this._originalSettings.sunShow;
        this.scene.moon.show = this._originalSettings.moonShow;
        this.scene.skyBox.show = this._originalSettings.skyBoxShow;
        this.scene.backgroundColor = this._originalSettings.backgroundColor;
        this.scene.globe.show = this._originalSettings.globeShow;
        
        if (this.scene.shadowMap) {
            this.scene.shadowMap.enabled = this._originalSettings.shadowMapEnabled;
        }
        
        return this;
    }

    getConfig() {
        return deepMerge({}, this.config);
    }

    setConfig(config) {
        this.config = deepMerge(DEFAULT_LIGHT_CONFIG, config);
        this._createLights();
        return this;
    }

    getScreenshotCompatibility() {
        return {
            compatible: true,
            preserveDrawingBuffer: SCREENSHOT_COMPATIBILITY.preserveDrawingBuffer,
            notes: SCREENSHOT_COMPATIBILITY.notes,
            limitations: SCREENSHOT_COMPATIBILITY.limitations,
            recommendations: [
                '截图前确保场景已完全渲染',
                '透明背景截图时建议关闭阴影',
                '高分辨率截图时注意内存占用',
            ],
        };
    }

    createSimpleIBL(options = {}) {
        const iblConfig = {
            diffuseIntensity: options.diffuseIntensity || 0.3,
            specularIntensity: options.specularIntensity || 0.5,
            cubeMap: options.cubeMap || null,
        };
        
        if (!iblConfig.cubeMap) {
            this.scene.light.intensity *= (1 + iblConfig.diffuseIntensity);
        }
        
        return {
            enabled: true,
            config: iblConfig,
        };
    }

    destroy() {
        this._removeLights();
        this.directionalLight = null;
        this.ambientLight = null;
    }
}

export {
    LightManager,
    DEFAULT_LIGHT_CONFIG,
    LIGHT_PRESETS,
    SCREENSHOT_COMPATIBILITY,
};

export default LightManager;
