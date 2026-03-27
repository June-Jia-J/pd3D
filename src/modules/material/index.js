import { isEmpty, deepMerge } from '../../utils';
import { cesiumColor, cesiumColorFromBytes } from '../../utils/cesiumUtils';

const MATERIAL_STATE_TYPES = {
    NORMAL: 'normal',
    HIGHLIGHT: 'highlight',
    WARNING: 'warning',
    ALARM: 'alarm',
    SELECTED: 'selected',
    DISABLED: 'disabled',
};

const DEFAULT_MATERIAL_COLORS = {
    [MATERIAL_STATE_TYPES.NORMAL]: null,
    [MATERIAL_STATE_TYPES.HIGHLIGHT]: cesiumColorFromBytes(24, 144, 255, 255),
    [MATERIAL_STATE_TYPES.WARNING]: cesiumColorFromBytes(250, 173, 20, 255),
    [MATERIAL_STATE_TYPES.ALARM]: cesiumColorFromBytes(245, 34, 45, 255),
    [MATERIAL_STATE_TYPES.SELECTED]: cesiumColorFromBytes(24, 144, 255, 255),
    [MATERIAL_STATE_TYPES.DISABLED]: cesiumColorFromBytes(128, 128, 128, 255),
};

const PHASE_COLORS = {
    A: cesiumColorFromBytes(255, 77, 79, 255),
    B: cesiumColorFromBytes(82, 196, 26, 255),
    C: cesiumColorFromBytes(22, 119, 255, 255),
    N: cesiumColorFromBytes(140, 140, 140, 255),
    default: cesiumColorFromBytes(24, 144, 255, 255),
};

const PBR_PROPERTIES = {
    baseColorFactor: { r: 1, g: 1, b: 1, a: 1 },
    metallicFactor: 1.0,
    roughnessFactor: 1.0,
    emissiveFactor: { r: 0, g: 0, b: 0 },
};

class MaterialManager {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        
        this.stateColors = deepMerge(DEFAULT_MATERIAL_COLORS, options.stateColors || {});
        this.phaseColors = deepMerge(PHASE_COLORS, options.phaseColors || {});
        this.materialStates = new Map();
        this.modelMaterialCache = new Map();
        this.pbrSupportCache = new Map();
        
        this.colorBlendMode = options.colorBlendMode !== undefined ? options.colorBlendMode : Cesium.ColorBlendMode.MIX;
        this.colorBlendAmount = options.colorBlendAmount !== undefined ? options.colorBlendAmount : 0.5;
    }

    setModelColor(model, color, options = {}) {
        if (!model) return this;
        
        const blendMode = options.colorBlendMode !== undefined ? options.colorBlendMode : this.colorBlendMode;
        const blendAmount = options.colorBlendAmount !== undefined ? options.colorBlendAmount : this.colorBlendAmount;
        
        model.color = color;
        model.colorBlendMode = blendMode;
        model.colorBlendAmount = blendAmount;
        
        return this;
    }

    setModelState(model, state, options = {}) {
        if (!model) return this;
        
        const color = options.color || this.stateColors[state];
        this.setModelColor(model, color, options);
        
        const modelId = options.modelId || model.id || `model_${Date.now()}`;
        this.materialStates.set(modelId, {
            state,
            previousColor: model.color ? model.color.clone() : null,
            timestamp: Date.now(),
        });
        
        return this;
    }

    resetModelState(model, options = {}) {
        if (!model) return this;
        
        const modelId = options.modelId || model.id;
        const stateInfo = this.materialStates.get(modelId);
        
        if (stateInfo && stateInfo.previousColor) {
            model.color = stateInfo.previousColor;
        } else {
            model.color = undefined;
        }
        model.colorBlendAmount = 0;
        
        this.materialStates.delete(modelId);
        return this;
    }

    highlightModel(model, options = {}) {
        return this.setModelState(model, MATERIAL_STATE_TYPES.HIGHLIGHT, {
            ...options,
            colorBlendAmount: options.colorBlendAmount || 0.5,
        });
    }

    unhighlightModel(model, options = {}) {
        return this.resetModelState(model, options);
    }

    setAlarmState(model, level = 1, options = {}) {
        const stateMap = {
            1: MATERIAL_STATE_TYPES.WARNING,
            2: MATERIAL_STATE_TYPES.ALARM,
            3: MATERIAL_STATE_TYPES.ALARM,
        };
        
        return this.setModelState(model, stateMap[level] || MATERIAL_STATE_TYPES.WARNING, {
            ...options,
            colorBlendAmount: options.colorBlendAmount || 0.7,
        });
    }

    setPhaseHighlight(model, phase, options = {}) {
        const color = this.phaseColors[phase] || this.phaseColors.default;
        return this.setModelColor(model, color, {
            ...options,
            colorBlendAmount: options.colorBlendAmount || 0.5,
        });
    }

    checkPBRSupport(model) {
        if (!model) return { supported: false, reason: 'Model is null' };
        
        const modelId = model.id || (model._resource && model._resource.url);
        if (this.pbrSupportCache.has(modelId)) {
            return this.pbrSupportCache.get(modelId);
        }
        
        const result = {
            supported: false,
            hasPBR: false,
            hasMaterials: false,
            materialCount: 0,
            reason: '',
        };
        
        if (model.gltf) {
            const gltf = model.gltf;
            result.hasMaterials = !!(gltf.materials && gltf.materials.length > 0);
            result.materialCount = gltf.materials ? gltf.materials.length : 0;
            
            if (gltf.materials) {
                const hasPBRMaterials = gltf.materials.some(mat => mat.pbrMetallicRoughness);
                result.hasPBR = hasPBRMaterials;
            }
            
            result.supported = result.hasPBR;
            result.reason = result.supported ? 'PBR materials detected' : 'No PBR materials found';
        } else {
            result.reason = 'Model gltf not accessible';
        }
        
        this.pbrSupportCache.set(modelId, result);
        return result;
    }

    setPBRProperties(model, properties = {}) {
        if (!model || !model.gltf) return this;
        
        const pbrSupport = this.checkPBRSupport(model);
        if (!pbrSupport.supported) {
            console.warn('Model does not support PBR materials, using fallback strategy');
            return this._applyPBRFallback(model, properties);
        }
        
        const materials = model.gltf.materials;
        if (!materials) return this;
        
        materials.forEach((material, index) => {
            if (material.pbrMetallicRoughness) {
                const pbr = material.pbrMetallicRoughness;
                
                if (properties.baseColorFactor) {
                    pbr.baseColorFactor = [
                        properties.baseColorFactor.r,
                        properties.baseColorFactor.g,
                        properties.baseColorFactor.b,
                        properties.baseColorFactor.a !== undefined ? properties.baseColorFactor.a : 1,
                    ];
                }
                
                if (properties.metallicFactor !== undefined) {
                    pbr.metallicFactor = properties.metallicFactor;
                }
                
                if (properties.roughnessFactor !== undefined) {
                    pbr.roughnessFactor = properties.roughnessFactor;
                }
            }
            
            if (properties.emissiveFactor && material.emissiveFactor) {
                material.emissiveFactor = [
                    properties.emissiveFactor.r,
                    properties.emissiveFactor.g,
                    properties.emissiveFactor.b,
                ];
            }
        });
        
        this._refreshModelMaterials(model);
        return this;
    }

    _applyPBRFallback(model, properties) {
        if (properties.baseColorFactor) {
            const color = cesiumColor(
                properties.baseColorFactor.r,
                properties.baseColorFactor.g,
                properties.baseColorFactor.b,
                properties.baseColorFactor.a || 1
            );
            this.setModelColor(model, color, { colorBlendAmount: 0.8 });
        }
        
        if (properties.emissiveFactor) {
            const emissiveColor = cesiumColor(
                properties.emissiveFactor.r,
                properties.emissiveFactor.g,
                properties.emissiveFactor.b,
                1
            );
            model.color = Cesium.Color.add(
                model.color || Cesium.Color.WHITE,
                emissiveColor,
                new Cesium.Color()
            );
        }
        
        return this;
    }

    _refreshModelMaterials(model) {
        if (model._rendererResources && model._rendererResources.textures) {
            const textures = model._rendererResources.textures;
            Object.values(textures).forEach(texture => {
                if (texture && texture.generateMipmap) {
                    texture.generateMipmap();
                }
            });
        }
        return this;
    }

    setNodeHighlight(model, nodeName, options = {}) {
        if (!model) return this;
        
        const node = this._findNode(model, nodeName);
        if (!node) {
            console.warn(`Node "${nodeName}" not found in model`);
            return this;
        }
        
        const color = options.color || this.stateColors[MATERIAL_STATE_TYPES.HIGHLIGHT];
        const blendAmount = options.colorBlendAmount || 0.5;
        
        if (model._runtime && model._runtime.nodesByName) {
            const runtimeNode = model._runtime.nodesByName[nodeName];
            if (runtimeNode && runtimeNode.node) {
                const nodeIndex = runtimeNode.index;
                if (model._nodeColors) {
                    model._nodeColors[nodeIndex] = color;
                }
            }
        }
        
        return this;
    }

    _findNode(model, nodeName) {
        if (!model || !model.gltf) return null;
        
        const nodes = model.gltf.nodes;
        if (!nodes) return null;
        
        return nodes.find(node => node.name === nodeName);
    }

    setMaterialByIndex(model, materialIndex, properties = {}) {
        if (!model || !model.gltf || !model.gltf.materials) return this;
        
        const material = model.gltf.materials[materialIndex];
        if (!material) return this;
        
        if (material.pbrMetallicRoughness) {
            if (properties.baseColorFactor) {
                material.pbrMetallicRoughness.baseColorFactor = [
                    properties.baseColorFactor.r,
                    properties.baseColorFactor.g,
                    properties.baseColorFactor.b,
                    properties.baseColorFactor.a || 1,
                ];
            }
            if (properties.metallicFactor !== undefined) {
                material.pbrMetallicRoughness.metallicFactor = properties.metallicFactor;
            }
            if (properties.roughnessFactor !== undefined) {
                material.pbrMetallicRoughness.roughnessFactor = properties.roughnessFactor;
            }
        }
        
        if (properties.emissiveFactor) {
            material.emissiveFactor = [
                properties.emissiveFactor.r,
                properties.emissiveFactor.g,
                properties.emissiveFactor.b,
            ];
        }
        
        this._refreshModelMaterials(model);
        return this;
    }

    batchSetModelState(models, state, options = {}) {
        if (!models || !Array.isArray(models)) return this;
        
        models.forEach((model, index) => {
            this.setModelState(model, state, {
                ...options,
                modelId: options.modelIds ? options.modelIds[index] : undefined,
            });
        });
        
        return this;
    }

    batchHighlight(models, options = {}) {
        return this.batchSetModelState(models, MATERIAL_STATE_TYPES.HIGHLIGHT, options);
    }

    batchReset(models, options = {}) {
        if (!models || !Array.isArray(models)) return this;
        
        models.forEach((model, index) => {
            this.resetModelState(model, {
                ...options,
                modelId: options.modelIds ? options.modelIds[index] : undefined,
            });
        });
        
        return this;
    }

    createStateEffect(type, config = {}) {
        const effect = {
            type,
            config: deepMerge({
                duration: 1000,
                loop: false,
                colorFrom: null,
                colorTo: null,
                easing: 'linear',
            }, config),
            startTime: null,
            active: false,
        };
        
        return effect;
    }

    applyEmissiveGlow(model, options = {}) {
        const intensity = options.intensity || 0.5;
        const color = options.color || { r: 1, g: 0.8, b: 0 };
        
        return this.setPBRProperties(model, {
            emissiveFactor: {
                r: color.r * intensity,
                g: color.g * intensity,
                b: color.b * intensity,
            },
        });
    }

    removeEmissiveGlow(model) {
        return this.setPBRProperties(model, {
            emissiveFactor: { r: 0, g: 0, b: 0 },
        });
    }

    getStateColors() {
        return { ...this.stateColors };
    }

    setStateColors(colors) {
        this.stateColors = deepMerge(this.stateColors, colors);
        return this;
    }

    getPhaseColors() {
        return { ...this.phaseColors };
    }

    setPhaseColors(colors) {
        this.phaseColors = deepMerge(this.phaseColors, colors);
        return this;
    }

    destroy() {
        this.materialStates.clear();
        this.modelMaterialCache.clear();
        this.pbrSupportCache.clear();
    }
}

export {
    MaterialManager,
    MATERIAL_STATE_TYPES,
    DEFAULT_MATERIAL_COLORS,
    PHASE_COLORS,
    PBR_PROPERTIES,
};

export default MaterialManager;
