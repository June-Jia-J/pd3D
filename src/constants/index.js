import { cesiumColorFromBytes } from '../utils/cesiumUtils'

//相机镜头Heading朝向前时的值范围
export const CAMERA_HEADING_FRONT = {
    MIN: Math.PI * 0.5,//1.57, //π/2
    MAX: Math.PI * 1.5, //4.71,3π/2
};

export const STATUS_COLOR = {
    SELECTED: cesiumColorFromBytes(24, 144, 255, 255),
    ALARM: cesiumColorFromBytes(245, 34, 45, 255),
    WARNING: cesiumColorFromBytes(250, 173, 20, 255),
    SERIOUS: cesiumColorFromBytes(251, 75, 28, 255),
    LOSTCONNECT: cesiumColorFromBytes(118, 121, 125, 255),
}

export const INIT_LOAD = {
    numRow: 3,
    size: 80,
    resolutionScale: 1
}

//传感器模型加载的默认高度
//pos.alt = deviceType == 1 ? 520 : deviceType == 32 ? 420 : 220;
export const SONSOR_POSITION_ALT = [
    { deviceType: -1, alt: 500 },//没有设备模型时
    { deviceType: 1, alt: 520 },//变压器
    { deviceType: 32, alt: 420 },//组合电器
    { deviceType: 10, alt: 220 },//开关柜
];
export const SSONSOR_POSITION_ALT_DEFAULT = 300;

export const DEFULT_VALUE = {
    POSTION: {
        lon: 0,
        lat: 0,
        alt: 0,
        heading: 0,
        pitch: 0,
        roll: 0,
    },
    SENCE_POSITION_DEVICE: [{
        deviceType: -1,
        position: {
            lon: -0.009646258416404279,
            lat: 0.011478300015038306,
            alt: 745.9355615597799,
            heading: 2.4642878634532384,
            picth: -0.3691339868232526,
            roll: 9.014986677158277E-7,
        }
    }, {
        deviceType: 1,//变压器
        position: {
            lon: -0.0004001817761151179,
            lat: -0.007752184906502147,
            alt: 1110.5169573141625,
            heading: 6.283185307179586,
            picth: -0.7855335069743079,
            roll: 6.283185307179586,
        }
    }, {
        deviceType: 32,//组合电器
        position: {
            lon: -0.000084658367442973,
            lat: -0.0032213271885353696,
            alt: 535.920588106952,
            heading: 6.283185307179586,
            picth: -0.7854535158045826,
            roll: 6.283185307179586,
        }
    }, {
        deviceType: 10,//开关柜
        position: {
            lon: -5.982813844117095e-19,
            lat: -0.0025550191506940154,
            alt: 393.2120541024929,
            heading: 6.283185307179586,
            picth: -0.7854427992133566,
            roll: 6.283185307179586,
        }
    }],
    SENCE_POSITION_SENSOR: {
        lon: -0.0011460977052814023,
        lat: -0.0038162453076932903,
        alt: 561.43909139428249,
        heading: 0.1384659843166096,
        picth: -0.23105046736950507,
        roll: 6.28318523230039,
    },
}

export const CAMERA_CONFIG = {
    minimumZoomDistance: 20,
    maximumZoomDistance: 5000,
    minimumPitch: -Math.PI / 2,
    maximumPitch: 0,
    nearClip: 1.0,
    farClip: 50000000.0,
    defaultFlyDuration: 1.5,
}

export const VIEW_PRESETS = {
    PATROL: {
        name: '巡视视角',
        nameEn: 'Patrol View',
        description: '适合整体巡视观察',
        distance: 800,
        pitch: -45,
    },
    DETAIL: {
        name: '细节观察',
        nameEn: 'Detail View',
        description: '适合近距离观察细节',
        distance: 200,
        pitch: -30,
    },
    TOP: {
        name: '俯视视角',
        nameEn: 'Top View',
        description: '从上方俯视场景',
        distance: 500,
        pitch: -89,
    },
    FRONT: {
        name: '正视视角',
        nameEn: 'Front View',
        description: '从正面观察场景',
        distance: 300,
        pitch: -15,
    },
}

export const COLOR_BLEND_MODE = {
    HIGHLIGHT: 0,
    REPLACE: 1,
    MIX: 2,
}

export const MATERIAL_CONFIG = {
    colorBlendMode: COLOR_BLEND_MODE.MIX,
    colorBlendAmount: 0.5,
    highlightBlendAmount: 0.5,
    alarmBlendAmount: 0.7,
    selectedBlendAmount: 0.5,
}

export const LIGHT_CONFIG = {
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
}

export const PHASE_COLORS = {
    A: cesiumColorFromBytes(255, 77, 79, 255),
    B: cesiumColorFromBytes(82, 196, 26, 255),
    C: cesiumColorFromBytes(22, 119, 255, 255),
    N: cesiumColorFromBytes(140, 140, 140, 255),
    default: cesiumColorFromBytes(24, 144, 255, 255),
}

export const ENHANCEMENT_DEFAULTS = {
    camera: {
        enableBookmarks: true,
        enableOrbit: true,
        enableBounds: true,
        maxBookmarks: 20,
    },
    material: {
        enablePBR: true,
        enablePhaseHighlight: true,
        enableNodeHighlight: false,
    },
    light: {
        enableDirectional: true,
        enableAmbient: true,
        enableShadows: false,
        enablePresets: true,
    },
}


