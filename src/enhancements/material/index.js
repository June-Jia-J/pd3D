import { ENHANCEMENT_CONFIG, mergeConfig, HIGHLIGHT_TYPES } from '../config';
import { isEmpty, deepClone } from '../../utils';
import {
    cesiumColorFromBytes,
    cesiumColor,
    cesiumColorfromAlpha,
} from '../../utils/cesiumUtils';

class MaterialEnhancement {
    constructor(viewer, userConfig = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.config = mergeConfig(ENHANCEMENT_CONFIG.material, userConfig);
        
        // 存储高亮状态
        this.highlightedObjects = new Map();
        
        // 存储材质修改
        this.modifiedMaterials = new Map();
        
        // 初始化
        this._init();
    }

    _init() {
        // 添加场景渲染后处理，用于实现自定义高亮效果
        this._setupPostProcessing();
    }

    _setupPostProcessing() {
        // 可以在此添加后处理效果，如轮廓高亮等
        // 目前使用Cesium内置的颜色混合模式
    }

    // 按节点名称高亮
    highlightNode(model, nodeName, highlightType = HIGHLIGHT_TYPES.SELECTED, customColor = null) {
        if (!model || !nodeName) return false;
        
        try {
            // 等待模型准备就绪
            const readyPromise = model.readyPromise || Promise.resolve(model);
            
            return readyPromise.then((readyModel) => {
                const color = this._getHighlightColor(highlightType, customColor);
                const node = this._findNodeByName(readyModel, nodeName);
                
                if (node) {
                    // 保存原始材质状态
                    this._saveOriginalMaterial(readyModel, nodeName);
                    
                    // 应用高亮颜色
                    if (node.material) {
                        this._applyHighlightToMaterial(node.material, color);
                    }
                    
                    // 记录高亮状态
                    this.highlightedObjects.set(`${readyModel.id}_${nodeName}`, {
                        model: readyModel,
                        nodeName,
                        highlightType,
                        color,
                        timestamp: Date.now(),
                    });
                    
                    return true;
                }
                
                // 如果找不到节点，尝试整体模型高亮作为降级方案
                this._applyModelWideHighlight(readyModel, color);
                return true;
            });
        } catch (error) {
            console.error('Error highlighting node:', error);
            return false;
        }
    }

    // 按材质名称高亮
    highlightByMaterialName(model, materialName, highlightType = HIGHLIGHT_TYPES.SELECTED, customColor = null) {
        if (!model || !materialName) return false;
        
        try {
            const readyPromise = model.readyPromise || Promise.resolve(model);
            
            return readyPromise.then((readyModel) => {
                const color = this._getHighlightColor(highlightType, customColor);
                const materials = this._findMaterialsByName(readyModel, materialName);
                
                if (materials.length > 0) {
                    materials.forEach((material, index) => {
                        this._saveOriginalMaterial(readyModel, `${materialName}_${index}`);
                        this._applyHighlightToMaterial(material, color);
                    });
                    
                    this.highlightedObjects.set(`${readyModel.id}_mat_${materialName}`, {
                        model: readyModel,
                        materialName,
                        highlightType,
                        color,
                        timestamp: Date.now(),
                    });
                    
                    return true;
                }
                
                // 降级方案：整体模型高亮
                this._applyModelWideHighlight(readyModel, color);
                return true;
            });
        } catch (error) {
            console.error('Error highlighting by material:', error);
            return false;
        }
    }

    // 整体模型高亮
    highlightModel(model, highlightType = HIGHLIGHT_TYPES.SELECTED, customColor = null) {
        if (!model) return false;
        
        const color = this._getHighlightColor(highlightType, customColor);
        this._applyModelWideHighlight(model, color);
        
        this.highlightedObjects.set(`${model.id}_model`, {
            model,
            highlightType,
            color,
            timestamp: Date.now(),
        });
        
        return true;
    }

    // 清除节点高亮
    clearNodeHighlight(model, nodeName) {
        const key = `${model.id}_${nodeName}`;
        const highlightInfo = this.highlightedObjects.get(key);
        
        if (highlightInfo) {
            this._restoreOriginalMaterial(model, nodeName);
            this.highlightedObjects.delete(key);
        }
        
        // 同时清除模型级别的高亮
        this.clearModelHighlight(model);
    }

    // 清除模型高亮
    clearModelHighlight(model) {
        if (model) {
            // 恢复原始颜色
            model.color = undefined;
            model.colorBlendMode = 2; // 恢复默认混合模式
            model.colorBlendAmount = 0;
            
            // 清除所有相关高亮
            const keysToDelete = [];
            this.highlightedObjects.forEach((value, key) => {
                if (value.model === model || (value.model.id && value.model.id === model.id)) {
                    keysToDelete.push(key);
                }
            });
            
            keysToDelete.forEach(key => this.highlightedObjects.delete(key));
        }
    }

    // 清除所有高亮
    clearAllHighlights() {
        this.highlightedObjects.forEach((info) => {
            if (info.model) {
                info.model.color = undefined;
                info.model.colorBlendMode = 2;
                info.model.colorBlendAmount = 0;
            }
        });
        this.highlightedObjects.clear();
    }

    // 修改PBR材质属性
    modifyPBRMaterial(model, materialName, pbrParams) {
        if (!model || !materialName) return false;
        
        try {
            const readyPromise = model.readyPromise || Promise.resolve(model);
            
            return readyPromise.then((readyModel) => {
                const materials = this._findMaterialsByName(readyModel, materialName);
                
                if (materials.length > 0) {
                    materials.forEach((material) => {
                        this._applyPBRParams(material, pbrParams);
                    });
                    
                    // 记录修改
                    this.modifiedMaterials.set(`${readyModel.id}_${materialName}`, {
                        model: readyModel,
                        materialName,
                        pbrParams,
                        timestamp: Date.now(),
                    });
                    
                    return true;
                }
                
                // 降级方案：使用模型颜色混合
                if (pbrParams.baseColor) {
                    readyModel.color = pbrParams.baseColor;
                    readyModel.colorBlendMode = 2;
                    readyModel.colorBlendAmount = this.config.fallback.colorBlendAmount;
                }
                
                return false;
            });
        } catch (error) {
            console.error('Error modifying PBR material:', error);
            return false;
        }
    }

    // 修改模型所有材质
    modifyAllMaterials(model, pbrParams) {
        if (!model) return false;
        
        try {
            const readyPromise = model.readyPromise || Promise.resolve(model);
            
            return readyPromise.then((readyModel) => {
                const allMaterials = this._getAllMaterials(readyModel);
                
                if (allMaterials.length > 0) {
                    allMaterials.forEach((material) => {
                        this._applyPBRParams(material, pbrParams);
                    });
                    return true;
                }
                
                // 降级方案
                if (pbrParams.baseColor) {
                    readyModel.color = pbrParams.baseColor;
                    readyModel.colorBlendMode = 2;
                    readyModel.colorBlendAmount = this.config.fallback.colorBlendAmount;
                }
                
                return false;
            });
        } catch (error) {
            console.error('Error modifying all materials:', error);
            return false;
        }
    }

    // 设置自发光效果
    setEmissive(model, materialName, emissiveColor, intensity = 1.0) {
        return this.modifyPBRMaterial(model, materialName, {
            emissive: emissiveColor,
            emissiveIntensity: intensity,
        });
    }

    // 设置金属度和粗糙度
    setMetallicRoughness(model, materialName, metallic, roughness) {
        return this.modifyPBRMaterial(model, materialName, {
            metallic,
            roughness,
        });
    }

    // 获取高亮对象列表
    getHighlightedObjects() {
        return Array.from(this.highlightedObjects.values());
    }

    // 查找节点（通过名称）
    _findNodeByName(model, nodeName) {
        if (!model || !model._nodeResources) return null;
        
        // 尝试从模型的节点资源中查找
        const nodes = model._nodeResources;
        for (const nodeId in nodes) {
            const node = nodes[nodeId];
            if (node.name === nodeName || nodeId === nodeName) {
                return node;
            }
        }
        
        // 尝试从runtime节点中查找
        if (model._runtime) {
            const runtimeNodes = model._runtime.nodes;
            if (runtimeNodes) {
                for (const node of runtimeNodes) {
                    if (node.name === nodeName) {
                        return node;
                    }
                }
            }
        }
        
        return null;
    }

    // 按名称查找材质
    _findMaterialsByName(model, materialName) {
        const materials = [];
        
        if (!model || !model._rendererResources) return materials;
        
        const rendererMaterials = model._rendererResources.materials;
        if (rendererMaterials) {
            for (const matId in rendererMaterials) {
                const material = rendererMaterials[matId];
                if (material.name === materialName || matId === materialName) {
                    materials.push(material);
                }
            }
        }
        
        return materials;
    }

    // 获取所有材质
    _getAllMaterials(model) {
        const materials = [];
        
        if (model && model._rendererResources && model._rendererResources.materials) {
            const rendererMaterials = model._rendererResources.materials;
            for (const matId in rendererMaterials) {
                materials.push(rendererMaterials[matId]);
            }
        }
        
        return materials;
    }

    // 获取高亮颜色
    _getHighlightColor(highlightType, customColor) {
        if (customColor) return customColor;
        
        const highlightConfig = this.config.highlight;
        
        switch (highlightType) {
            case HIGHLIGHT_TYPES.SELECTED:
                return highlightConfig.selectedColor;
            case HIGHLIGHT_TYPES.ALARM:
                return highlightConfig.alarmColor;
            case HIGHLIGHT_TYPES.WARNING:
                return highlightConfig.warningColor;
            case HIGHLIGHT_TYPES.CUSTOM:
                return customColor || highlightConfig.selectedColor;
            default:
                return highlightConfig.selectedColor;
        }
    }

    // 应用高亮到材质
    _applyHighlightToMaterial(material, color) {
        if (!material) return;
        
        // 保存原始值
        if (!material._originalValues) {
            material._originalValues = {
                baseColor: material.baseColor ? deepClone(material.baseColor) : null,
                emissive: material.emissive ? deepClone(material.emissive) : null,
                emissiveIntensity: material.emissiveIntensity || 0,
            };
        }
        
        // 应用高亮 - 修改基础色或自发光
        if (material.emissive !== undefined) {
            material.emissive = new Cesium.Color(color.red, color.green, color.blue, 1.0);
            material.emissiveIntensity = this.config.highlight.glowIntensity;
        } else if (material.baseColor) {
            material.baseColor = new Cesium.Color(color.red, color.green, color.blue, color.alpha);
        }
    }

    // 应用PBR参数到材质
    _applyPBRParams(material, pbrParams) {
        if (!material) return;
        
        const { baseColor, metallic, roughness, emissive, emissiveIntensity } = pbrParams;
        
        if (baseColor && material.baseColor) {
            material.baseColor = baseColor;
        }
        
        if (metallic !== undefined && material.metallic !== undefined) {
            material.metallic = metallic;
        }
        
        if (roughness !== undefined && material.roughness !== undefined) {
            material.roughness = roughness;
        }
        
        if (emissive && material.emissive) {
            material.emissive = emissive;
        }
        
        if (emissiveIntensity !== undefined && material.emissiveIntensity !== undefined) {
            material.emissiveIntensity = emissiveIntensity;
        }
    }

    // 应用模型宽高亮（降级方案）
    _applyModelWideHighlight(model, color) {
        if (!model) return;
        
        // 使用Cesium内置的颜色混合
        model.color = color;
        model.colorBlendMode = 2; // MIX
        model.colorBlendAmount = 0.6; // 混合比例
    }

    // 保存原始材质状态
    _saveOriginalMaterial(model, key) {
        const storageKey = `${model.id}_${key}`;
        if (this.modifiedMaterials.has(storageKey)) return;
        
        // 这里可以添加保存原始材质的逻辑
        // 目前简化处理，只记录修改时间
        this.modifiedMaterials.set(storageKey, {
            saved: true,
            timestamp: Date.now(),
        });
    }

    // 恢复原始材质
    _restoreOriginalMaterial(model, key) {
        const storageKey = `${model.id}_${key}`;
        this.modifiedMaterials.delete(storageKey);
    }

    // 重置所有材质修改
    resetAllMaterials() {
        this.modifiedMaterials.clear();
        this.clearAllHighlights();
    }

    // 销毁
    destroy() {
        this.resetAllMaterials();
    }
}

export default MaterialEnhancement;

