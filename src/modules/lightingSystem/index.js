import { isEmpty, deepClone } from '../../utils';
import { cesiumColorFromBytes, cesiumColor, cartesian3FromDegrees } from '../../utils/cesiumUtils';

/**
 * 场景光影系统
 * 功能：
 * 1. 主方向光 + 环境光控制
 * 2. 简易 IBL（基于图像的照明）
 * 3. 模型投射/接收阴影
 * 4. 与透明背景、截图兼容策略
 * 5. 性能降级方案
 */
class LightingSystem {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.camera = viewer.camera;
        
        // 默认配置
        this.defaultOptions = {
            // 舞台模式（关闭全球地形与天空）
            stageMode: true,
            // 透明背景
            transparentBackground: true,
            // 主方向光配置
            directionalLight: {
                enabled: true,
                direction: new Cesium.Cartesian3(0.5, -0.5, -1.0), // 默认方向
                color: cesiumColorFromBytes(255, 255, 255, 255),
                intensity: 1.0,
            },
            // 环境光配置
            ambientLight: {
                enabled: true,
                color: cesiumColorFromBytes(100, 100, 120, 255),
                intensity: 0.4,
            },
            // 阴影配置
            shadows: {
                enabled: false, // 默认关闭以提升性能
                mapSize: 2048,
                darkness: 0.3,
                normalOffset: true,
                softShadows: false,
            },
            // IBL 配置
            ibl: {
                enabled: false,
                // 环境贴图 URL（立方体贴图或等距柱状图）
                environmentMapUrl: null,
                // 漫反射强度
                diffuseIntensity: 0.5,
                // 镜面反射强度
                specularIntensity: 0.5,
            },
            // HDR 配置
            hdr: {
                enabled: false,
                exposure: 1.0,
                gamma: 2.2,
            },
            // 性能配置
            performance: {
                // 自动降级
                autoDowngrade: true,
                // 帧率阈值
                fpsThreshold: 30,
                // 检测周期（毫秒）
                checkInterval: 5000,
            }
        };
        
        this.options = this._mergeOptions(this.defaultOptions, options);
        
        // 保存原始状态以便恢复
        this.originalState = {};
        
        // 灯光对象引用
        this.lights = {
            directional: null,
            ambient: null,
        };
        
        // 性能监控
        this.performanceMonitor = {
            frameCount: 0,
            lastCheck: Date.now(),
            currentFps: 60,
            isDowngraded: false,
        };
        
        // 初始化
        this._init();
    }

    /**
     * 合并配置选项
     */
    _mergeOptions(defaults, options) {
        const merged = deepClone(defaults);
        
        if (options.directionalLight) {
            Object.assign(merged.directionalLight, options.directionalLight);
        }
        if (options.ambientLight) {
            Object.assign(merged.ambientLight, options.ambientLight);
        }
        if (options.shadows) {
            Object.assign(merged.shadows, options.shadows);
        }
        if (options.ibl) {
            Object.assign(merged.ibl, options.ibl);
        }
        if (options.hdr) {
            Object.assign(merged.hdr, options.hdr);
        }
        if (options.performance) {
            Object.assign(merged.performance, options.performance);
        }
        
        merged.stageMode = options.stageMode !== undefined ? options.stageMode : defaults.stageMode;
        merged.transparentBackground = options.transparentBackground !== undefined ? 
            options.transparentBackground : defaults.transparentBackground;
        
        return merged;
    }

    /**
     * 初始化光影系统
     */
    _init() {
        // 保存原始状态
        this._saveOriginalState();
        
        // 应用舞台模式
        if (this.options.stageMode) {
            this._applyStageMode();
        }
        
        // 初始化灯光
        this._initLights();
        
        // 初始化阴影
        this._initShadows();
        
        // 初始化性能监控
        if (this.options.performance.autoDowngrade) {
            this._startPerformanceMonitor();
        }
    }

    /**
     * 保存原始场景状态
     */
    _saveOriginalState() {
        this.originalState = {
            globeShow: this.scene.globe.show,
            skyBoxShow: this.scene.skyBox.show,
            sunShow: this.scene.sun.show,
            moonShow: this.scene.moon.show,
            backgroundColor: this.scene.backgroundColor.clone(),
            globeBaseColor: this.scene.globe.baseColor.clone(),
            shadowsEnabled: this.scene.shadowMap ? this.scene.shadowMap.enabled : false,
        };
    }

    /**
     * 应用舞台模式
     */
    _applyStageMode() {
        // 关闭地球
        this.scene.globe.show = false;
        this.scene.globe.baseColor = Cesium.Color.TRANSPARENT;
        
        // 关闭天空盒
        this.scene.skyBox.show = false;
        
        // 关闭太阳和月亮
        this.scene.sun.show = false;
        this.scene.moon.show = false;
        
        // 设置背景色
        if (this.options.transparentBackground) {
            this.scene.backgroundColor = Cesium.Color.TRANSPARENT;
        }
        
        // 禁用大气层
        this.scene.skyAtmosphere.show = false;
        
        // 禁用雾效（可选）
        this.scene.fog.enabled = false;
    }

    /**
     * 初始化灯光
     */
    _initLights() {
        // Cesium 使用基于物理的光照模型，主要依赖环境光和方向光
        // 通过调整 scene.light 和 scene.globe.dynamicAtmosphereLighting 来控制
        
        if (this.options.directionalLight.enabled) {
            this._setupDirectionalLight();
        }
        
        if (this.options.ambientLight.enabled) {
            this._setupAmbientLight();
        }
        
        // 关闭动态大气光照（舞台模式下不需要）
        this.scene.globe.dynamicAtmosphereLighting = false;
        this.scene.globe.dynamicAtmosphereLightingFromSun = false;
    }

    /**
     * 设置主方向光
     */
    _setupDirectionalLight() {
        const config = this.options.directionalLight;
        
        // 创建方向光
        // Cesium 1.89+ 支持自定义光源
        if (Cesium.DirectionalLight) {
            this.lights.directional = new Cesium.DirectionalLight({
                direction: config.direction,
                color: config.color,
                intensity: config.intensity,
            });
            
            // 应用到场景
            this.scene.light = this.lights.directional;
        } else {
            // 降级方案：调整太阳位置模拟方向光
            this.scene.sun.show = true;
            this._updateSunPosition(config.direction);
        }
    }

    /**
     * 更新太阳位置以模拟方向光
     */
    _updateSunPosition(direction) {
        // 将方向转换为太阳位置
        const opposite = Cesium.Cartesian3.negate(direction, new Cesium.Cartesian3());
        // 这里简化处理，实际应根据方向计算地理坐标
    }

    /**
     * 设置环境光
     */
    _setupAmbientLight() {
        const config = this.options.ambientLight;
        
        // Cesium 使用环境光贴图或全局环境光
        // 通过调整 scene.globe.lightingFadeOutDistance 等参数模拟
        this.scene.globe.lightingFadeOutDistance = 100000000;
        this.scene.globe.lightingFadeInDistance = 100000000;
        
        // 设置环境光颜色（通过背景色间接影响）
        if (!this.options.transparentBackground) {
            const ambient = config.color;
            this.scene.backgroundColor = new Cesium.Color(
                ambient.red * config.intensity,
                ambient.green * config.intensity,
                ambient.blue * config.intensity,
                1.0
            );
        }
    }

    /**
     * 初始化阴影
     */
    _initShadows() {
        const config = this.options.shadows;
        
        if (config.enabled) {
            // 启用阴影贴图
            this.scene.shadowMap.enabled = true;
            this.scene.shadowMap.size = config.mapSize;
            this.scene.shadowMap.darkness = config.darkness;
            this.scene.shadowMap.normalOffset = config.normalOffset;
            this.scene.shadowMap.softShadows = config.softShadows;
            
            // 设置阴影的最大距离
            this.scene.shadowMap.maximumDistance = 5000;
        } else {
            this.scene.shadowMap.enabled = false;
        }
    }

    /**
     * 启动性能监控
     */
    _startPerformanceMonitor() {
        this.viewer.clock.onTick.addEventListener(this._performanceTick);
    }

    /**
     * 性能监控帧回调
     */
    _performanceTick = () => {
        this.performanceMonitor.frameCount++;
        
        const now = Date.now();
        const elapsed = now - this.performanceMonitor.lastCheck;
        
        if (elapsed >= this.options.performance.checkInterval) {
            const fps = (this.performanceMonitor.frameCount / elapsed) * 1000;
            this.performanceMonitor.currentFps = fps;
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastCheck = now;
            
            // 检查是否需要降级
            if (fps < this.options.performance.fpsThreshold && 
                !this.performanceMonitor.isDowngraded) {
                this._applyPerformanceDowngrade();
            } else if (fps > this.options.performance.fpsThreshold * 1.5 && 
                       this.performanceMonitor.isDowngraded) {
                this._restoreFromDowngrade();
            }
        }
    }

    /**
     * 应用性能降级
     */
    _applyPerformanceDowngrade() {
        console.log('LightingSystem: 应用性能降级');
        this.performanceMonitor.isDowngraded = true;
        
        // 关闭阴影
        this.scene.shadowMap.enabled = false;
        
        // 降低光照复杂度
        if (this.lights.directional) {
            this.lights.directional.intensity *= 0.8;
        }
        
        // 降低渲染分辨率
        this.scene.globe.maximumScreenSpaceError = 4;
    }

    /**
     * 从降级恢复
     */
    _restoreFromDowngrade() {
        console.log('LightingSystem: 从性能降级恢复');
        this.performanceMonitor.isDowngraded = false;
        
        // 恢复阴影设置
        this.scene.shadowMap.enabled = this.options.shadows.enabled;
        
        // 恢复光照
        if (this.lights.directional) {
            this.lights.directional.intensity = this.options.directionalLight.intensity;
        }
        
        // 恢复渲染分辨率
        this.scene.globe.maximumScreenSpaceError = 2;
    }

    /**
     * 设置方向光
     * @param {Object} config - 方向光配置
     */
    setDirectionalLight(config = {}) {
        Object.assign(this.options.directionalLight, config);
        
        if (this.lights.directional) {
            if (config.direction) this.lights.directional.direction = config.direction;
            if (config.color) this.lights.directional.color = config.color;
            if (config.intensity !== undefined) {
                this.lights.directional.intensity = config.intensity;
            }
        } else {
            this._setupDirectionalLight();
        }
    }

    /**
     * 设置环境光
     * @param {Object} config - 环境光配置
     */
    setAmbientLight(config = {}) {
        Object.assign(this.options.ambientLight, config);
        this._setupAmbientLight();
    }

    /**
     * 设置阴影
     * @param {boolean} enabled - 是否启用
     * @param {Object} options - 阴影选项
     */
    setShadows(enabled, options = {}) {
        this.options.shadows.enabled = enabled;
        Object.assign(this.options.shadows, options);
        
        this.scene.shadowMap.enabled = enabled;
        
        if (enabled) {
            this.scene.shadowMap.size = this.options.shadows.mapSize;
            this.scene.shadowMap.darkness = this.options.shadows.darkness;
            this.scene.shadowMap.normalOffset = this.options.shadows.normalOffset;
            this.scene.shadowMap.softShadows = this.options.shadows.softShadows;
        }
    }

    /**
     * 设置模型的阴影属性
     * @param {Cesium.Model} model - 模型
     * @param {Object} options - 阴影选项
     * @param {boolean} options.cast - 是否投射阴影
     * @param {boolean} options.receive - 是否接收阴影
     */
    setModelShadows(model, options = {}) {
        if (!model) return;
        
        if (options.cast !== undefined) {
            model.castShadows = options.cast;
        }
        if (options.receive !== undefined) {
            model.receiveShadows = options.receive;
        }
    }

    /**
     * 启用/禁用 IBL
     * @param {boolean} enabled - 是否启用
     * @param {Object} options - IBL 选项
     */
    setIBL(enabled, options = {}) {
        this.options.ibl.enabled = enabled;
        Object.assign(this.options.ibl, options);
        
        if (enabled && options.environmentMapUrl) {
            // 加载环境贴图
            this._loadEnvironmentMap(options.environmentMapUrl);
        }
    }

    /**
     * 加载环境贴图
     */
    _loadEnvironmentMap(url) {
        // Cesium 1.89+ 支持环境贴图
        // 这里需要根据具体版本实现
        console.log('LightingSystem: 加载环境贴图', url);
    }

    /**
     * 设置 HDR
     * @param {boolean} enabled - 是否启用
     * @param {Object} options - HDR 选项
     */
    setHDR(enabled, options = {}) {
        this.options.hdr.enabled = enabled;
        Object.assign(this.options.hdr, options);
        
        // Cesium 的 HDR 设置
        this.scene.highDynamicRange = enabled;
        
        if (options.exposure !== undefined) {
            this.scene.exposure = options.exposure;
        }
        if (options.gamma !== undefined) {
            this.scene.gamma = options.gamma;
        }
    }

    /**
     * 设置透明背景
     * @param {boolean} enabled - 是否启用
     * @param {Object} options - 选项
     */
    setTransparentBackground(enabled, options = {}) {
        this.options.transparentBackground = enabled;
        
        if (enabled) {
            this.scene.backgroundColor = Cesium.Color.TRANSPARENT;
        } else {
            const color = options.backgroundColor || this.options.ambientLight.color;
            this.scene.backgroundColor = color;
        }
        
        // 截图兼容性处理
        if (options.preserveDrawingBuffer !== undefined) {
            // 注意：这需要在 Viewer 初始化时设置
            console.warn('LightingSystem: preserveDrawingBuffer 需要在初始化时设置');
        }
    }

    /**
     * 获取当前光影配置
     * @returns {Object} 配置对象
     */
    getConfig() {
        return deepClone(this.options);
    }

    /**
     * 导出配置为 JSON
     * @returns {string} JSON 字符串
     */
    exportConfig() {
        return JSON.stringify(this.options, null, 2);
    }

    /**
     * 从 JSON 导入配置
     * @param {string} jsonString - JSON 字符串
     * @returns {boolean} 是否成功
     */
    importConfig(jsonString) {
        try {
            const config = JSON.parse(jsonString);
            this.options = this._mergeOptions(this.defaultOptions, config);
            this._init();
            return true;
        } catch (e) {
            console.error('LightingSystem: 导入配置失败', e);
            return false;
        }
    }

    /**
     * 恢复到原始状态
     */
    restoreOriginal() {
        this.scene.globe.show = this.originalState.globeShow;
        this.scene.globe.baseColor = this.originalState.globeBaseColor;
        this.scene.skyBox.show = this.originalState.skyBoxShow;
        this.scene.sun.show = this.originalState.sunShow;
        this.scene.moon.show = this.originalState.moonShow;
        this.scene.backgroundColor = this.originalState.backgroundColor;
        
        if (this.scene.shadowMap) {
            this.scene.shadowMap.enabled = this.originalState.shadowsEnabled;
        }
    }

    /**
     * 销毁资源
     */
    destroy() {
        this.viewer.clock.onTick.removeEventListener(this._performanceTick);
        this.restoreOriginal();
    }

    /**
     * 创建光影配置对象（用于初始化）
     * @param {Object} config - 配置
     * @returns {Object} 光影配置
     */
    static createLightingConfig(config = {}) {
        return {
            stageMode: config.stageMode !== false,
            transparentBackground: config.transparentBackground !== false,
            directionalLight: {
                enabled: config.directionalLightEnabled !== false,
                direction: config.directionalLightDirection,
                color: config.directionalLightColor,
                intensity: config.directionalLightIntensity,
            },
            ambientLight: {
                enabled: config.ambientLightEnabled !== false,
                color: config.ambientLightColor,
                intensity: config.ambientLightIntensity,
            },
            shadows: {
                enabled: config.shadowsEnabled === true,
                mapSize: config.shadowMapSize,
                darkness: config.shadowDarkness,
            },
            ibl: {
                enabled: config.iblEnabled === true,
                environmentMapUrl: config.environmentMapUrl,
            },
            hdr: {
                enabled: config.hdrEnabled === true,
            },
            performance: {
                autoDowngrade: config.autoDowngrade !== false,
            }
        };
    }
}

export default LightingSystem;
