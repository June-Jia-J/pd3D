import * as Cesium from 'cesium/Cesium'
window.Cesium = Cesium
console.log(Cesium)

export const IDENTITY = Cesium.Matrix4.IDENTITY

export const CARTESIAN3_UNIT_Z = Cesium.Cartesian3.UNIT_Z

export const CESIUM_MATH = Cesium.Math

export const COLOR_TRANSPARENT = Cesium.Color.TRANSPARENT

export const SHODOW_MODE_RECEIVE_ONLY = Cesium.ShadowMode.RECEIVE_ONLY

export const SHODOW_MODE_DISABLED = Cesium.ShadowMode.DISABLED

export const EASING_FUNCTION_SINUSOIDAL_IN = Cesium.EasingFunction.SINUSOIDAL_IN

export const EASING_FUNCTION_LINEAR_NONE = Cesium.EasingFunction.LINEAR_NONE


//获取颜色值FromBytes
export const cesiumColorFromBytes = (red, green, blue, alpha, result) => {
    return new Cesium.Color.fromBytes(red, green, blue, alpha, result)
}

//获取颜色值fromAlpha
export const cesiumColorfromAlpha = (color, alpha, result) => {
    return Cesium.Color.fromAlpha(color, alpha, result)
}

//获取颜色值
export const cesiumColor = (red, green, blue, alpha, result) => {
    return new Cesium.Color(red, green, blue, alpha, result)
}

//从以度为单位的经度和纬度值返回Cartesian3位置
export const cartesian3FromDegrees = (longitude, latitude, height, ellipsoid, result) => {
    return Cesium.Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid, result);
}

//将WGS84坐标中的位置转换为窗口坐标。这通常用于放置与场景中的对象位于同一屏幕位置的HTML元素。
export const wgs84ToWindowCoordinates = (scene, position, result) => {
    return Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, position, result);
}

//作为航向，俯仰和横滚的一种旋转表示；heading是围绕负Z轴。pitch是绕负y轴的旋转。roll是关于正x轴。
export const headingPitchRoll = (heading, pitch, roll) => {
    return new Cesium.HeadingPitchRoll(heading, pitch, roll)
}

//在局部框架中定义航向角，俯仰角和范围。
//heading是从局部北向旋转，其中正角向东增加。
//Pitch是从局部xy平面旋转的角度。正俯仰角在平面上方。负音高角度在平面下方。
//range是距框架中心的距离。
export const headingPitchRange = (heading, pitch, range) => {
    return new Cesium.HeadingPitchRange(heading, pitch, range)
}

//3D笛卡尔点。
export const cesiumCartesian3 = (x, y, z) => {
    return new Cesium.Cartesian3(x, y, z)
}

//根据参考系计算四元数，
//其中参考系具有根据航向 - 俯仰 - 横滚角计算的轴以提供的原点为中心。
//航向是当地北部的旋转正角向东增加的方向。
//俯仰是从本地东西向平面的旋转。正俯仰角在飞机上方。负俯仰角在平面下方。
//横摇是绕局部东轴应用的第一次旋转。
export const headingPitchRollQuaternion = (origin, headingPitchRoll, ellipsoid, fixedFrameTransform, result) => {
    return Cesium.Transforms.headingPitchRollQuaternion(origin, headingPitchRoll, ellipsoid, fixedFrameTransform, result)
}

//根据参考系计算4x4变换矩阵，
//其中参考系具有根据航向 - 俯仰 - 横滚角计算的轴以提供的原点为中心，以提供的椭球的固定参考系为中心。
//航向是当地北部的旋转正角向东增加的方向。
//俯仰是从本地东西向平面的旋转。正俯仰角在飞机上方。负俯仰角在平面下方。
//横摇是绕局部东轴应用的第一次旋转。
export const headingPitchRollToFixedFrame = (origin, headingPitchRoll, ellipsoid, fixedFrameTransform, result) => {
    return Cesium.Transforms.headingPitchRollToFixedFrame(origin, headingPitchRoll, ellipsoid, fixedFrameTransform, result)
}

//从笛卡尔位置创建一个新的制图实例。中的值生成的对象将以弧度表示。
export const cartographicFromCartesian = (cartesian, ellipsoid, result) => {
    return Cesium.Cartographic.fromCartesian(cartesian, ellipsoid, result)
}
