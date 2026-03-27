import { ENHANCEMENT_CONFIG, mergeConfig, SCENE_MODES } from '../config';
import {
    cesiumColor,
    SHODOW_MODE_DISABLED,
    SHODOW_MODE_ENABLED,
    SHODOW_MODE_RECEIVE_ONLY,
    SHADOW_MODE_CAST_ONLY,
} from '../../utils/cesiumUtils';
import { isEmpty } from '../../utils';

class LightingEnhancement {
    constructor(viewer, userConfig = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.config = mergeConfig(ENHANCEMENT_CONFIG.lighting, userConfig);
        
        // 当前光照状态
        this.state = {
            directionalLight: {
                enabled: this.config.directionalLight.enabled,
            },
            ambientLight: {
                enabled: this.config.ambientLight.enabled,
            },
            ibl: {
                enabled: this.config.ibl.enabled,
            },
            shadows: {
                enabled: this.config.shadows.enabled,
            },
        };
        
        // 存储原始光照设置
        this.originalSettings = {
            ambientLight: null,
            lightSource: null,
        };
        
        // 初始化
        this._init();
    }

    _init() {
        // 保存原始光照设置
        this._saveOriginalSettings();
        
        // 应用初始配置
        this._applyLightingConfig();
    }

    _saveOriginalSettings() {
        // 保存原始光照设置
        this.originalSettings.light = this.scene.light;
        
        // 保存原始环境光
        if (this.scene.lightSource && this.scene.lightSource.ambientLightColor) {
            this.originalSettings.ambientLight = new Cesium.Color(
                this.scene.lightSource.ambientLightColor.red,
                this.scene.lightSource.ambientLightColor.green,
                this.scene.lightSource.ambientLightColor.blue,
                this.scene.lightSource.ambientLightColor.alpha
            );
        }
        
        // 保存原始主光源
        if (this.scene.lightSource && this.scene.lightSource.directionalLightColor) {
            this.originalSettings.lightSource = new Cesium.Color(
                this.scene.lightSource.directionalLightColor.red,
                this.scene.lightSource.directionalLightColor.green,
                this.scene.lightSource.directionalLightColor.blue,
                this.scene.lightSource.directionalLightColor.alpha
            );
        }
    }

    _applyLightingConfig() {
        // 默认不自动应用光照配置，避免干扰原有渲染
        // 需要时通过API手动调用
        console.log('Lighting enhancement: auto-apply disabled by default for compatibility');
        
        // 应用方向光
        // if (this.config.directionalLight.enabled) {
        //     this.enableDirectionalLight();
        // }
        
        // 应用环境光
        // if (this.config.ambientLight.enabled) {
        //     this.setAmbientLight(
        //         this.config.ambientLight.color,
        //         this.config.ambientLight.intensity
        //     );
        // }
        
        // 应用IBL
        // if (this.config.ibl.enabled) {
        //     this.enableIBL();
        // }
        
        // 应用阴影
        // if (this.config.shadows.enabled) {
        //     this.enableShadows();
        // }
    }

    // 启用方向光
    enableDirectionalLight(direction = null, intensity = null, color = null) {
        const lightConfig = this.config.directionalLight;
        const finalDirection = direction || lightConfig.direction;
        const finalIntensity = intensity !== null ? intensity : lightConfig.intensity;
        const finalColor = color || lightConfig.color;
        
        try {
            // 计算光照方向向量
            const directionVector = new Cesium.Cartesian3(
                Math.sin(finalDirection.theta) * Math.cos(finalDirection.phi),
                Math.sin(finalDirection.theta) * Math.sin(finalDirection.phi),
                Math.cos(finalDirection.theta)
            );
            
            // 创建方向光
            const light = new Cesium.DirectionalLight({
                direction: directionVector,
                intensity: finalIntensity,
                color: finalColor,
            });
            
            // 替换场景默认光源
            this.scene.light = light;
            
            this.state.directionalLight.enabled = true;
            this.state.directionalLight.direction = finalDirection;
            this.state.directionalLight.intensity = finalIntensity;
            this.state.directionalLight.color = finalColor;
            
            return true;
        } catch (error) {
            console.error('Error enabling directional light:', error);
            return false;
        }
    }

    // 禁用方向光
    disableDirectionalLight() {
        try {
            // 恢复Cesium默认光照
            if (this.originalSettings.light) {
                this.scene.light = this.originalSettings.light;
            } else {
                this.scene.light = new Cesium.DirectionalLight({
                    direction: new Cesium.Cartesian3(0.2, -0.5, 1.0),
                    intensity: 1.0,
                    color: cesiumColor(1.0, 1.0, 1.0, 1.0),
                });
            }
            
            this.state.directionalLight.enabled = false;
            return true;
        } catch (error) {
            console.error('Error disabling directional light:', error);
            return false;
        }
    }

    // 设置方向光参数
    setDirectionalLight(params) {
        if (!this.state.directionalLight.enabled) {
            this.enableDirectionalLight();
        }
        
        const current = this.state.directionalLight;
        const newParams = {
            direction: params.direction || current.direction,
            intensity: params.intensity !== null ? params.intensity : current.intensity,
            color: params.color || current.color,
        };
        
        return this.enableDirectionalLight(
            newParams.direction,
            newParams.intensity,
            newParams.color
        );
    }

    // 设置环境光
    setAmbientLight(color, intensity = 1.0) {
        try {
            // 计算最终颜色（乘强度）
            const finalColor = new Cesium.Color(
                color.red * intensity,
                color.green * intensity,
                color.blue * intensity,
                color.alpha
            );
            
            // 设置环境光颜色
            if (this.scene.lightSource) {
                this.scene.lightSource.ambientLightColor = finalColor;
            }
            
            this.state.ambientLight.enabled = true;
            this.state.ambientLight.color = color;
            this.state.ambientLight.intensity = intensity;
            
            return true;
        } catch (error) {
            console.error('Error setting ambient light:', error);
            return false;
        }
    }

    // 禁用环境光
    disableAmbientLight() {
        try {
            if (this.originalSettings.ambientLight) {
                this.scene.lightSource.ambientLightColor = this.originalSettings.ambientLight;
            }
            this.state.ambientLight.enabled = false;
            return true;
        } catch (error) {
            console.error('Error disabling ambient light:', error);
            return false;
        }
    }

    // 启用IBL（图像基础光照）
    enableIBL(intensity = null, preset = null) {
        const iblConfig = this.config.ibl;
        const finalIntensity = intensity !== null ? intensity : iblConfig.intensity;
        const finalPreset = preset || iblConfig.preset;
        
        try {
            // 在当前Cesium版本中，通过调整光照参数模拟IBL效果
            // 增强环境光和方向光的平衡
            if (this.scene.light) {
                // 调整主光源强度
                this.scene.light.intensity = 0.8;
                
                // 调整环境光
                const iblColor = this._getIBLPresetColor(finalPreset);
                this.setAmbientLight(iblColor, finalIntensity * 0.6);
            }
            
            this.state.ibl.enabled = true;
            this.state.ibl.intensity = finalIntensity;
            this.state.ibl.preset = finalPreset;
            
            return true;
        } catch (error) {
            console.error('Error enabling IBL:', error);
            return false;
        }
    }

    // 禁用IBL
    disableIBL() {
        try {
            // 恢复原始光照设置
            if (this.scene.light) {
                this.scene.light.intensity = 1.0;
            }
            
            if (this.originalSettings.ambientLight && this.scene.lightSource) {
                this.scene.lightSource.ambientLightColor = this.originalSettings.ambientLight;
            }
            
            this.state.ibl.enabled = false;
            return true;
        } catch (error) {
            console.error('Error disabling IBL:', error);
            return false;
        }
    }

    // 获取IBL预设颜色
    _getIBLPresetColor(preset) {
        const presets = {
            sunset: cesiumColor(1.0, 0.8, 0.6, 1.0),
            night: cesiumColor(0.4, 0.5, 0.7, 1.0),
            day: cesiumColor(0.95, 1.0, 1.05, 1.0),
            cloudy: cesiumColor(0.8, 0.85, 0.9, 1.0),
        };
        return presets[preset] || presets.day;
    }

    // 启用阴影
    enableShadows(shadowMode = null, quality = null, darkness = null) {
        const shadowConfig = this.config.shadows;
        const finalMode = shadowMode || shadowConfig.shadowMode;
        const finalQuality = quality || shadowConfig.quality;
        const finalDarkness = darkness !== null ? darkness : shadowConfig.darkness;
        
        try {
            // 启用阴影
            this.shadowMap = this.viewer.shadowMap;
            if (this.shadowMap) {
                this.shadowMap.enabled = true;
                this.shadowMap.darkness = finalDarkness;
                this.shadowMap.softShadows = true;
                
                // 根据质量设置阴影贴图大小
                const sizeMap = {
                    low: 1024,
                    medium: 2048,
                    high: 4096,
                    ultra: 8192,
                };
                this.shadowMap.maximumTextureSize = sizeMap[finalQuality] || 2048;
            }
            
            // 设置全局地形阴影模式
            const cesiumShadowMode = this._getCesiumShadowMode(finalMode);
            this.scene.terrainShadows = cesiumShadowMode;
            
            this.state.shadows.enabled = true;
            this.state.shadows.shadowMode = finalMode;
            this.state.shadows.quality = finalQuality;
            this.state.shadows.darkness = finalDarkness;
            
            return true;
        } catch (error) {
            console.error('Error enabling shadows:', error);
            return false;
        }
    }

    // 禁用阴影
    disableShadows() {
        try {
            if (this.shadowMap) {
                this.shadowMap.enabled = false;
            }
            this.scene.terrainShadows = SHODOW_MODE_DISABLED;
            this.state.shadows.enabled = false;
            return true;
        } catch (error) {
            console.error('Error disabling shadows:', error);
            return false;
        }
    }

    // 设置阴影参数
    setShadowParams(params) {
        if (!this.state.shadows.enabled) {
            this.enableShadows();
        }
        
        return this.enableShadows(
            params.shadowMode,
            params.quality,
            params.darkness
        );
    }

    // 转换阴影模式为Cesium常量
    _getCesiumShadowMode(mode) {
        const modeMap = {
            disabled: SHODOW_MODE_DISABLED,
            enabled: SHODOW_MODE_ENABLED,
            receive_only: SHODOW_MODE_RECEIVE_ONLY,
            cast_only: SHADOW_MODE_CAST_ONLY,
        };
        return modeMap[mode] || SHODOW_MODE_DISABLED;
    }

    // 设置场景模式
    setSceneMode(mode) {
        if (mode === SCENE_MODES.LOCAL_STAGE) {
            // 局部舞台模式：关闭全球地形和天空
            this.scene.globe.show = false;
            this.scene.skyBox.show = false;
            this.scene.sun.show = false;
            this.scene.moon.show = false;
            
            // 启用自定义光照
            this.enableDirectionalLight();
            this.setAmbientLight(this.config.ambientLight.color, 0.5);
        } else {
            // 全局模式
            this.scene.globe.show = true;
            this.scene.skyBox.show = true;
            this.scene.sun.show = true;
            this.scene.moon.show = true;
            
            // 恢复默认光照
            this.disableDirectionalLight();
            this.disableAmbientLight();
        }
    }

    // 检查截图兼容性
    checkScreenshotCompatibility() {
        const gl = this.scene.context._gl;
        const preserveDrawingBuffer = gl.getContextAttributes().preserveDrawingBuffer;
        
        return {
            compatible: preserveDrawingBuffer,
            preserveDrawingBuffer,
            warning: !preserveDrawingBuffer 
                ? 'preserveDrawingBuffer 未启用，截图可能无法正常工作' 
                : null,
        };
    }

    // 检查性能状态
    checkPerformance() {
        // 简单的性能检查
        const context = this.scene.context;
        const textureCount = context._textureCache._textures.size;
        
        return {
            textureCount,
            memoryUsage: textureCount * 0.1, // 估算值，单位MB
            shadowsEnabled: this.state.shadows.enabled,
            IBLEnabled: this.state.ibl.enabled,
        };
    }

    // 获取当前光照状态
    getLightingState() {
        return {
            ...this.state,
            sceneMode: this.scene.globe.show ? SCENE_MODES.GLOBAL : SCENE_MODES.LOCAL_STAGE,
            performance: this.checkPerformance(),
            compatibility: {
                screenshot: this.checkScreenshotCompatibility(),
            },
        };
    }

    // 重置为默认光照
    reset() {
        this.disableDirectionalLight();
        this.disableAmbientLight();
        this.disableIBL();
        this.disableShadows();
        
        // 恢复原始设置
        if (this.originalSettings.ambientLight && this.scene.lightSource) {
            this.scene.lightSource.ambientLightColor = this.originalSettings.ambientLight;
        }
    }

    // 销毁
    destroy() {
        this.reset();
    }
}

export default LightingEnhancement;

