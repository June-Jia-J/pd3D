import Pd3dEnhancements from './index';
import './ui/style.css';

// 增强功能集成工具
export function createEnhancements(viewer, config = {}) {
    return new Pd3dEnhancements(viewer, config);
}

// 为现有控制器添加增强功能
export function enhanceController(controller, config = {}) {
    if (!controller || !controller.viewer) {
        console.warn('Invalid controller or viewer not initialized');
        return null;
    }
    
    const enhancements = createEnhancements(controller.viewer, config);
    
    // 将增强对象挂载到控制器上
    controller.enhancements = enhancements;
    
    // 添加快捷方法
    controller.showEnhancementPanel = () => enhancements.showControlPanel();
    controller.hideEnhancementPanel = () => enhancements.hideControlPanel();
    
    // 添加视角预设快捷方法
    controller.applyViewPreset = (sceneType, presetName) => {
        return enhancements.applyViewPreset(sceneType, presetName);
    };
    
    // 添加场景模式切换
    controller.setSceneMode = (mode) => {
        enhancements.setSceneMode(mode);
    };
    
    // 添加快速高亮方法
    controller.highlightModel = (model, type = 'selected', customColor = null) => {
        return enhancements.material.highlightModel(model, type, customColor);
    };
    
    // 添加清除高亮
    controller.clearHighlights = () => {
        enhancements.material.clearAllHighlights();
    };
    
    return enhancements;
}

// 快速创建演示入口
export function createDemoToolbar(container, enhancements) {
    if (!container || !enhancements) return;
    
    const demoToolbar = document.createElement('div');
    demoToolbar.className = 'enhancement-demo-toolbar';
    demoToolbar.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 1000;
        background: rgba(20, 30, 50, 0.9);
        padding: 10px 20px;
        border-radius: 8px;
        border: 1px solid rgba(100, 150, 255, 0.3);
    `;
    
    // 控制面板开关
    const panelBtn = createDemoButton('控制面板', () => {
        const panel = enhancements._controlPanel;
        if (panel && panel.panelElement) {
            const isVisible = panel.panelElement.style.display !== 'none';
            if (isVisible) {
                panel.hide();
                panelBtn.textContent = '显示面板';
            } else {
                panel.show();
                panelBtn.textContent = '隐藏面板';
            }
        } else {
            enhancements.showControlPanel();
            panelBtn.textContent = '隐藏面板';
        }
    });
    
    // 视角预设快速切换
    const viewBtn = createDemoButton('巡视视角', () => {
        enhancements.applyViewPreset('monitor', 'patrol');
    });
    
    const detailBtn = createDemoButton('细节观察', () => {
        enhancements.applyViewPreset('monitor', 'detail');
    });
    
    // 场景模式
    const localStageBtn = createDemoButton('局部舞台', () => {
        enhancements.setSceneMode('local_stage');
    });
    
    const globalBtn = createDemoButton('全局模式', () => {
        enhancements.setSceneMode('global');
    });
    
    // 性能模式
    const performanceBtn = createDemoButton('性能模式', () => {
        enhancements.applyPerformanceMode();
    });
    
    const qualityBtn = createDemoButton('画质模式', () => {
        enhancements.applyQualityMode();
    });
    
    demoToolbar.appendChild(panelBtn);
    demoToolbar.appendChild(viewBtn);
    demoToolbar.appendChild(detailBtn);
    demoToolbar.appendChild(localStageBtn);
    demoToolbar.appendChild(globalBtn);
    demoToolbar.appendChild(performanceBtn);
    demoToolbar.appendChild(qualityBtn);
    
    container.appendChild(demoToolbar);
    
    return demoToolbar;
}

function createDemoButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
        padding: 8px 16px;
        background: linear-gradient(135deg, #1976d2, #42a5f5);
        border: none;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
    `;
    btn.onmouseover = () => {
        btn.style.background = 'linear-gradient(135deg, #1565c0, #1e88e5)';
        btn.style.transform = 'translateY(-2px)';
    };
    btn.onmouseout = () => {
        btn.style.background = 'linear-gradient(135deg, #1976d2, #42a5f5)';
        btn.style.transform = 'translateY(0)';
    };
    btn.onclick = onClick;
    return btn;
}

// 导出便捷使用的类型和枚举
export { 
    HIGHLIGHT_TYPES, 
    SCENE_MODES, 
    ENHANCEMENT_CONFIG 
} from './config';

