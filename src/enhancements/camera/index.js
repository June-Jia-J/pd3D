import { ENHANCEMENT_CONFIG, mergeConfig } from '../config';
import {
    cartesian3FromDegrees,
    headingPitchRange,
    CESIUM_MATH,
    EASING_FUNCTION_SINUSOIDAL_IN_OUT,
} from '../../utils/cesiumUtils';
import { isEmpty, deepClone } from '../../utils';

class CameraEnhancement {
    constructor(viewer, userConfig = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.camera = viewer.camera;
        this.config = mergeConfig(ENHANCEMENT_CONFIG.camera, userConfig);
        
        // 视角书签存储
        this.bookmarks = {};
        
        // 动画状态
        this.isAnimating = false;
        
        // 初始化
        this._init();
    }

    // 初始化相机约束
    _init() {
        // 诊断模式：不进行任何相机参数修改，仅使用原有设置
        // 避免干扰原有渲染逻辑导致模型消失
        console.log('Camera enhancement: minimal initialization for compatibility');
        
        // 添加相机变化监听，防止穿模（已禁用）
        // this._addCameraConstraints();
    }

    // 添加相机约束，防止穿模
    _addCameraConstraints() {
        // 暂时禁用相机约束，防止干扰模型显示
        // 后续可以在确认场景类型后再选择性启用
        console.log('Camera constraints disabled for compatibility');
    }

    // 飞向指定位置
    flyTo(position, duration = null, options = {}) {
        if (isEmpty(position)) return Promise.reject(new Error('Position is required'));
        
        const animationDuration = duration !== null ? duration : this.config.defaultAnimationDuration;
        
        return new Promise((resolve, reject) => {
            try {
                const destination = position.lon !== undefined 
                    ? cartesian3FromDegrees(position.lon, position.lat, position.alt)
                    : Cesium.Cartesian3.fromArray([position.x, position.y, position.z]);

                this.isAnimating = true;
                
                this.camera.flyTo({
                    destination,
                    duration: animationDuration,
                    orientation: {
                        heading: position.heading || 0,
                        pitch: position.pitch || -0.5,
                        roll: position.roll || 0,
                    },
                    easingFunction: options.easingFunction || EASING_FUNCTION_SINUSOIDAL_IN_OUT,
                    complete: () => {
                        this.isAnimating = false;
                        resolve();
                    },
                    cancel: () => {
                        this.isAnimating = false;
                        reject(new Error('Flight cancelled'));
                    },
                });
            } catch (error) {
                this.isAnimating = false;
                reject(error);
            }
        });
    }

    // 飞向目标实体
    flyToEntity(entity, offset = {}, duration = null) {
        if (!entity) return Promise.reject(new Error('Entity is required'));
        
        const animationDuration = duration !== null ? duration : this.config.defaultAnimationDuration;
        
        return new Promise((resolve, reject) => {
            try {
                this.isAnimating = true;
                
                this.viewer.flyTo(entity, {
                    duration: animationDuration,
                    offset: new Cesium.HeadingPitchRange(
                        offset.heading || 0,
                        offset.pitch || -0.785,
                        offset.range || 500
                    ),
                    complete: () => {
                        this.isAnimating = false;
                        resolve();
                    },
                    cancel: () => {
                        this.isAnimating = false;
                        reject(new Error('Flight cancelled'));
                    },
                });
            } catch (error) {
                this.isAnimating = false;
                reject(error);
            }
        });
    }

    // 飞向模型中心点
    flyToModelCenter(model, offset = {}, duration = null) {
        if (!model) return Promise.reject(new Error('Model is required'));
        
        const animationDuration = duration !== null ? duration : this.config.defaultAnimationDuration;
        const defaultOffset = { heading: 0, pitch: -0.785, range: 500 };
        const finalOffset = { ...defaultOffset, ...offset };
        
        return new Promise((resolve, reject) => {
            try {
                this.isAnimating = true;
                
                // 获取模型边界球
                const boundingSphere = model.boundingSphere;
                if (!boundingSphere) {
                    this.isAnimating = false;
                    reject(new Error('Model bounding sphere not available'));
                    return;
                }
                
                // 计算相机位置
                const center = boundingSphere.center;
                const radius = boundingSphere.radius * 2;
                const range = finalOffset.range || radius;
                
                this.camera.flyToBoundingSphere(boundingSphere, {
                    duration: animationDuration,
                    offset: headingPitchRange(finalOffset.heading, finalOffset.pitch, range),
                    complete: () => {
                        this.isAnimating = false;
                        resolve();
                    },
                    cancel: () => {
                        this.isAnimating = false;
                        reject(new Error('Flight cancelled'));
                    },
                });
            } catch (error) {
                this.isAnimating = false;
                reject(error);
            }
        });
    }

    // 保存当前视角为书签
    saveBookmark(name, description = '') {
        if (!name) return null;
        
        const camera = this.camera;
        const position = camera.position;
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        
        const bookmark = {
            id: `bookmark_${Date.now()}`,
            name,
            description,
            timestamp: Date.now(),
            position: {
                x: position.x,
                y: position.y,
                z: position.z,
                lon: CESIUM_MATH.toDegrees(cartographic.longitude),
                lat: CESIUM_MATH.toDegrees(cartographic.latitude),
                alt: cartographic.height,
            },
            orientation: {
                heading: camera.heading,
                pitch: camera.pitch,
                roll: camera.roll,
            },
        };
        
        this.bookmarks[bookmark.id] = bookmark;
        return bookmark;
    }

    // 删除书签
    deleteBookmark(bookmarkId) {
        if (this.bookmarks[bookmarkId]) {
            delete this.bookmarks[bookmarkId];
            return true;
        }
        return false;
    }

    // 获取所有书签
    getBookmarks() {
        return Object.values(this.bookmarks);
    }

    // 飞向书签位置
    flyToBookmark(bookmarkId, duration = null) {
        const bookmark = this.bookmarks[bookmarkId];
        if (!bookmark) {
            return Promise.reject(new Error(`Bookmark ${bookmarkId} not found`));
        }
        
        const position = {
            x: bookmark.position.x,
            y: bookmark.position.y,
            z: bookmark.position.z,
            heading: bookmark.orientation.heading,
            pitch: bookmark.orientation.pitch,
            roll: bookmark.orientation.roll,
        };
        
        return this.flyTo(position, duration);
    }

    // 开始环绕旋转
    startOrbit(center, speed = null) {
        if (!center) return;
        
        const orbitSpeed = speed !== null ? speed : this.config.orbitSpeed;
        const centerCartesian = center.lon !== undefined
            ? cartesian3FromDegrees(center.lon, center.lat, center.alt || 0)
            : Cesium.Cartesian3.fromArray([center.x, center.y, center.z]);
        
        this._orbitCenter = centerCartesian;
        this._orbitSpeed = orbitSpeed;
        this._orbitRunning = true;
        
        const orbit = () => {
            if (!this._orbitRunning) return;
            
            this.camera.rotateAround(
                centerCartesian,
                Cesium.Cartesian3.UNIT_Z,
                CESIUM_MATH.toRadians(orbitSpeed * 0.1)
            );
            
            requestAnimationFrame(orbit);
        };
        
        orbit();
    }

    // 停止环绕
    stopOrbit() {
        this._orbitRunning = false;
    }

    // 缩放至指定距离
    zoomTo(distance, duration = null) {
        const animationDuration = duration !== null ? duration : this.config.defaultAnimationDuration;
        const direction = this.camera.direction;
        const currentPosition = this.camera.position;
        
        // 计算目标位置
        const currentDistance = Cesium.Cartesian3.magnitude(currentPosition);
        const scale = distance / currentDistance;
        
        const targetPosition = new Cesium.Cartesian3(
            currentPosition.x * scale,
            currentPosition.y * scale,
            currentPosition.z * scale
        );
        
        return this.flyTo(
            {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                heading: this.camera.heading,
                pitch: this.camera.pitch,
                roll: this.camera.roll,
            },
            animationDuration
        );
    }

    // 设置相机约束
    setConstraints(constraints) {
        const {
            minimumZoomDistance,
            maximumZoomDistance,
            nearClippingDistance,
            farClippingDistance,
        } = constraints;
        
        if (minimumZoomDistance !== undefined) {
            this.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
            this.config.minimumZoomDistance = minimumZoomDistance;
        }
        
        if (maximumZoomDistance !== undefined) {
            this.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
            this.config.maximumZoomDistance = maximumZoomDistance;
        }
        
        if (nearClippingDistance !== undefined) {
            this.camera.frustum.near = nearClippingDistance;
            this.config.nearClippingDistance = nearClippingDistance;
        }
        
        if (farClippingDistance !== undefined) {
            this.camera.frustum.far = farClippingDistance;
            this.config.farClippingDistance = farClippingDistance;
        }
    }

    // 获取当前相机状态
    getCameraState() {
        const camera = this.camera;
        const position = camera.position;
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        
        return {
            position: {
                x: position.x,
                y: position.y,
                z: position.z,
                lon: CESIUM_MATH.toDegrees(cartographic.longitude),
                lat: CESIUM_MATH.toDegrees(cartographic.latitude),
                alt: cartographic.height,
            },
            orientation: {
                heading: camera.heading,
                pitch: camera.pitch,
                roll: camera.roll,
            },
        };
    }

    // 重置视角到默认位置
    resetView(defaultPosition = null, duration = null) {
        const pos = defaultPosition || {
            lon: 0,
            lat: 0,
            alt: 1000,
            heading: 0,
            pitch: -0.785,
            roll: 0,
        };
        
        return this.flyTo(pos, duration);
    }

    // 销毁
    destroy() {
        this.stopOrbit();
        this.bookmarks = {};
    }
}

export default CameraEnhancement;

