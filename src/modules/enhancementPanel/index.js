import { isEmpty } from '../../utils';

const PANEL_STYLES = `
    .enhancement-panel {
        position: absolute;
        top: 60px;
        right: 10px;
        width: 280px;
        background: rgba(13, 46, 90, 0.95);
        border: 1px solid rgba(24, 144, 255, 0.5);
        border-radius: 4px;
        color: #fff;
        font-size: 12px;
        z-index: 1000;
        max-height: 80vh;
        overflow-y: auto;
    }
    .enhancement-panel-header {
        padding: 10px 15px;
        background: rgba(24, 144, 255, 0.3);
        border-bottom: 1px solid rgba(24, 144, 255, 0.5);
        font-weight: bold;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .enhancement-panel-header:hover {
        background: rgba(24, 144, 255, 0.4);
    }
    .enhancement-panel-content {
        padding: 10px;
    }
    .enhancement-section {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .enhancement-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
    }
    .enhancement-section-title {
        font-weight: bold;
        margin-bottom: 8px;
        color: #1890ff;
        font-size: 13px;
    }
    .enhancement-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }
    .enhancement-label {
        color: rgba(255, 255, 255, 0.85);
    }
    .enhancement-btn {
        padding: 4px 10px;
        background: rgba(24, 144, 255, 0.8);
        border: none;
        border-radius: 3px;
        color: #fff;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
    }
    .enhancement-btn:hover {
        background: rgba(24, 144, 255, 1);
    }
    .enhancement-btn.active {
        background: rgba(82, 196, 26, 0.8);
    }
    .enhancement-btn-group {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
    }
    .enhancement-btn-sm {
        padding: 3px 8px;
        font-size: 10px;
    }
    .enhancement-select {
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(24, 144, 255, 0.5);
        border-radius: 3px;
        color: #fff;
        font-size: 11px;
        cursor: pointer;
    }
    .enhancement-select option {
        background: #0d2e5a;
    }
    .enhancement-slider {
        width: 100px;
        cursor: pointer;
    }
    .enhancement-checkbox {
        cursor: pointer;
    }
    .enhancement-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 10px 0;
    }
    .enhancement-info {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 4px;
    }
`;

class EnhancementPanel {
    constructor(controller, options = {}) {
        this.controller = controller;
        this.options = options;
        this.panelEl = null;
        this.isCollapsed = false;
        
        this._injectStyles();
        this._createPanel();
    }

    _injectStyles() {
        if (document.getElementById('enhancement-panel-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'enhancement-panel-styles';
        styleEl.textContent = PANEL_STYLES;
        document.head.appendChild(styleEl);
    }

    _createPanel() {
        this.panelEl = document.createElement('div');
        this.panelEl.className = 'enhancement-panel';
        this.panelEl.id = 'enhancement-panel';
        
        this.panelEl.innerHTML = `
            <div class="enhancement-panel-header">
                <span>增强功能面板</span>
                <span class="collapse-icon">▼</span>
            </div>
            <div class="enhancement-panel-content">
                ${this._renderCameraSection()}
                ${this._renderMaterialSection()}
                ${this._renderLightSection()}
            </div>
        `;
        
        this._bindEvents();
    }

    _renderCameraSection() {
        return `
            <div class="enhancement-section">
                <div class="enhancement-section-title">📷 相机与视角</div>
                <div class="enhancement-row">
                    <span class="enhancement-label">视角预设</span>
                    <div class="enhancement-btn-group">
                        <button class="enhancement-btn enhancement-btn-sm" data-action="viewPreset" data-preset="patrol">巡视</button>
                        <button class="enhancement-btn enhancement-btn-sm" data-action="viewPreset" data-preset="detail">细节</button>
                        <button class="enhancement-btn enhancement-btn-sm" data-action="viewPreset" data-preset="top">俯视</button>
                    </div>
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">相机操作</span>
                    <div class="enhancement-btn-group">
                        <button class="enhancement-btn enhancement-btn-sm" data-action="flyToDefault">回到默认</button>
                        <button class="enhancement-btn enhancement-btn-sm" data-action="toggleOrbit" id="orbitBtn">环绕</button>
                    </div>
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">保存当前视角</span>
                    <button class="enhancement-btn enhancement-btn-sm" data-action="saveBookmark">保存书签</button>
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">缩放边界</span>
                    <input type="range" class="enhancement-slider" id="zoomRange" min="10" max="100" value="50" data-action="zoomRange">
                </div>
                <div class="enhancement-info">最小视距: 20m | 最大视距: 5000m</div>
            </div>
        `;
    }

    _renderMaterialSection() {
        return `
            <div class="enhancement-section">
                <div class="enhancement-section-title">🎨 材质与状态</div>
                <div class="enhancement-row">
                    <span class="enhancement-label">状态效果</span>
                    <div class="enhancement-btn-group">
                        <button class="enhancement-btn enhancement-btn-sm" data-action="materialState" data-state="highlight">高亮</button>
                        <button class="enhancement-btn enhancement-btn-sm" data-action="materialState" data-state="warning">告警</button>
                        <button class="enhancement-btn enhancement-btn-sm" data-action="materialState" data-state="alarm">严重</button>
                    </div>
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">相别高亮</span>
                    <div class="enhancement-btn-group">
                        <button class="enhancement-btn enhancement-btn-sm" data-action="phaseHighlight" data-phase="A" style="background: rgba(255, 77, 79, 0.8);">A相</button>
                        <button class="enhancement-btn enhancement-btn-sm" data-action="phaseHighlight" data-phase="B" style="background: rgba(82, 196, 26, 0.8);">B相</button>
                        <button class="enhancement-btn enhancement-btn-sm" data-action="phaseHighlight" data-phase="C" style="background: rgba(22, 119, 255, 0.8);">C相</button>
                    </div>
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">颜色混合度</span>
                    <input type="range" class="enhancement-slider" id="blendAmount" min="0" max="100" value="50" data-action="blendAmount">
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">重置材质</span>
                    <button class="enhancement-btn enhancement-btn-sm" data-action="resetMaterial">重置</button>
                </div>
            </div>
        `;
    }

    _renderLightSection() {
        return `
            <div class="enhancement-section">
                <div class="enhancement-section-title">💡 场景光影</div>
                <div class="enhancement-row">
                    <span class="enhancement-label">光照预设</span>
                    <select class="enhancement-select" id="lightPreset" data-action="lightPreset">
                        <option value="day">日间模式</option>
                        <option value="evening">黄昏模式</option>
                        <option value="night">夜间模式</option>
                        <option value="indoor">室内模式</option>
                        <option value="inspection">检测模式</option>
                    </select>
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">光照强度</span>
                    <input type="range" class="enhancement-slider" id="lightIntensity" min="0" max="200" value="100" data-action="lightIntensity">
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">启用阴影</span>
                    <input type="checkbox" class="enhancement-checkbox" id="shadowEnabled" data-action="toggleShadow">
                </div>
                <div class="enhancement-row">
                    <span class="enhancement-label">阴影暗度</span>
                    <input type="range" class="enhancement-slider" id="shadowDarkness" min="0" max="100" value="30" data-action="shadowDarkness">
                </div>
                <div class="enhancement-info">注意: 阴影可能影响透明背景截图效果</div>
            </div>
        `;
    }

    _bindEvents() {
        const header = this.panelEl.querySelector('.enhancement-panel-header');
        header.addEventListener('click', () => this.toggleCollapse());
        
        this.panelEl.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', (e) => this._handleAction(e));
            el.addEventListener('change', (e) => this._handleAction(e));
        });
    }

    _handleAction(e) {
        const el = e.currentTarget;
        const action = el.dataset.action;
        const value = el.dataset.preset || el.dataset.state || el.dataset.phase || el.value;
        
        const cameraManager = this.controller.getCameraManager();
        const materialManager = this.controller.getMaterialManager();
        const lightManager = this.controller.getLightManager();
        
        switch (action) {
            case 'viewPreset':
                if (cameraManager) {
                    cameraManager.flyToBookmark(value);
                } else {
                    console.warn('CameraManager not initialized');
                }
                break;
            case 'flyToDefault':
                if (cameraManager) {
                    cameraManager.flyToDefault();
                } else {
                    console.warn('CameraManager not initialized');
                }
                break;
            case 'toggleOrbit':
                if (cameraManager) {
                    cameraManager.toggleOrbit();
                    el.classList.toggle('active');
                }
                break;
            case 'saveBookmark':
                if (cameraManager) {
                    const name = prompt('请输入书签名称:', `书签_${Date.now()}`);
                    if (name) {
                        cameraManager.saveBookmark(name, { name });
                        alert(`视角书签 "${name}" 已保存`);
                    }
                }
                break;
            case 'zoomRange':
                if (cameraManager) {
                    const val = parseInt(value);
                    const minZoom = 10 + val * 2;
                    const maxZoom = 1000 + val * 40;
                    cameraManager.setCameraBounds({
                        minimumZoomDistance: minZoom,
                        maximumZoomDistance: maxZoom,
                    });
                }
                break;
            case 'materialState':
                if (materialManager) {
                    this._applyMaterialState(value);
                } else {
                    console.warn('MaterialManager not initialized');
                }
                break;
            case 'phaseHighlight':
                if (materialManager) {
                    this._applyPhaseHighlight(value);
                } else {
                    console.warn('MaterialManager not initialized');
                }
                break;
            case 'blendAmount':
                if (materialManager) {
                    materialManager.colorBlendAmount = parseInt(value) / 100;
                    this._updateAllModelsBlend();
                }
                break;
            case 'resetMaterial':
                if (materialManager) {
                    this._resetAllMaterials();
                }
                break;
            case 'lightPreset':
                if (lightManager) {
                    lightManager.applyPreset(value);
                } else {
                    console.warn('LightManager not initialized');
                }
                break;
            case 'lightIntensity':
                if (lightManager) {
                    lightManager.setLightIntensity(parseInt(value) / 100);
                }
                break;
            case 'toggleShadow':
                if (lightManager) {
                    lightManager.toggleShadows();
                }
                break;
            case 'shadowDarkness':
                if (lightManager) {
                    lightManager.setShadowDarkness(parseInt(value) / 100);
                }
                break;
        }
    }
    
    _getModels() {
        const viewer = this.controller.viewer;
        if (!viewer || !viewer.scene) return [];
        
        const models = [];
        const primitives = viewer.scene.primitives;
        for (let i = 0; i < primitives.length; i++) {
            const primitive = primitives.get(i);
            if (primitive && (primitive instanceof Cesium.Model || primitive.constructor.name === 'Model')) {
                models.push(primitive);
            }
        }
        return models;
    }
    
    _applyMaterialState(state) {
        const materialManager = this.controller.getMaterialManager();
        const models = this._getModels();
        
        if (models.length === 0) {
            console.warn('No models found in scene');
            return;
        }
        
        models.forEach(model => {
            switch (state) {
                case 'highlight':
                    materialManager.highlightModel(model);
                    break;
                case 'warning':
                    materialManager.setAlarmState(model, 1);
                    break;
                case 'alarm':
                    materialManager.setAlarmState(model, 2);
                    break;
            }
        });
    }
    
    _applyPhaseHighlight(phase) {
        const materialManager = this.controller.getMaterialManager();
        const models = this._getModels();
        
        if (models.length === 0) {
            console.warn('No models found in scene');
            return;
        }
        
        models.forEach(model => {
            materialManager.setPhaseHighlight(model, phase);
        });
    }
    
    _updateAllModelsBlend() {
        const materialManager = this.controller.getMaterialManager();
        const models = this._getModels();
        
        models.forEach(model => {
            if (model.color) {
                model.colorBlendAmount = materialManager.colorBlendAmount;
            }
        });
    }
    
    _resetAllMaterials() {
        const materialManager = this.controller.getMaterialManager();
        const models = this._getModels();
        
        models.forEach(model => {
            materialManager.resetModelState(model);
        });
    }

    toggleCollapse() {
        const content = this.panelEl.querySelector('.enhancement-panel-content');
        const icon = this.panelEl.querySelector('.collapse-icon');
        
        this.isCollapsed = !this.isCollapsed;
        content.style.display = this.isCollapsed ? 'none' : 'block';
        icon.textContent = this.isCollapsed ? '▶' : '▼';
    }

    show() {
        if (this.panelEl) {
            this.panelEl.style.display = 'block';
        }
        return this;
    }

    hide() {
        if (this.panelEl) {
            this.panelEl.style.display = 'none';
        }
        return this;
    }

    toggle() {
        if (this.panelEl) {
            this.panelEl.style.display = this.panelEl.style.display === 'none' ? 'block' : 'none';
        }
        return this;
    }

    appendTo(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (container) {
            container.appendChild(this.panelEl);
        }
        return this;
    }

    destroy() {
        if (this.panelEl && this.panelEl.parentNode) {
            this.panelEl.parentNode.removeChild(this.panelEl);
        }
        this.panelEl = null;
    }
}

export default EnhancementPanel;
