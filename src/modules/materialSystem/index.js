import { isEmpty, deepClone } from '../../utils';
import { cesiumColorFromBytes, cesiumColor } from '../../utils/cesiumUtils';

/**
 * 材质与状态表达系统
 * 功能：
 * 1. 按 glTF 材质或节点区分高亮与告警
 * 2. PBR 材质运行时调整（基础色/金属度-粗糙度/自发光）
 * 3. 不支持 PBR 模型的降级策略
 * 4. 告警、选中、相别高亮区分
 */
class MaterialSystem {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        
        // 默认配置
        this.defaultOptions = {
            // 是否启用 PBR 材质调整
            enablePBR: true,
            // 降级策略：'color' | 'silhouette' | 'both'
            fallbackStrategy: 'color',
            // 高亮强度
            highlightIntensity: 0.3,
            // 选中颜色
            selectedColor: cesiumColorFromBytes(24, 144, 255, 255),
            // 告警颜色
            alarmColor: cesiumColorFromBytes(245, 34, 45, 255),
            // 警告颜色
            warningColor: cesiumColorFromBytes(250, 173, 20, 255),
            // 严重告警颜色
            seriousColor: cesiumColorFromBytes(251, 75, 28, 255),
            // 离线颜色
            offlineColor: cesiumColorFromBytes(118, 121, 125, 255),
            // 相别颜色（A相-黄，B相-绿，C相-红）
            phaseColors: {
                A: cesiumColorFromBytes(255, 235, 59, 255),   // 黄色
                B: cesiumColorFromBytes(76, 175, 80, 255),    // 绿色
                C: cesiumColorFromBytes(244, 67, 54, 255),    // 红色
            },
            // 自发光强度
            emissiveIntensity: 0.5,
        };
        
        this.options = { ...this.defaultOptions, ...options };
        
        // 材质缓存
        this.materialCache = new Map();
        
        // 模型原始材质状态备份
        this.originalMaterials = new Map();
        
        // 当前高亮状态
        this.highlightState = new Map();
    }

    /**
     * 检查模型是否支持 PBR
     * @param {Cesium.Model} model - 模型实例
     * @returns {boolean} 是否支持 PBR
     */
    isPBRSupported(model) {
        if (!model || !model.gltf) return false;
        
        const gltf = model.gltf;
        
        // 检查是否有 PBR 材质定义
        if (gltf.materials) {
            for (const material of gltf.materials) {
                if (material.pbrMetallicRoughness || 
                    (material.extensions && material.extensions.KHR_materials_pbrSpecularGlossiness)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 获取模型的材质列表
     * @param {Cesium.Model} model - 模型实例
     * @returns {Array} 材质列表
     */
    getMaterials(model) {
        if (!model || !model._rendererResources) return [];
        
        const materials = [];
        const gltf = model.gltf;
        
        if (gltf && gltf.materials) {
            gltf.materials.forEach((material, index) => {
                materials.push({
                    index: index,
                    name: material.name || `Material_${index}`,
                    material: material,
                    isPBR: !!material.pbrMetallicRoughness,
                });
            });
        }
        
        return materials;
    }

    /**
     * 获取模型的节点（mesh）列表
     * @param {Cesium.Model} model - 模型实例
     * @returns {Array} 节点列表
     */
    getNodes(model) {
        if (!model || !model.gltf) return [];
        
        const nodes = [];
        const gltf = model.gltf;
        
        if (gltf && gltf.nodes) {
            gltf.nodes.forEach((node, index) => {
                nodes.push({
                    index: index,
                    name: node.name || `Node_${index}`,
                    node: node,
                    mesh: node.mesh,
                });
            });
        }
        
        return nodes;
    }

    /**
     * 备份模型原始材质状态
     * @param {Cesium.Model} model - 模型实例
     * @param {string} modelId - 模型标识
     */
    backupOriginalMaterials(model, modelId) {
        if (!model || !model.gltf) return;
        
        const backup = {
            materials: [],
            nodes: []
        };
        
        const gltf = model.gltf;
        
        // 备份材质
        if (gltf.materials) {
            backup.materials = gltf.materials.map(m => deepClone(m));
        }
        
        // 备份节点
        if (gltf.nodes) {
            backup.nodes = gltf.nodes.map(n => ({ name: n.name, mesh: n.mesh }));
        }
        
        this.originalMaterials.set(modelId, backup);
    }

    /**
     * 恢复模型原始材质状态
     * @param {Cesium.Model} model - 模型实例
     * @param {string} modelId - 模型标识
     */
    restoreOriginalMaterials(model, modelId) {
        const backup = this.originalMaterials.get(modelId);
        if (!backup || !model) return;
        
        // 清除当前颜色混合
        model.color = Cesium.Color.WHITE;
        model.colorBlendMode = Cesium.ColorBlendMode.HIGHLIGHT;
        model.colorBlendAmount = 0;
        
        // 清除高亮状态
        this.highlightState.delete(modelId);
    }

    /**
     * 设置模型整体颜色（降级策略）
     * @param {Cesium.Model} model - 模型实例
     * @param {Cesium.Color} color - 颜色
     * @param {number} blendAmount - 混合强度 0-1
     */
    setModelColor(model, color, blendAmount = 0.5) {
        if (!model) return;
        
        model.color = color;
        model.colorBlendMode = Cesium.ColorBlendMode.MIX;
        model.colorBlendAmount = blendAmount;
        
        // 记录高亮状态
        this.highlightState.set(model.id || model, {
            type: 'color',
            color: color,
            blendAmount: blendAmount
        });
    }

    /**
     * 设置选中高亮
     * @param {Cesium.Model} model - 模型实例
     * @param {Object} options - 选项
     */
    setSelectedHighlight(model, options = {}) {
        const color = options.color || this.options.selectedColor;
        const intensity = options.intensity || this.options.highlightIntensity;
        
        if (this.isPBRSupported(model) && this.options.enablePBR) {
            this._applyPBRHighlight(model, color, intensity, 'selected');
        } else {
            this.setModelColor(model, color, intensity);
        }
        
        this.highlightState.set(model.id || model, {
            type: 'selected',
            color: color
        });
    }

    /**
     * 设置告警高亮
     * @param {Cesium.Model} model - 模型实例
     * @param {string} level - 告警级别 'alarm' | 'warning' | 'serious' | 'offline'
     * @param {Object} options - 选项
     */
    setAlarmHighlight(model, level = 'alarm', options = {}) {
        let color;
        switch (level) {
            case 'alarm':
                color = this.options.alarmColor;
                break;
            case 'warning':
                color = this.options.warningColor;
                break;
            case 'serious':
                color = this.options.seriousColor;
                break;
            case 'offline':
                color = this.options.offlineColor;
                break;
            default:
                color = options.color || this.options.alarmColor;
        }
        
        const intensity = options.intensity || this.options.highlightIntensity;
        
        if (this.isPBRSupported(model) && this.options.enablePBR) {
            this._applyPBRHighlight(model, color, intensity, 'alarm', {
                emissive: true,
                emissiveIntensity: this.options.emissiveIntensity
            });
        } else {
            this.setModelColor(model, color, intensity);
        }
        
        this.highlightState.set(model.id || model, {
            type: 'alarm',
            level: level,
            color: color
        });
    }

    /**
     * 设置相别高亮
     * @param {Cesium.Model} model - 模型实例
     * @param {string} phase - 相别 'A' | 'B' | 'C'
     * @param {Object} options - 选项
     */
    setPhaseHighlight(model, phase, options = {}) {
        const color = this.options.phaseColors[phase] || options.color;
        if (!color) {
            console.warn(`MaterialSystem: 未知的相别 "${phase}"`);
            return;
        }
        
        const intensity = options.intensity || this.options.highlightIntensity;
        
        if (this.isPBRSupported(model) && this.options.enablePBR) {
            this._applyPBRHighlight(model, color, intensity, 'phase');
        } else {
            this.setModelColor(model, color, intensity);
        }
        
        this.highlightState.set(model.id || model, {
            type: 'phase',
            phase: phase,
            color: color
        });
    }

    /**
     * 按材质设置高亮
     * @param {Cesium.Model} model - 模型实例
     * @param {string|number} materialNameOrIndex - 材质名称或索引
     * @param {Cesium.Color} color - 颜色
     * @param {Object} options - 选项
     */
    setMaterialHighlight(model, materialNameOrIndex, color, options = {}) {
        if (!this.isPBRSupported(model) || !this.options.enablePBR) {
            // 降级到整体高亮
            this.setModelColor(model, color, options.intensity || 0.5);
            return;
        }
        
        const materials = this.getMaterials(model);
        let targetMaterial = null;
        
        if (typeof materialNameOrIndex === 'number') {
            targetMaterial = materials.find(m => m.index === materialNameOrIndex);
        } else {
            targetMaterial = materials.find(m => m.name === materialNameOrIndex);
        }
        
        if (!targetMaterial) {
            console.warn(`MaterialSystem: 未找到材质 "${materialNameOrIndex}"`);
            return;
        }
        
        this._applyMaterialColor(model, targetMaterial.index, color, options);
    }

    /**
     * 按节点设置高亮
     * @param {Cesium.Model} model - 模型实例
     * @param {string|number} nodeNameOrIndex - 节点名称或索引
     * @param {Cesium.Color} color - 颜色
     * @param {Object} options - 选项
     */
    setNodeHighlight(model, nodeNameOrIndex, color, options = {}) {
        const nodes = this.getNodes(model);
        let targetNode = null;
        
        if (typeof nodeNameOrIndex === 'number') {
            targetNode = nodes.find(n => n.index === nodeNameOrIndex);
        } else {
            targetNode = nodes.find(n => n.name === nodeNameOrIndex);
        }
        
        if (!targetNode) {
            console.warn(`MaterialSystem: 未找到节点 "${nodeNameOrIndex}"`);
            return;
        }
        
        // 节点高亮通常需要整体颜色混合或轮廓线
        if (options.useSilhouette && model.setSilhouette) {
            model.silhouetteColor = color;
            model.silhouetteSize = options.silhouetteSize || 2.0;
        } else {
            this.setModelColor(model, color, options.intensity || 0.5);
        }
    }

    /**
     * 应用 PBR 高亮
     * @private
     */
    _applyPBRHighlight(model, color, intensity, highlightType, options = {}) {
        // 对于 PBR 模型，使用颜色混合模式
        model.color = color;
        model.colorBlendMode = Cesium.ColorBlendMode.MIX;
        model.colorBlendAmount = intensity;
        
        // 如果需要自发光效果
        if (options.emissive) {
            // 自发光需要通过自定义着色器或后处理实现
            // 这里使用颜色增强模拟
            const emissiveColor = new Cesium.Color(
                Math.min(1, color.red * (1 + options.emissiveIntensity)),
                Math.min(1, color.green * (1 + options.emissiveIntensity)),
                Math.min(1, color.blue * (1 + options.emissiveIntensity)),
                color.alpha
            );
            model.color = emissiveColor;
        }
    }

    /**
     * 应用材质颜色
     * @private
     */
    _applyMaterialColor(model, materialIndex, color, options = {}) {
        // 注意：Cesium 的 Model API 限制了对单个材质的运行时修改
        // 这里使用整体颜色混合作为替代方案
        model.color = color;
        model.colorBlendMode = Cesium.ColorBlendMode.MIX;
        model.colorBlendAmount = options.intensity || 0.5;
    }

    /**
     * 调整 PBR 材质参数
     * @param {Cesium.Model} model - 模型实例
     * @param {Object} params - PBR 参数
     * @param {number} params.metallic - 金属度 0-1
     * @param {number} params.roughness - 粗糙度 0-1
     * @param {Cesium.Color} params.baseColor - 基础色
     * @param {Cesium.Color} params.emissive - 自发光色
     */
    adjustPBRParams(model, params = {}) {
        if (!this.isPBRSupported(model)) {
            console.warn('MaterialSystem: 模型不支持 PBR，无法调整参数');
            return false;
        }
        
        const gltf = model.gltf;
        if (!gltf || !gltf.materials) return false;
        
        // 遍历并调整所有材质的 PBR 参数
        gltf.materials.forEach(material => {
            if (material.pbrMetallicRoughness) {
                if (params.metallic !== undefined) {
                    material.pbrMetallicRoughness.metallicFactor = params.metallic;
                }
                if (params.roughness !== undefined) {
                    material.pbrMetallicRoughness.roughnessFactor = params.roughness;
                }
                if (params.baseColor) {
                    material.pbrMetallicRoughness.baseColorFactor = [
                        params.baseColor.red,
                        params.baseColor.green,
                        params.baseColor.blue,
                        params.baseColor.alpha
                    ];
                }
            }
            
            // 自发光
            if (params.emissive) {
                material.emissiveFactor = [
                    params.emissive.red * this.options.emissiveIntensity,
                    params.emissive.green * this.options.emissiveIntensity,
                    params.emissive.blue * this.options.emissiveIntensity
                ];
            }
        });
        
        return true;
    }

    /**
     * 清除高亮状态
     * @param {Cesium.Model} model - 模型实例
     * @param {string} modelId - 模型标识
     */
    clearHighlight(model, modelId) {
        if (!model) return;
        
        // 恢复原始颜色
        model.color = Cesium.Color.WHITE;
        model.colorBlendAmount = 0;
        
        // 清除轮廓线
        if (model.silhouetteSize) {
            model.silhouetteSize = 0;
        }
        
        // 移除状态记录
        this.highlightState.delete(modelId || model.id || model);
    }

    /**
     * 清除所有高亮
     */
    clearAllHighlights() {
        this.highlightState.forEach((state, key) => {
            // 注意：这里需要实际的模型引用来清除
            // 实际使用时需要维护模型引用映射
        });
        this.highlightState.clear();
    }

    /**
     * 获取模型的高亮状态
     * @param {string} modelId - 模型标识
     * @returns {Object|null} 高亮状态
     */
    getHighlightState(modelId) {
        return this.highlightState.get(modelId) || null;
    }

    /**
     * 批量设置模型状态色
     * @param {Array} models - 模型数组 [{model, id, status}]
     * @param {string} statusField - 状态字段名
     */
    batchSetStatusColor(models, statusField = 'status') {
        models.forEach(item => {
            const { model, id, [statusField]: status } = item;
            
            switch (status) {
                case 'selected':
                    this.setSelectedHighlight(model);
                    break;
                case 'alarm':
                case 'warning':
                case 'serious':
                case 'offline':
                    this.setAlarmHighlight(model, status);
                    break;
                default:
                    if (['A', 'B', 'C'].includes(status)) {
                        this.setPhaseHighlight(model, status);
                    }
            }
        });
    }

    /**
     * 创建材质配置对象（用于初始化）
     * @param {Object} config - 配置
     * @returns {Object} 材质配置
     */
    static createMaterialConfig(config = {}) {
        return {
            enablePBR: config.enablePBR !== false,
            fallbackStrategy: config.fallbackStrategy || 'color',
            highlightIntensity: config.highlightIntensity || 0.3,
            selectedColor: config.selectedColor,
            alarmColor: config.alarmColor,
            warningColor: config.warningColor,
            seriousColor: config.seriousColor,
            offlineColor: config.offlineColor,
            phaseColors: config.phaseColors,
            emissiveIntensity: config.emissiveIntensity || 0.5,
        };
    }
}

export default MaterialSystem;
