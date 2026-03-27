import { ENHANCEMENT_CONFIG, HIGHLIGHT_TYPES, SCENE_MODES } from '../config';
import { isEmpty, deepMerge, getToolbarId } from '../../utils';

class ControlPanel {
    constructor(viewer, enhancements, userConfig = {}) {
        this.viewer = viewer;
        this.enhancements = enhancements;
        this.config = deepMerge(ENHANCEMENT_CONFIG.ui, userConfig);
        
        this.cameraEnhancement = enhancements.camera;
        this.materialEnhancement = enhancements.material;
        this.lightingEnhancement = enhancements.lighting;
        
        this.panelElement = null;
        this.isExpanded = this.config.defaultExpanded;
        
        // 视角预设
        this.viewPresets = ENHANCEMENT_CONFIG.viewPresets;
        
        this._init();
    }

    _init() {
        this._createPanel();
        this._createPanelContent();
        this._bindEvents();
    }

    _createPanel() {
        // 创建面板容器
        this.panelElement = document.createElement('div');
        this.panelElement.id = 'enhancement-control-panel';
        this.panelElement.className = 'enhancement-panel';
        
        // 设置位置
        if (this.config.panelPosition === 'left') {
            this.panelElement.style.left = '1rem';
            this.panelElement.style.right = 'auto';
        } else {
            this.panelElement.style.right = '1rem';
            this.panelElement.style.left = 'auto';
        }
        
        // 添加切换按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'panel-toggle-btn';
        toggleBtn.innerHTML = this.isExpanded ? '◀' : '▶';
        toggleBtn.onclick = () => this._togglePanel();
        this.panelElement.appendChild(toggleBtn);
        
        // 创建内容容器
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'panel-content';
        this.contentContainer.style.display = this.isExpanded ? 'block' : 'none';
        this.panelElement.appendChild(this.contentContainer);
        
        // 添加到DOM
        const container = this.viewer._element.parentElement || document.body;
        container.appendChild(this.panelElement);
    }

    _createPanelContent() {
        const content = this.contentContainer;
        
        // 标题
        const title = document.createElement('h3');
        title.className = 'panel-title';
        title.textContent = '可视化增强控制面板';
        content.appendChild(title);
        
        // 创建各个模块
        this._createCameraSection(content);
        this._createMaterialSection(content);
        this._createLightingSection(content);
        this._createSceneSection(content);
    }

    // 相机控制部分
    _createCameraSection(container) {
        const section = this._createSection('相机与视角', 'camera-section');
        
        // 视角预设
        const presetGroup = this._createControlGroup('视角预设');
        const presetSelect = document.createElement('select');
        presetSelect.className = 'control-select';
        presetSelect.innerHTML = `
            <option value="">选择预设视角...</option>
            <optgroup label="监测场景">
                <option value="monitor.patrol">巡视视角</option>
                <option value="monitor.detail">细节观察</option>
                <option value="monitor.top">俯视图</option>
                <option value="monitor.front">主视图</option>
            </optgroup>
            <optgroup label="带电检测">
                <option value="detection.patrol">带电检测巡视</option>
                <option value="detection.detail">检测点特写</option>
            </optgroup>
        `;
        presetSelect.onchange = (e) => {
            if (e.target.value) {
                const [scene, preset] = e.target.value.split('.');
                const position = this.viewPresets[scene][preset].position;
                this.cameraEnhancement.flyTo(position, 1.5);
            }
        };
        presetGroup.appendChild(presetSelect);
        section.appendChild(presetGroup);
        
        // 书签管理
        const bookmarkGroup = this._createControlGroup('视角书签');
        const bookmarkInput = document.createElement('input');
        bookmarkInput.type = 'text';
        bookmarkInput.placeholder = '输入书签名称...';
        bookmarkInput.className = 'control-input';
        
        const saveBookmarkBtn = this._createButton('保存当前视角', () => {
            const name = bookmarkInput.value.trim() || `书签_${Date.now()}`;
            const bookmark = this.cameraEnhancement.saveBookmark(name);
            if (bookmark) {
                this._updateBookmarkList();
                bookmarkInput.value = '';
                alert(`书签 "${name}" 已保存`);
            }
        });
        
        bookmarkGroup.appendChild(bookmarkInput);
        bookmarkGroup.appendChild(saveBookmarkBtn);
        
        // 书签列表
        this.bookmarkList = document.createElement('div');
        this.bookmarkList.className = 'bookmark-list';
        bookmarkGroup.appendChild(this.bookmarkList);
        this._updateBookmarkList();
        
        section.appendChild(bookmarkGroup);
        
        // 环绕控制
        const orbitGroup = this._createControlGroup('环绕观察');
        const startOrbitBtn = this._createButton('开始环绕', () => {
            const center = { lon: 0, lat: 0, alt: 0 };
            this.cameraEnhancement.startOrbit(center, 1.0);
            startOrbitBtn.style.display = 'none';
            stopOrbitBtn.style.display = 'inline-block';
        });
        
        const stopOrbitBtn = this._createButton('停止环绕', () => {
            this.cameraEnhancement.stopOrbit();
            stopOrbitBtn.style.display = 'none';
            startOrbitBtn.style.display = 'inline-block';
        });
        stopOrbitBtn.style.display = 'none';
        
        orbitGroup.appendChild(startOrbitBtn);
        orbitGroup.appendChild(stopOrbitBtn);
        section.appendChild(orbitGroup);
        
        // 防穿模设置
        const clipGroup = this._createControlGroup('防穿模设置');
        const minDistanceLabel = document.createElement('label');
        minDistanceLabel.textContent = '最小视距: ';
        const minDistanceValue = document.createElement('span');
        minDistanceValue.textContent = '10m';
        const minDistanceSlider = this._createSlider(5, 50, 10, (value) => {
            minDistanceValue.textContent = `${value}m`;
            this.cameraEnhancement.setConstraints({ minimumZoomDistance: value });
        });
        clipGroup.appendChild(minDistanceLabel);
        clipGroup.appendChild(minDistanceValue);
        clipGroup.appendChild(minDistanceSlider);
        section.appendChild(clipGroup);
        
        container.appendChild(section);
    }

    // 材质控制部分
    _createMaterialSection(container) {
        const section = this._createSection('材质与高亮', 'material-section');
        
        // 高亮类型选择
        const highlightGroup = this._createControlGroup('高亮效果');
        const highlightTypeSelect = document.createElement('select');
        highlightTypeSelect.className = 'control-select';
        highlightTypeSelect.innerHTML = `
            <option value="${HIGHLIGHT_TYPES.SELECTED}">选中高亮</option>
            <option value="${HIGHLIGHT_TYPES.ALARM}">告警高亮</option>
            <option value="${HIGHLIGHT_TYPES.WARNING}">警告高亮</option>
        `;
        
        const highlightBtn = this._createButton('高亮选中对象', () => {
            // 获取当前选中的实体
            const selected = this.viewer.selectedEntity;
            if (selected && selected.model) {
                this.materialEnhancement.highlightModel(
                    selected.model,
                    highlightTypeSelect.value
                );
            } else {
                alert('请先选择一个模型');
            }
        });
        
        const clearHighlightBtn = this._createButton('清除高亮', () => {
            this.materialEnhancement.clearAllHighlights();
        }, 'secondary');
        
        highlightGroup.appendChild(highlightTypeSelect);
        highlightGroup.appendChild(highlightBtn);
        highlightGroup.appendChild(clearHighlightBtn);
        section.appendChild(highlightGroup);
        
        // PBR材质调整
        const pbrGroup = this._createControlGroup('PBR材质调整');
        
        // 金属度
        const metallicControl = this._createSliderControl(
            '金属度',
            0,
            1,
            0.5,
            0.01,
            (value) => {
                const selected = this.viewer.selectedEntity;
                if (selected && selected.model) {
                    this.materialEnhancement.modifyAllMaterials(selected.model, {
                        metallic: value,
                    });
                }
            }
        );
        pbrGroup.appendChild(metallicControl);
        
        // 粗糙度
        const roughnessControl = this._createSliderControl(
            '粗糙度',
            0,
            1,
            0.5,
            0.01,
            (value) => {
                const selected = this.viewer.selectedEntity;
                if (selected && selected.model) {
                    this.materialEnhancement.modifyAllMaterials(selected.model, {
                        roughness: value,
                    });
                }
            }
        );
        pbrGroup.appendChild(roughnessControl);
        
        // 自发光强度
        const emissiveControl = this._createSliderControl(
            '自发光强度',
            0,
            5,
            0,
            0.1,
            (value) => {
                const selected = this.viewer.selectedEntity;
                if (selected && selected.model) {
                    this.materialEnhancement.modifyAllMaterials(selected.model, {
                        emissiveIntensity: value,
                    });
                }
            }
        );
        pbrGroup.appendChild(emissiveControl);
        
        section.appendChild(pbrGroup);
        container.appendChild(section);
    }

    // 光照控制部分
    _createLightingSection(container) {
        const section = this._createSection('场景光照', 'lighting-section');
        
        // 主方向光
        const lightGroup = this._createControlGroup('主方向光');
        const lightToggle = this._createToggle('启用方向光', true, (checked) => {
            if (checked) {
                this.lightingEnhancement.enableDirectionalLight();
            } else {
                this.lightingEnhancement.disableDirectionalLight();
            }
        });
        lightGroup.appendChild(lightToggle);
        
        // 光照强度
        const lightIntensity = this._createSliderControl(
            '光照强度',
            0,
            3,
            1.5,
            0.1,
            (value) => {
                this.lightingEnhancement.setDirectionalLight({ intensity: value });
            }
        );
        lightGroup.appendChild(lightIntensity);
        section.appendChild(lightGroup);
        
        // 环境光
        const ambientGroup = this._createControlGroup('环境光');
        const ambientIntensity = this._createSliderControl(
            '环境光强度',
            0,
            2,
            0.4,
            0.1,
            (value) => {
                this.lightingEnhancement.setAmbientLight(
                    this.lightingEnhancement.config.ambientLight.color,
                    value
                );
            }
        );
        ambientGroup.appendChild(ambientIntensity);
        section.appendChild(ambientGroup);
        
        // IBL
        const iblGroup = this._createControlGroup('图像基础光照(IBL)');
        const iblToggle = this._createToggle('启用IBL', false, (checked) => {
            if (checked) {
                this.lightingEnhancement.enableIBL();
            } else {
                this.lightingEnhancement.disableIBL();
            }
        });
        iblGroup.appendChild(iblToggle);
        
        const iblPreset = document.createElement('select');
        iblPreset.className = 'control-select';
        iblPreset.innerHTML = `
            <option value="day">白天</option>
            <option value="sunset">日落</option>
            <option value="night">夜晚</option>
            <option value="cloudy">多云</option>
        `;
        iblPreset.onchange = (e) => {
            if (this.lightingEnhancement.state.ibl.enabled) {
                this.lightingEnhancement.enableIBL(null, e.target.value);
            }
        };
        iblGroup.appendChild(iblPreset);
        section.appendChild(iblGroup);
        
        // 阴影
        const shadowGroup = this._createControlGroup('阴影效果');
        const shadowToggle = this._createToggle('启用阴影', false, (checked) => {
            if (checked) {
                this.lightingEnhancement.enableShadows();
            } else {
                this.lightingEnhancement.disableShadows();
            }
        });
        shadowGroup.appendChild(shadowToggle);
        
        const shadowDarkness = this._createSliderControl(
            '阴影浓度',
            0.1,
            0.8,
            0.3,
            0.05,
            (value) => {
                if (this.lightingEnhancement.state.shadows.enabled) {
                    this.lightingEnhancement.setShadowParams({ darkness: value });
                }
            }
        );
        shadowGroup.appendChild(shadowDarkness);
        section.appendChild(shadowGroup);
        
        container.appendChild(section);
    }

    // 场景模式部分
    _createSceneSection(container) {
        const section = this._createSection('场景模式', 'scene-section');
        
        const modeGroup = this._createControlGroup('场景模式');
        const modeSelect = document.createElement('select');
        modeSelect.className = 'control-select';
        modeSelect.innerHTML = `
            <option value="${SCENE_MODES.GLOBAL}">全局模式</option>
            <option value="${SCENE_MODES.LOCAL_STAGE}" selected>局部舞台模式</option>
        `;
        modeSelect.onchange = (e) => {
            this.lightingEnhancement.setSceneMode(e.target.value);
        };
        modeGroup.appendChild(modeSelect);
        section.appendChild(modeGroup);
        
        // 兼容性信息
        const infoGroup = this._createControlGroup('系统信息');
        const infoBtn = this._createButton('显示性能信息', () => {
            const state = this.lightingEnhancement.getLightingState();
            alert(`
                纹理数量: ${state.performance.textureCount}
                内存预估: ${state.performance.memoryUsage.toFixed(1)}MB
                阴影启用: ${state.shadows.enabled ? '是' : '否'}
                IBL启用: ${state.ibl.enabled ? '是' : '否'}
                截图兼容: ${state.compatibility.screenshot.compatible ? '是' : '否'}
            `);
        });
        infoGroup.appendChild(infoBtn);
        section.appendChild(infoGroup);
        
        container.appendChild(section);
    }

    // 辅助方法：创建章节
    _createSection(title, id) {
        const section = document.createElement('div');
        section.id = id;
        section.className = 'panel-section';
        
        const header = document.createElement('div');
        header.className = 'section-header';
        header.textContent = title;
        header.onclick = () => {
            const content = section.querySelector('.section-content');
            if (content) {
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
        };
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        section.appendChild(header);
        section.appendChild(content);
        
        return section;
    }

    // 辅助方法：创建控制组
    _createControlGroup(label) {
        const group = document.createElement('div');
        group.className = 'control-group';
        
        if (label) {
            const labelEl = document.createElement('label');
            labelEl.className = 'control-label';
            labelEl.textContent = label;
            group.appendChild(labelEl);
        }
        
        return group;
    }

    // 辅助方法：创建按钮
    _createButton(text, onClick, style = 'primary') {
        const btn = document.createElement('button');
        btn.className = `control-btn control-btn-${style}`;
        btn.textContent = text;
        btn.onclick = onClick;
        return btn;
    }

    // 辅助方法：创建滑块
    _createSlider(min, max, value, step, onChange) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.step = step;
        slider.className = 'control-slider';
        slider.oninput = (e) => onChange(parseFloat(e.target.value));
        return slider;
    }

    // 辅助方法：创建带标签的滑块控制
    _createSliderControl(label, min, max, value, step, onChange) {
        const control = document.createElement('div');
        control.className = 'slider-control';
        
        const labelEl = document.createElement('span');
        labelEl.className = 'slider-label';
        labelEl.textContent = label;
        
        const valueEl = document.createElement('span');
        valueEl.className = 'slider-value';
        valueEl.textContent = value;
        
        const slider = this._createSlider(min, max, value, step, (newValue) => {
            valueEl.textContent = newValue.toFixed(step < 1 ? 2 : 0);
            onChange(newValue);
        });
        
        control.appendChild(labelEl);
        control.appendChild(valueEl);
        control.appendChild(slider);
        
        return control;
    }

    // 辅助方法：创建开关
    _createToggle(label, checked, onChange) {
        const toggle = document.createElement('label');
        toggle.className = 'toggle-control';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;
        checkbox.onchange = (e) => onChange(e.target.checked);
        
        const slider = document.createElement('span');
        slider.className = 'toggle-slider';
        
        toggle.appendChild(checkbox);
        toggle.appendChild(slider);
        toggle.appendChild(document.createTextNode(label));
        
        return toggle;
    }

    // 更新书签列表
    _updateBookmarkList() {
        const bookmarks = this.cameraEnhancement.getBookmarks();
        this.bookmarkList.innerHTML = '';
        
        bookmarks.forEach((bookmark) => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            
            const name = document.createElement('span');
            name.textContent = bookmark.name;
            name.title = bookmark.description;
            name.onclick = () => {
                this.cameraEnhancement.flyToBookmark(bookmark.id, 1.0);
            };
            
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'bookmark-delete';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.cameraEnhancement.deleteBookmark(bookmark.id);
                this._updateBookmarkList();
            };
            
            item.appendChild(name);
            item.appendChild(deleteBtn);
            this.bookmarkList.appendChild(item);
        });
    }

    // 切换面板展开/收起
    _togglePanel() {
        this.isExpanded = !this.isExpanded;
        this.contentContainer.style.display = this.isExpanded ? 'block' : 'none';
        const toggleBtn = this.panelElement.querySelector('.panel-toggle-btn');
        toggleBtn.innerHTML = this.isExpanded ? '◀' : '▶';
    }

    // 绑定事件
    _bindEvents() {
        // 可以在这里添加额外的事件绑定
    }

    // 显示面板
    show() {
        this.panelElement.style.display = 'block';
    }

    // 隐藏面板
    hide() {
        this.panelElement.style.display = 'none';
    }

    // 销毁
    destroy() {
        if (this.panelElement && this.panelElement.parentNode) {
            this.panelElement.parentNode.removeChild(this.panelElement);
        }
    }
}

export default ControlPanel;

