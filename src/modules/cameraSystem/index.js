import { isEmpty, deepClone } from '../../utils';
import { cartesian3FromDegrees, headingPitchRange, CESIUM_MATH, EASING_FUNCTION_SINUSOIDAL_IN_OUT } from '../../utils/cesiumUtils';

/**
 * 相机与视角管理系统
 * 功能：
 * 1. 视角书签管理（保存/加载/删除预设视角）
 * 2. 相机动画过渡（飞向目标/恢复默认）
 * 3. 环绕/缩放边界与防穿模控制
 */
class CameraSystem {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.camera = viewer.camera;
        
        // 默认配置
        this.defaultOptions = {
            // 最小视距（防止穿模）
            minimumZoomDistance: 20,
            // 最大视距
            maximumZoomDistance: 5000,
            // 近裁剪面
            nearFarScalar: new Cesium.NearFarScalar(1.0, 1.0, 5000000.0, 0.0),
            // 动画默认时长（秒）
            defaultFlyDuration: 1.5,
            // 是否启用碰撞检测
            enableCollisionDetection: true,
            // 是否限制俯仰角
            limitPitch: true,
            // 最小俯仰角（弧度，-PI/2为垂直向下）
            minimumPitch: -Cesium.Math.PI_OVER_TWO + 0.1,
            // 最大俯仰角（弧度）
            maximumPitch: Cesium.Math.PI_OVER_TWO - 0.1,
        };
        
        this.options = { ...this.defaultOptions, ...options };
        
        // 视角书签存储
        this.viewBookmarks = new Map();
        
        // 默认视角
        this.defaultView = null;
        
        // 环绕动画状态
        this.orbitState = {
            isOrbiting: false,
            center: null,
            radius: 100,
            speed: 0.005,
            startTime: null,
            stopCallback: null
        };
        
        // 初始化相机控制
        this._initCameraControl();
    }

    /**
     * 初始化相机控制参数
     */
    _initCameraControl() {
        const controller = this.scene.screenSpaceCameraController;
        
        // 设置缩放边界
        controller.minimumZoomDistance = this.options.minimumZoomDistance;
        controller.maximumZoomDistance = this.options.maximumZoomDistance;
        
        // 启用碰撞检测
        controller.enableCollisionDetection = this.options.enableCollisionDetection;
        
        // 设置近裁剪面
        if (this.options.nearFarScalar) {
            this.scene.camera.frustum.near = 0.1;
        }
    }

    /**
     * 保存当前视角为书签
     * @param {string} name - 书签名称
     * @param {Object} metadata - 额外元数据（如场景类型、描述等）
     * @returns {Object} 保存的视角数据
     */
    saveBookmark(name, metadata = {}) {
        const position = this.camera.position;
        const heading = this.camera.heading;
        const pitch = this.camera.pitch;
        const roll = this.camera.roll;
        
        // 将笛卡尔坐标转换为经纬度高
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        
        const bookmark = {
            name,
            position: {
                x: position.x,
                y: position.y,
                z: position.z,
            },
            orientation: {
                heading: heading,
                pitch: pitch,
                roll: roll,
            },
            lonLatAlt: {
                longitude: Cesium.Math.toDegrees(cartographic.longitude),
                latitude: Cesium.Math.toDegrees(cartographic.latitude),
                height: cartographic.height,
            },
            timestamp: Date.now(),
            metadata: { ...metadata }
        };
        
        this.viewBookmarks.set(name, bookmark);
        
        // 如果是第一个书签，设为默认视角
        if (!this.defaultView) {
            this.defaultView = name;
        }
        
        return bookmark;
    }

    /**
     * 加载指定名称的视角书签
     * @param {string} name - 书签名称
     * @param {Object} options - 飞行选项
     * @returns {boolean} 是否成功加载
     */
    loadBookmark(name, options = {}) {
        const bookmark = this.viewBookmarks.get(name);
        if (!bookmark) {
            console.warn(`CameraSystem: 视角书签 "${name}" 不存在`);
            return false;
        }
        
        const flyOptions = {
            duration: this.options.defaultFlyDuration,
            easingFunction: EASING_FUNCTION_SINUSOIDAL_IN_OUT,
            ...options
        };
        
        this.flyToPosition(bookmark.position, bookmark.orientation, flyOptions);
        return true;
    }

    /**
     * 删除视角书签
     * @param {string} name - 书签名称
     * @returns {boolean} 是否成功删除
     */
    deleteBookmark(name) {
        if (this.viewBookmarks.has(name)) {
            this.viewBookmarks.delete(name);
            if (this.defaultView === name) {
                this.defaultView = this.viewBookmarks.size > 0 ? 
                    Array.from(this.viewBookmarks.keys())[0] : null;
            }
            return true;
        }
        return false;
    }

    /**
     * 获取所有书签列表
     * @returns {Array} 书签列表
     */
    getBookmarks() {
        return Array.from(this.viewBookmarks.values());
    }

    /**
     * 设置默认视角
     * @param {string} name - 书签名称
     */
    setDefaultBookmark(name) {
        if (this.viewBookmarks.has(name)) {
            this.defaultView = name;
        }
    }

    /**
     * 恢复到默认视角
     * @param {Object} options - 飞行选项
     * @returns {boolean} 是否成功恢复
     */
    restoreDefaultView(options = {}) {
        if (this.defaultView) {
            return this.loadBookmark(this.defaultView, options);
        }
        return false;
    }

    /**
     * 相机动画飞行到指定位置
     * @param {Object} position - 位置（笛卡尔坐标或经纬度高）
     * @param {Object} orientation - 方向（heading/pitch/roll）
     * @param {Object} options - 飞行选项
     */
    flyToPosition(position, orientation = {}, options = {}) {
        const destination = position.x !== undefined ? 
            new Cesium.Cartesian3(position.x, position.y, position.z) :
            cartesian3FromDegrees(position.lon || position.longitude, 
                                  position.lat || position.latitude, 
                                  position.alt || position.height);
        
        const flyOptions = {
            destination: destination,
            orientation: {
                heading: orientation.heading || this.camera.heading,
                pitch: orientation.pitch || this.camera.pitch,
                roll: orientation.roll || this.camera.roll,
            },
            duration: options.duration || this.options.defaultFlyDuration,
            easingFunction: options.easingFunction || EASING_FUNCTION_SINUSOIDAL_IN_OUT,
            complete: options.onComplete,
            cancel: options.onCancel,
        };
        
        this.camera.flyTo(flyOptions);
    }

    /**
     * 使用 lookAt 定位到目标
     * @param {Object} target - 目标位置（经纬度高）
     * @param {Object} offset - 相对偏移（heading/pitch/range）
     */
    lookAtTarget(target, offset = {}) {
        const center = cartesian3FromDegrees(
            target.lon || target.longitude,
            target.lat || target.latitude,
            target.alt || target.height || 0
        );
        
        const heading = offset.heading !== undefined ? 
            CESIUM_MATH.toRadians(offset.heading) : this.camera.heading;
        const pitch = offset.pitch !== undefined ? 
            CESIUM_MATH.toRadians(offset.pitch) : this.camera.pitch;
        const range = offset.range || 100;
        
        this.camera.lookAt(center, headingPitchRange(heading, pitch, range));
    }

    /**
     * 开始环绕动画
     * @param {Object} center - 环绕中心点（经纬度高）
     * @param {Object} options - 环绕选项
     */
    startOrbit(center, options = {}) {
        if (this.orbitState.isOrbiting) {
            this.stopOrbit();
        }
        
        this.orbitState.center = cartesian3FromDegrees(
            center.lon || center.longitude,
            center.lat || center.latitude,
            center.alt || center.height || 0
        );
        this.orbitState.radius = options.radius || 100;
        this.orbitState.speed = options.speed || 0.005;
        this.orbitState.startTime = Date.now();
        this.orbitState.stopCallback = options.onStop;
        this.orbitState.isOrbiting = true;
        
        // 添加动画监听
        this.viewer.clock.onTick.addEventListener(this._orbitTick);
    }

    /**
     * 环绕动画帧回调
     */
    _orbitTick = () => {
        if (!this.orbitState.isOrbiting) return;
        
        const elapsed = Date.now() - this.orbitState.startTime;
        const angle = elapsed * this.orbitState.speed;
        
        const offset = new Cesium.Cartesian3(
            Math.cos(angle) * this.orbitState.radius,
            Math.sin(angle) * this.orbitState.radius,
            this.orbitState.radius * 0.5
        );
        
        const newPosition = Cesium.Cartesian3.add(
            this.orbitState.center,
            offset,
            new Cesium.Cartesian3()
        );
        
        this.camera.setView({
            destination: newPosition,
            orientation: {
                heading: angle + Math.PI / 2,
                pitch: -Math.PI / 6,
                roll: 0
            }
        });
        
        this.camera.lookAt(this.orbitState.center);
    }

    /**
     * 停止环绕动画
     */
    stopOrbit() {
        if (this.orbitState.isOrbiting) {
            this.viewer.clock.onTick.removeEventListener(this._orbitTick);
            this.orbitState.isOrbiting = false;
            
            if (this.orbitState.stopCallback) {
                this.orbitState.stopCallback();
            }
        }
    }

    /**
     * 设置相机边界限制
     * @param {Object} bounds - 边界配置
     */
    setCameraBounds(bounds = {}) {
        const controller = this.scene.screenSpaceCameraController;
        
        if (bounds.minimumZoomDistance !== undefined) {
            controller.minimumZoomDistance = bounds.minimumZoomDistance;
        }
        
        if (bounds.maximumZoomDistance !== undefined) {
            controller.maximumZoomDistance = bounds.maximumZoomDistance;
        }
        
        // 添加俯仰角限制监听
        if (this.options.limitPitch && (bounds.minimumPitch !== undefined || bounds.maximumPitch !== undefined)) {
            this.options.minimumPitch = bounds.minimumPitch || this.options.minimumPitch;
            this.options.maximumPitch = bounds.maximumPitch || this.options.maximumPitch;
            
            this.viewer.camera.changed.addEventListener(this._enforcePitchLimits);
        }
    }

    /**
     * 强制俯仰角限制
     */
    _enforcePitchLimits = () => {
        const pitch = this.camera.pitch;
        let clampedPitch = pitch;
        
        if (pitch < this.options.minimumPitch) {
            clampedPitch = this.options.minimumPitch;
        } else if (pitch > this.options.maximumPitch) {
            clampedPitch = this.options.maximumPitch;
        }
        
        if (clampedPitch !== pitch) {
            this.camera.setView({
                orientation: {
                    heading: this.camera.heading,
                    pitch: clampedPitch,
                    roll: this.camera.roll
                }
            });
        }
    }

    /**
     * 获取当前相机状态
     * @returns {Object} 相机状态
     */
    getCurrentState() {
        const position = this.camera.position;
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        
        return {
            position: {
                x: position.x,
                y: position.y,
                z: position.z,
            },
            lonLatAlt: {
                longitude: Cesium.Math.toDegrees(cartographic.longitude),
                latitude: Cesium.Math.toDegrees(cartographic.latitude),
                height: cartographic.height,
            },
            orientation: {
                heading: this.camera.heading,
                pitch: this.camera.pitch,
                roll: this.camera.roll,
            },
            frustum: {
                fov: this.camera.frustum.fov,
                near: this.camera.frustum.near,
                far: this.camera.frustum.far,
            }
        };
    }

    /**
     * 导出所有书签到 JSON
     * @returns {string} JSON 字符串
     */
    exportBookmarks() {
        const data = {
            defaultView: this.defaultView,
            bookmarks: Array.from(this.viewBookmarks.entries()).map(([name, bookmark]) => ({
                name,
                ...bookmark
            }))
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * 从 JSON 导入书签
     * @param {string} jsonString - JSON 字符串
     * @returns {boolean} 是否成功导入
     */
    importBookmarks(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.bookmarks) {
                data.bookmarks.forEach(item => {
                    const { name, ...bookmark } = item;
                    this.viewBookmarks.set(name, bookmark);
                });
            }
            
            if (data.defaultView && this.viewBookmarks.has(data.defaultView)) {
                this.defaultView = data.defaultView;
            }
            
            return true;
        } catch (e) {
            console.error('CameraSystem: 导入书签失败', e);
            return false;
        }
    }

    /**
     * 销毁资源
     */
    destroy() {
        this.stopOrbit();
        this.viewBookmarks.clear();
        this.viewer.camera.changed.removeEventListener(this._enforcePitchLimits);
    }
}

export default CameraSystem;
