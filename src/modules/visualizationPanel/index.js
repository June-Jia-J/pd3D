import CameraSystem from '../cameraSystem';
import MaterialSystem from '../materialSystem';
import LightingSystem from '../lightingSystem';
import { isEmpty, deepClone } from '../../utils';

/**
 * 可视化与交互增强面板
 * 整合相机、材质、光影三大系统，提供统一的 UI 控制接口
 */
class VisualizationPanel {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.options = {
            container: null, // 自定义容器，否则创建浮动面板
            position: 'right', // 'left' | 'right' | 'top' | 'bottom'
            width: '320px',
            collapsed: false,
            ...options
        };
        
        // 初始化三大系统
        this.cameraSystem = new CameraSystem(viewer, options.camera);
        this.materialSystem = new MaterialSystem(viewer, options.material);
        this.lightingSystem = new LightingSystem(viewer, options.lighting);
        
        // UI 元素引用
        this.panelElement = null;
        this.sections = {};
        
        // 当前选中的模型
        this.selectedModel = null;
        
        // 初始化 UI
        this._initUI();
    }

    /**
     * 初始化 UI
     */
    _initUI() {
        if (this.options.container) {
            this.panelElement = this.options.container;
        } else {
            this.panelElement = this._createFloatingPanel();
            document.body.appendChild(this.panelElement);
        }
        
        this._renderPanel();
        this._bindEvents();
    }

    /**
     * 创建浮动面板
     */
    _createFloatingPanel() {
        const panel = document.createElement('div');
        panel.className = 'pd3d-viz-panel';
        panel.style.cssText = `
            position: fixed;
            ${this.options.position === 'right' ? 'right: 20px;' : 'left: 20px;'}
            top: 80px;
            width: ${this.options.width};
            max-height: 80vh;
            background: rgba(13, 46, 90, 0.95);
            border: 1px solid rgba(64, 169, 255, 0.3);
            border-radius: 8px;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            z-index: 1000;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        `;
        return panel;
    }

    /**
     * 渲染面板内容
     */
    _renderPanel() {
        this.panelElement.innerHTML = `
            <div class="pd3d-viz-header" style="
                padding: 12px 16px;
                background: linear-gradient(90deg, rgba(24, 144, 255, 0.2), transparent);
                border-bottom: 1px solid rgba(64, 169, 255, 0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            ">
                <span style="font-weight: 600; font-size: 14px;">🔧 可视化控制面板</span>
                <span class="pd3d-viz-toggle" style="cursor: pointer; padding: 4px;">
                    ${this.options.collapsed ? '▶' : '▼'}
                </span>
            </div>
            <div class="pd3d-viz-content" style="
                max-height: calc(80vh - 50px);
                overflow-y: auto;
                ${this.options.collapsed ? 'display: none;' : ''}
            ">
                ${this._renderCameraSection()}
                ${this._renderMaterialSection()}
                ${this._renderLightingSection()}
            </div>
        `;
        
        this.sections.camera = this.panelElement.querySelector('.pd3d-camera-section');
        this.sections.material = this.panelElement.querySelector('.pd3d-material-section');
        this.sections.lighting = this.panelElement.querySelector('.pd3d-lighting-section');
    }

    /**
     * 渲染相机控制区
     */
    _renderCameraSection() {
        return `
            <div class="pd3d-section pd3d-camera-section" style="border-bottom: 1px solid rgba(64, 169, 255, 0.1);">
                <div class="pd3d-section-header" style="
                    padding: 10px 16px;
                    background: rgba(24, 144, 255, 0.1);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>📷 相机与视角</span>
                    <span class="section-toggle">▼</span>
                </div>
                <div class="pd3d-section-content" style="padding: 12px 16px;">
                    <!-- 视角书签 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">视角书签</label>
                        <div class="bookmark-list" style="
                            max-height: 100px;
                            overflow-y: auto;
                            background: rgba(0,0,0,0.2);
                            border-radius: 4px;
                            padding: 4px;
                            margin-bottom: 8px;
                        "></div>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" class="bookmark-name" placeholder="书签名称" style="
                                flex: 1;
                                padding: 6px 10px;
                                border: 1px solid rgba(64, 169, 255, 0.3);
                                border-radius: 4px;
                                background: rgba(0,0,0,0.2);
                                color: #fff;
                                font-size: 12px;
                            ">
                            <button class="btn-save-bookmark" style="
                                padding: 6px 12px;
                                background: #1890ff;
                                border: none;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 12px;
                            ">保存</button>
                        </div>
                    </div>
                    
                    <!-- 相机操作 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">相机操作</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <button class="btn-restore-default" style="
                                padding: 8px;
                                background: rgba(24, 144, 255, 0.2);
                                border: 1px solid rgba(24, 144, 255, 0.4);
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 12px;
                            ">🏠 恢复默认</button>
                            <button class="btn-start-orbit" style="
                                padding: 8px;
                                background: rgba(24, 144, 255, 0.2);
                                border: 1px solid rgba(24, 144, 255, 0.4);
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 12px;
                            ">🔄 环绕</button>
                        </div>
                    </div>
                    
                    <!-- 边界设置 -->
                    <div>
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">边界限制</label>
                        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 11px; width: 60px;">最小视距</span>
                            <input type="range" class="min-zoom" min="5" max="100" value="20" style="flex: 1;">
                            <span class="min-zoom-value" style="font-size: 11px; width: 30px;">20</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="font-size: 11px; width: 60px;">最大视距</span>
                            <input type="range" class="max-zoom" min="1000" max="10000" value="5000" style="flex: 1;">
                            <span class="max-zoom-value" style="font-size: 11px; width: 40px;">5000</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染材质控制区
     */
    _renderMaterialSection() {
        return `
            <div class="pd3d-section pd3d-material-section" style="border-bottom: 1px solid rgba(64, 169, 255, 0.1);">
                <div class="pd3d-section-header" style="
                    padding: 10px 16px;
                    background: rgba(24, 144, 255, 0.1);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>🎨 材质与状态</span>
                    <span class="section-toggle">▼</span>
                </div>
                <div class="pd3d-section-content" style="padding: 12px 16px;">
                    <!-- 状态高亮 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">状态高亮</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <button class="btn-status-selected" style="
                                padding: 6px;
                                background: rgba(24, 144, 255, 0.3);
                                border: 1px solid #1890ff;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">✓ 选中</button>
                            <button class="btn-status-alarm" style="
                                padding: 6px;
                                background: rgba(245, 34, 45, 0.3);
                                border: 1px solid #f5222d;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">⚠ 告警</button>
                            <button class="btn-status-warning" style="
                                padding: 6px;
                                background: rgba(250, 173, 20, 0.3);
                                border: 1px solid #faad14;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">⚡ 警告</button>
                            <button class="btn-status-offline" style="
                                padding: 6px;
                                background: rgba(118, 121, 125, 0.3);
                                border: 1px solid #76797d;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">⚫ 离线</button>
                        </div>
                    </div>
                    
                    <!-- 相别高亮 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">相别高亮</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                            <button class="btn-phase-a" style="
                                padding: 6px;
                                background: rgba(255, 235, 59, 0.3);
                                border: 1px solid #ffeb3b;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">A相</button>
                            <button class="btn-phase-b" style="
                                padding: 6px;
                                background: rgba(76, 175, 80, 0.3);
                                border: 1px solid #4caf50;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">B相</button>
                            <button class="btn-phase-c" style="
                                padding: 6px;
                                background: rgba(244, 67, 54, 0.3);
                                border: 1px solid #f44336;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">C相</button>
                        </div>
                    </div>
                    
                    <!-- PBR 参数 -->
                    <div>
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">
                            PBR 参数
                            <span class="pbr-support" style="font-size: 10px; color: #52c41a;"></span>
                        </label>
                        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 11px; width: 50px;">金属度</span>
                            <input type="range" class="pbr-metallic" min="0" max="100" value="50" style="flex: 1;">
                            <span class="pbr-metallic-value" style="font-size: 11px; width: 30px;">0.5</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="font-size: 11px; width: 50px;">粗糙度</span>
                            <input type="range" class="pbr-roughness" min="0" max="100" value="50" style="flex: 1;">
                            <span class="pbr-roughness-value" style="font-size: 11px; width: 30px;">0.5</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染光影控制区
     */
    _renderLightingSection() {
        return `
            <div class="pd3d-section pd3d-lighting-section">
                <div class="pd3d-section-header" style="
                    padding: 10px 16px;
                    background: rgba(24, 144, 255, 0.1);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>💡 场景光影</span>
                    <span class="section-toggle">▼</span>
                </div>
                <div class="pd3d-section-content" style="padding: 12px 16px;">
                    <!-- 灯光开关 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">灯光控制</label>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" class="toggle-directional" checked style="cursor: pointer;">
                                <span style="font-size: 12px;">主方向光</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" class="toggle-ambient" checked style="cursor: pointer;">
                                <span style="font-size: 12px;">环境光</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" class="toggle-shadows" style="cursor: pointer;">
                                <span style="font-size: 12px;">阴影 (性能消耗)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" class="toggle-hdr" style="cursor: pointer;">
                                <span style="font-size: 12px;">HDR</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- 灯光强度 -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">灯光强度</label>
                        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 11px; width: 50px;">方向光</span>
                            <input type="range" class="dir-light-intensity" min="0" max="200" value="100" style="flex: 1;">
                            <span class="dir-light-value" style="font-size: 11px; width: 30px;">1.0</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="font-size: 11px; width: 50px;">环境光</span>
                            <input type="range" class="amb-light-intensity" min="0" max="100" value="40" style="flex: 1;">
                            <span class="amb-light-value" style="font-size: 11px; width: 30px;">0.4</span>
                        </div>
                    </div>
                    
                    <!-- 背景设置 -->
                    <div>
                        <label style="display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7);">背景设置</label>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-bg-transparent" style="
                                flex: 1;
                                padding: 6px;
                                background: rgba(24, 144, 255, 0.2);
                                border: 1px solid rgba(24, 144, 255, 0.4);
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">透明</button>
                            <button class="btn-bg-dark" style="
                                flex: 1;
                                padding: 6px;
                                background: rgba(0, 0, 0, 0.3);
                                border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 11px;
                            ">深色</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        // 面板折叠
        const header = this.panelElement.querySelector('.pd3d-viz-header');
        const toggle = this.panelElement.querySelector('.pd3d-viz-toggle');
        const content = this.panelElement.querySelector('.pd3d-viz-content');
        
        header.addEventListener('click', () => {
            this.options.collapsed = !this.options.collapsed;
            content.style.display = this.options.collapsed ? 'none' : 'block';
            toggle.textContent = this.options.collapsed ? '▶' : '▼';
        });
        
        // 区域折叠
        this.panelElement.querySelectorAll('.pd3d-section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.pd3d-viz-header')) return;
                const content = header.nextElementSibling;
                const toggle = header.querySelector('.section-toggle');
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                toggle.textContent = isHidden ? '▼' : '▶';
            });
        });
        
        this._bindCameraEvents();
        this._bindMaterialEvents();
        this._bindLightingEvents();
    }

    /**
     * 绑定相机事件
     */
    _bindCameraEvents() {
        // 保存书签
        const saveBtn = this.panelElement.querySelector('.btn-save-bookmark');
        const nameInput = this.panelElement.querySelector('.bookmark-name');
        
        saveBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name) {
                this.cameraSystem.saveBookmark(name, { type: 'user' });
                this._updateBookmarkList();
                nameInput.value = '';
            }
        });
        
        // 恢复默认
        this.panelElement.querySelector('.btn-restore-default').addEventListener('click', () => {
            this.cameraSystem.restoreDefaultView({ duration: 1.5 });
        });
        
        // 环绕
        let isOrbiting = false;
        this.panelElement.querySelector('.btn-start-orbit').addEventListener('click', (e) => {
            if (isOrbiting) {
                this.cameraSystem.stopOrbit();
                e.target.textContent = '🔄 环绕';
                isOrbiting = false;
            } else {
                const center = { longitude: 0, latitude: 0, height: 0 };
                this.cameraSystem.startOrbit(center, { radius: 100, speed: 0.005 });
                e.target.textContent = '⏹ 停止';
                isOrbiting = true;
            }
        });
        
        // 边界滑块
        const minZoom = this.panelElement.querySelector('.min-zoom');
        const maxZoom = this.panelElement.querySelector('.max-zoom');
        
        minZoom.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.panelElement.querySelector('.min-zoom-value').textContent = value;
            this.cameraSystem.setCameraBounds({ minimumZoomDistance: value });
        });
        
        maxZoom.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.panelElement.querySelector('.max-zoom-value').textContent = value;
            this.cameraSystem.setCameraBounds({ maximumZoomDistance: value });
        });
    }

    /**
     * 绑定材质事件
     */
    _bindMaterialEvents() {
        // 状态高亮按钮
        const statusMap = {
            '.btn-status-selected': 'selected',
            '.btn-status-alarm': 'alarm',
            '.btn-status-warning': 'warning',
            '.btn-status-offline': 'offline'
        };
        
        Object.entries(statusMap).forEach(([selector, status]) => {
            const btn = this.panelElement.querySelector(selector);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.selectedModel) {
                        if (status === 'selected') {
                            this.materialSystem.setSelectedHighlight(this.selectedModel);
                        } else {
                            this.materialSystem.setAlarmHighlight(this.selectedModel, status);
                        }
                    }
                });
            }
        });
        
        // 相别高亮按钮
        const phaseMap = {
            '.btn-phase-a': 'A',
            '.btn-phase-b': 'B',
            '.btn-phase-c': 'C'
        };
        
        Object.entries(phaseMap).forEach(([selector, phase]) => {
            const btn = this.panelElement.querySelector(selector);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.selectedModel) {
                        this.materialSystem.setPhaseHighlight(this.selectedModel, phase);
                    }
                });
            }
        });
        
        // PBR 滑块
        const metallicSlider = this.panelElement.querySelector('.pbr-metallic');
        const roughnessSlider = this.panelElement.querySelector('.pbr-roughness');
        
        metallicSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            this.panelElement.querySelector('.pbr-metallic-value').textContent = value.toFixed(1);
            if (this.selectedModel) {
                this.materialSystem.adjustPBRParams(this.selectedModel, { metallic: value });
            }
        });
        
        roughnessSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            this.panelElement.querySelector('.pbr-roughness-value').textContent = value.toFixed(1);
            if (this.selectedModel) {
                this.materialSystem.adjustPBRParams(this.selectedModel, { roughness: value });
            }
        });
    }

    /**
     * 绑定光影事件
     */
    _bindLightingEvents() {
        // 灯光开关
        this.panelElement.querySelector('.toggle-directional').addEventListener('change', (e) => {
            this.lightingSystem.setDirectionalLight({ enabled: e.target.checked });
        });
        
        this.panelElement.querySelector('.toggle-ambient').addEventListener('change', (e) => {
            this.lightingSystem.setAmbientLight({ enabled: e.target.checked });
        });
        
        this.panelElement.querySelector('.toggle-shadows').addEventListener('change', (e) => {
            this.lightingSystem.setShadows(e.target.checked);
        });
        
        this.panelElement.querySelector('.toggle-hdr').addEventListener('change', (e) => {
            this.lightingSystem.setHDR(e.target.checked);
        });
        
        // 强度滑块
        const dirIntensity = this.panelElement.querySelector('.dir-light-intensity');
        const ambIntensity = this.panelElement.querySelector('.amb-light-intensity');
        
        dirIntensity.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            this.panelElement.querySelector('.dir-light-value').textContent = value.toFixed(1);
            this.lightingSystem.setDirectionalLight({ intensity: value });
        });
        
        ambIntensity.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            this.panelElement.querySelector('.amb-light-value').textContent = value.toFixed(1);
            this.lightingSystem.setAmbientLight({ intensity: value });
        });
        
        // 背景按钮
        this.panelElement.querySelector('.btn-bg-transparent').addEventListener('click', () => {
            this.lightingSystem.setTransparentBackground(true);
        });
        
        this.panelElement.querySelector('.btn-bg-dark').addEventListener('click', () => {
            this.lightingSystem.setTransparentBackground(false, {
                backgroundColor: new Cesium.Color(0.05, 0.18, 0.35, 1.0)
            });
        });
    }

    /**
     * 更新书签列表
     */
    _updateBookmarkList() {
        const list = this.panelElement.querySelector('.bookmark-list');
        const bookmarks = this.cameraSystem.getBookmarks();
        
        if (bookmarks.length === 0) {
            list.innerHTML = '<div style="color: rgba(255,255,255,0.4); font-size: 11px; padding: 8px;">暂无书签</div>';
            return;
        }
        
        list.innerHTML = bookmarks.map(bm => `
            <div class="bookmark-item" data-name="${bm.name}" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 8px;
                margin-bottom: 4px;
                background: rgba(255,255,255,0.05);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">
                <span>${bm.name}</span>
                <span class="delete-bookmark" style="color: #f5222d; cursor: pointer; padding: 2px 4px;">×</span>
            </div>
        `).join('');
        
        // 绑定书签点击事件
        list.querySelectorAll('.bookmark-item').forEach(item => {
            const name = item.dataset.name;
            
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-bookmark')) {
                    this.cameraSystem.deleteBookmark(name);
                    this._updateBookmarkList();
                } else {
                    this.cameraSystem.loadBookmark(name);
                }
            });
        });
    }

    /**
     * 设置当前选中的模型
     * @param {Cesium.Model} model - 模型实例
     */
    setSelectedModel(model) {
        this.selectedModel = model;
        
        // 更新 PBR 支持状态显示
        const pbrSupport = this.panelElement.querySelector('.pbr-support');
        if (pbrSupport && model) {
            const supported = this.materialSystem.isPBRSupported(model);
            pbrSupport.textContent = supported ? '(支持 PBR)' : '(不支持 PBR)';
            pbrSupport.style.color = supported ? '#52c41a' : '#faad14';
        }
    }

    /**
     * 显示/隐藏面板
     * @param {boolean} visible - 是否可见
     */
    setVisible(visible) {
        this.panelElement.style.display = visible ? 'block' : 'none';
    }

    /**
     * 销毁面板
     */
    destroy() {
        this.cameraSystem.destroy();
        this.materialSystem.destroy && this.materialSystem.destroy();
        this.lightingSystem.destroy();
        
        if (this.panelElement && this.panelElement.parentNode) {
            this.panelElement.parentNode.removeChild(this.panelElement);
        }
    }
}

export default VisualizationPanel;
