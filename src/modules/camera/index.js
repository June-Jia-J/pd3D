import { isEmpty, deepClone, deepMerge } from '../../utils';
import { 
    cartesian3FromDegrees, 
    cesiumCartesian3, 
    CESIUM_MATH,
    cartographicFromCartesian 
} from '../../utils/cesiumUtils';

const DEFAULT_CAMERA_CONFIG = {
    minimumZoomDistance: 20,
    maximumZoomDistance: 5000,
    minimumPitch: -Math.PI / 2,
    maximumPitch: 0,
    nearClip: 1.0,
    farClip: 50000000.0,
    collisionDetectionRadius: 0,
};

const DEFAULT_VIEW_BOOKMARKS = {
    patrol: {
        name: '巡视视角',
        nameEn: 'Patrol View',
        description: '适合整体巡视观察',
        position: null,
    },
    detail: {
        name: '细节观察',
        nameEn: 'Detail View',
        description: '适合近距离观察细节',
        position: null,
    },
    top: {
        name: '俯视视角',
        nameEn: 'Top View',
        description: '从上方俯视场景',
        position: null,
    },
    front: {
        name: '正视视角',
        nameEn: 'Front View',
        description: '从正面观察场景',
        position: null,
    },
};

class CameraManager {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.camera = viewer.camera;
        
        this.config = deepMerge(DEFAULT_CAMERA_CONFIG, options.cameraConfig || {});
        this.bookmarks = deepClone(DEFAULT_VIEW_BOOKMARKS);
        this.customBookmarks = [];
        this.defaultPosition = null;
        this.isAnimating = false;
        this.orbitOptions = {
            enabled: false,
            target: null,
            speed: 0.005,
            axis: 'z',
        };
        
        this._initCameraControls();
    }

    _initCameraControls() {
        const controller = this.scene.screenSpaceCameraController;
        controller.minimumZoomDistance = this.config.minimumZoomDistance;
        controller.maximumZoomDistance = this.config.maximumZoomDistance;
        
        this.camera.frustum.near = this.config.nearClip;
        this.camera.frustum.far = this.config.farClip;
    }

    setCameraBounds(options = {}) {
        const config = deepMerge(this.config, options);
        const controller = this.scene.screenSpaceCameraController;
        
        if (config.minimumZoomDistance !== undefined) {
            controller.minimumZoomDistance = config.minimumZoomDistance;
        }
        if (config.maximumZoomDistance !== undefined) {
            controller.maximumZoomDistance = config.maximumZoomDistance;
        }
        if (config.minimumPitch !== undefined) {
            controller.constrainedPitch = config.minimumPitch;
        }
        if (config.nearClip !== undefined) {
            this.camera.frustum.near = config.nearClip;
        }
        
        this.config = config;
        return this;
    }

    setDefaultPosition(position) {
        this.defaultPosition = this._normalizePosition(position);
        
        if (this.defaultPosition) {
            this._generatePresetPositions(this.defaultPosition);
        }
        return this;
    }
    
    _generatePresetPositions(basePosition) {
        if (!basePosition || !basePosition.destination) return;
        
        const cartographic = cartographicFromCartesian(basePosition.destination);
        const lon = CESIUM_MATH.toDegrees(cartographic.longitude);
        const lat = CESIUM_MATH.toDegrees(cartographic.latitude);
        const baseAlt = cartographic.height;
        const baseHeading = basePosition.heading || 0;
        const basePitch = basePosition.pitch || CESIUM_MATH.toRadians(-30);
        
        this.bookmarks.patrol.position = {
            lon: lon,
            lat: lat,
            alt: baseAlt + 200,
            heading: CESIUM_MATH.toDegrees(baseHeading),
            pitch: -45,
            range: 800,
        };
        this.bookmarks.patrol.destination = cartesian3FromDegrees(lon, lat, baseAlt + 200);
        
        this.bookmarks.detail.position = {
            lon: lon,
            lat: lat,
            alt: baseAlt + 50,
            heading: CESIUM_MATH.toDegrees(baseHeading),
            pitch: -30,
            range: 200,
        };
        this.bookmarks.detail.destination = cartesian3FromDegrees(lon, lat, baseAlt + 50);
        
        this.bookmarks.top.position = {
            lon: lon,
            lat: lat,
            alt: baseAlt + 500,
            heading: 0,
            pitch: -89,
            range: 500,
        };
        this.bookmarks.top.destination = cartesian3FromDegrees(lon, lat, baseAlt + 500);
        
        this.bookmarks.front.position = {
            lon: lon,
            lat: lat,
            alt: baseAlt + 100,
            heading: CESIUM_MATH.toDegrees(baseHeading),
            pitch: -15,
            range: 300,
        };
        this.bookmarks.front.destination = cartesian3FromDegrees(lon, lat, baseAlt + 100);
        
        Object.keys(this.bookmarks).forEach(key => {
            const bookmark = this.bookmarks[key];
            if (bookmark.position) {
                bookmark.position = this._normalizePosition(bookmark.position);
            }
        });
    }

    _normalizePosition(position) {
        if (!position) return null;
        
        const normalized = { ...position };
        
        if (normalized.lon !== undefined && normalized.lat !== undefined) {
            normalized.destination = cartesian3FromDegrees(
                normalized.lon, 
                normalized.lat, 
                normalized.alt || 0
            );
        }
        
        if (normalized.heading !== undefined) {
            normalized.heading = CESIUM_MATH.toRadians(normalized.heading);
        }
        if (normalized.pitch !== undefined) {
            normalized.pitch = CESIUM_MATH.toRadians(normalized.pitch);
        }
        if (normalized.roll !== undefined) {
            normalized.roll = CESIUM_MATH.toRadians(normalized.roll);
        }
        
        return normalized;
    }

    getCurrentPosition() {
        const camera = this.camera;
        const cartographic = cartographicFromCartesian(camera.position);
        
        return {
            lon: CESIUM_MATH.toDegrees(cartographic.longitude),
            lat: CESIUM_MATH.toDegrees(cartographic.latitude),
            alt: cartographic.height,
            heading: CESIUM_MATH.toDegrees(camera.heading),
            pitch: CESIUM_MATH.toDegrees(camera.pitch),
            roll: CESIUM_MATH.toDegrees(camera.roll),
        };
    }

    saveBookmark(name, options = {}) {
        const currentPosition = this.getCurrentPosition();
        const bookmark = {
            id: name || `bookmark_${Date.now()}`,
            name: options.name || name,
            nameEn: options.nameEn || name,
            description: options.description || '',
            position: currentPosition,
            createdAt: Date.now(),
        };
        
        if (DEFAULT_VIEW_BOOKMARKS[name]) {
            this.bookmarks[name] = bookmark;
        } else {
            const existingIndex = this.customBookmarks.findIndex(b => b.id === name);
            if (existingIndex >= 0) {
                this.customBookmarks[existingIndex] = bookmark;
            } else {
                this.customBookmarks.push(bookmark);
            }
        }
        
        return bookmark;
    }

    getBookmark(name) {
        return this.bookmarks[name] || this.customBookmarks.find(b => b.id === name);
    }

    getAllBookmarks() {
        return {
            presets: this.bookmarks,
            custom: this.customBookmarks,
        };
    }

    deleteBookmark(name) {
        if (DEFAULT_VIEW_BOOKMARKS[name]) {
            this.bookmarks[name].position = null;
        } else {
            const index = this.customBookmarks.findIndex(b => b.id === name);
            if (index >= 0) {
                this.customBookmarks.splice(index, 1);
            }
        }
        return this;
    }

    flyTo(options = {}) {
        if (this.isAnimating) {
            this.cancelFlight();
        }
        
        const flyOptions = {
            duration: options.duration !== undefined ? options.duration : 1.5,
            easingFunction: options.easingFunction || Cesium.EasingFunction.CUBIC_IN_OUT,
            complete: options.complete || (() => {}),
            cancel: options.cancel || (() => {}),
        };
        
        if (options.bookmark) {
            const bookmark = this.getBookmark(options.bookmark);
            if (bookmark) {
                if (bookmark.destination) {
                    flyOptions.destination = bookmark.destination;
                } else if (bookmark.position) {
                    const pos = bookmark.position;
                    if (pos.destination) {
                        flyOptions.destination = pos.destination;
                    } else if (pos.lon !== undefined && pos.lat !== undefined) {
                        flyOptions.destination = cartesian3FromDegrees(pos.lon, pos.lat, pos.alt || 0);
                    }
                }
                if (bookmark.position && (bookmark.position.heading !== undefined || bookmark.position.pitch !== undefined)) {
                    flyOptions.orientation = {
                        heading: bookmark.position.heading !== undefined ? bookmark.position.heading : this.camera.heading,
                        pitch: bookmark.position.pitch !== undefined ? bookmark.position.pitch : this.camera.pitch,
                        roll: bookmark.position.roll !== undefined ? bookmark.position.roll : 0,
                    };
                }
            }
        }
        
        if (!flyOptions.destination && options.position) {
            const pos = this._normalizePosition(options.position);
            if (pos.destination) {
                flyOptions.destination = pos.destination;
            }
            if (pos.heading !== undefined || pos.pitch !== undefined || pos.roll !== undefined) {
                flyOptions.orientation = {
                    heading: pos.heading !== undefined ? pos.heading : this.camera.heading,
                    pitch: pos.pitch !== undefined ? pos.pitch : this.camera.pitch,
                    roll: pos.roll !== undefined ? pos.roll : this.camera.roll,
                };
            }
        } else if (!flyOptions.destination && options.destination) {
            flyOptions.destination = options.destination;
            if (options.orientation) {
                flyOptions.orientation = options.orientation;
            }
        }
        
        if (!flyOptions.destination) {
            console.warn('flyTo: No valid destination provided');
            return this;
        }
        
        this.isAnimating = true;
        const self = this;
        const originalComplete = flyOptions.complete;
        flyOptions.complete = function() {
            self.isAnimating = false;
            if (originalComplete) originalComplete();
        };
        
        this.camera.flyTo(flyOptions);
        return this;
    }

    flyToDefault(duration = 1.5) {
        if (this.defaultPosition) {
            return this.flyTo({ position: this.defaultPosition, duration });
        }
        return this;
    }

    flyToBookmark(name, duration = 1.5) {
        return this.flyTo({ bookmark: name, duration });
    }

    cancelFlight() {
        this.camera.cancelFlight();
        this.isAnimating = false;
        return this;
    }

    zoomIn(amount = 0.5) {
        this.camera.zoomIn(amount);
        return this;
    }

    zoomOut(amount = 0.5) {
        this.camera.zoomOut(amount);
        return this;
    }

    lookAt(target, options = {}) {
        const position = this._normalizePosition(target);
        if (!position.destination) return this;
        
        const heading = options.heading !== undefined ? CESIUM_MATH.toRadians(options.heading) : 0;
        const pitch = options.pitch !== undefined ? CESIUM_MATH.toRadians(options.pitch) : -Math.PI / 4;
        const range = options.range || 500;
        
        this.camera.lookAt(
            position.destination,
            new Cesium.HeadingPitchRange(heading, pitch, range)
        );
        
        return this;
    }

    unlockLookAt() {
        this.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        return this;
    }

    startOrbit(options = {}) {
        this.orbitOptions = {
            ...this.orbitOptions,
            ...options,
            enabled: true,
        };
        
        if (!this.orbitOptions.target) {
            this.orbitOptions.target = this.camera.position.clone();
        }
        
        this._orbitHandler = this._orbitHandler || this._createOrbitHandler();
        this.viewer.clock.onTick.addEventListener(this._orbitHandler);
        
        return this;
    }

    _createOrbitHandler() {
        const self = this;
        return function() {
            if (!self.orbitOptions.enabled) return;
            
            const speed = self.orbitOptions.speed;
            self.camera.rotateRight(speed);
        };
    }

    stopOrbit() {
        this.orbitOptions.enabled = false;
        if (this._orbitHandler) {
            this.viewer.clock.onTick.removeEventListener(this._orbitHandler);
        }
        return this;
    }

    toggleOrbit(options = {}) {
        if (this.orbitOptions.enabled) {
            return this.stopOrbit();
        } else {
            return this.startOrbit(options);
        }
    }

    setScenePresets(presets) {
        if (!isEmpty(presets)) {
            Object.keys(presets).forEach(key => {
                if (this.bookmarks[key]) {
                    this.bookmarks[key] = {
                        ...this.bookmarks[key],
                        ...presets[key],
                        position: this._normalizePosition(presets[key].position),
                    };
                }
            });
        }
        return this;
    }

    enableCollisionDetection(radius = 10) {
        this.config.collisionDetectionRadius = radius;
        return this;
    }

    disableCollisionDetection() {
        this.config.collisionDetectionRadius = 0;
        return this;
    }

    destroy() {
        this.stopOrbit();
        this.cancelFlight();
        this.bookmarks = null;
        this.customBookmarks = null;
        this.defaultPosition = null;
    }
}

export {
    CameraManager,
    DEFAULT_CAMERA_CONFIG,
    DEFAULT_VIEW_BOOKMARKS,
};

export default CameraManager;
