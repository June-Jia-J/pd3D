import { cesiumColorFromBytes, cesiumColor } from '../utils/cesiumUtils';

// 增强模块默认配置
export const ENHANCEMENT_CONFIG = {
    // 相机系统配置
    camera: {
        // 最小视距（防穿模）
        minimumZoomDistance: 10,
        // 最大视距
        maximumZoomDistance: 10000,
        // 近裁剪面距离
        nearClippingDistance: 0.1,
        // 远裁剪面距离
        farClippingDistance: 1000000,
        // 默认动画时长（秒）
        defaultAnimationDuration: 1.5,
        // 环绕速度
        orbitSpeed: 1.0,
        // 缩放速度
        zoomSpeed: 1.0,
    },

    // 视角书签预设
    viewPresets: {
        monitor: {
            patrol: {
                name: '巡视视角',
                description: '全局巡视视角，适合整体监测',
                position: { lon: 0, lat: 0, alt: 1500, heading: 0, pitch: -0.785, roll: 0 },
            },
            detail: {
                name: '细节观察',
                description: '近距离细节观察视角',
                position: { lon: 0, lat: 0, alt: 300, heading: 0, pitch: -0.3, roll: 0 },
            },
            top: {
                name: '俯视图',
                description: '正上方俯视视角',
                position: { lon: 0, lat: 0, alt: 800, heading: 0, pitch: -1.57, roll: 0 },
            },
            front: {
                name: '主视图',
                description: '正面观察视角',
                position: { lon: 0, lat: 0, alt: 500, heading: 0, pitch: -0.5, roll: 0 },
            },
        },
        detection: {
            patrol: {
                name: '带电检测巡视',
                description: '带电检测专用巡视视角',
                position: { lon: 0, lat: 0, alt: 1200, heading: 0.5, pitch: -0.6, roll: 0 },
            },
            detail: {
                name: '检测点特写',
                description: '检测点近距离特写',
                position: { lon: 0, lat: 0, alt: 200, heading: 0.3, pitch: -0.2, roll: 0 },
            },
        },
    },

    // 材质系统配置
    material: {
        // 高亮效果配置
        highlight: {
            // 选中高亮颜色
            selectedColor: cesiumColorFromBytes(100, 200, 255, 255),
            // 告警高亮颜色
            alarmColor: cesiumColorFromBytes(255, 100, 100, 255),
            // 警告高亮颜色
            warningColor: cesiumColorFromBytes(255, 200, 100, 255),
            // 高亮边缘发光强度
            glowIntensity: 2.0,
            // 是否显示轮廓
            showOutline: true,
            // 轮廓颜色
            outlineColor: cesiumColorFromBytes(255, 255, 255, 255),
            // 轮廓宽度
            outlineWidth: 2.0,
        },
        // PBR材质默认值
        pbr: {
            baseColor: cesiumColor(1.0, 1.0, 1.0, 1.0),
            metallic: 0.0,
            roughness: 1.0,
            emissive: cesiumColor(0.0, 0.0, 0.0, 1.0),
            emissiveIntensity: 0.0,
        },
        // 降级策略
        fallback: {
            // 不支持PBR时使用颜色混合模式
            useColorBlend: true,
            // 颜色混合比例
            colorBlendAmount: 0.5,
        },
    },

    // 光照系统配置
    lighting: {
        // 主方向光
        directionalLight: {
            enabled: false,
            // 光照方向（球坐标）
            direction: {
                theta: Math.PI * 0.25, // 方位角
                phi: Math.PI * 0.25,   // 极角
            },
            // 光照强度
            intensity: 1.5,
            // 光照颜色
            color: cesiumColor(1.0, 1.0, 0.95, 1.0),
        },
        // 环境光
        ambientLight: {
            enabled: false,
            intensity: 0.4,
            color: cesiumColor(0.8, 0.85, 1.0, 1.0),
        },
        // IBL（图像基础光照）
        ibl: {
            enabled: false,
            intensity: 0.5,
            // 环境贴图预设
            preset: 'sunset', // 'sunset', 'night', 'day', 'cloudy'
        },
        // 阴影配置
        shadows: {
            enabled: false,
            // 阴影投射模式
            shadowMode: 'receive_only', // 'disabled', 'enabled', 'receive_only', 'cast_only'
            // 阴影质量
            quality: 'medium', // 'low', 'medium', 'high', 'ultra'
            // 阴影透明度
            darkness: 0.3,
            // 阴影边缘柔和度
            softness: 0.5,
        },
        // 兼容选项
        compatibility: {
            // 透明背景模式
            transparentBackground: true,
            // 截图兼容性（preserveDrawingBuffer）
            preserveDrawingBuffer: true,
            // 性能降级阈值（FPS）
            performanceThreshold: 30,
        },
    },

    // UI配置
    ui: {
        // 面板位置
        panelPosition: 'left', // 'left', 'right'
        // 默认是否展开
        defaultExpanded: false,
        // 主题色
        themeColor: '#1890ff',
    },
};

// 状态类型枚举
export const HIGHLIGHT_TYPES = {
    NONE: 'none',
    SELECTED: 'selected',
    ALARM: 'alarm',
    WARNING: 'warning',
    CUSTOM: 'custom',
};

// 场景模式
export const SCENE_MODES = {
    GLOBAL: 'global',
    LOCAL_STAGE: 'local_stage',
};

// 导出配置合并工具函数
export function mergeConfig(defaultConfig, userConfig) {
    if (!userConfig) return { ...defaultConfig };
    
    const merged = { ...defaultConfig };
    for (const key in userConfig) {
        if (userConfig.hasOwnProperty(key)) {
            if (
                typeof userConfig[key] === 'object' &&
                userConfig[key] !== null &&
                !Array.isArray(userConfig[key])
            ) {
                merged[key] = mergeConfig(defaultConfig[key], userConfig[key]);
            } else {
                merged[key] = userConfig[key];
            }
        }
    }
    return merged;
}

