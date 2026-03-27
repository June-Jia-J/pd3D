# 三维组件封装说明

## 概述

  - 三维组件封装结构说明
  - 三维组件对外暴露的方法说明

## 封装目录结构
```bash
├── assets:
│   ├── images                      # 图片资源
├── containers:
│   ├── view3dController.js         # 封装三维显示实现
│   ├── edit3dController.js         # 封装三维在线编辑实现
├── modules:
│   ├── toolbar.js                  # 基础交互操作
│   ├── popup.js                    # 气泡显示实时数据
│   ├── editModel.js                # 在线编辑组件
│   ├── updateDataStatus.js         # 刷新实时数据和模型状态
│   ├── cameraSystem/               # 相机与视角管理系统
│   │   └── index.js                    # 视角书签、动画过渡、边界控制
│   ├── materialSystem/             # 材质与状态表达系统
│   │   └── index.js                    # PBR材质、高亮告警、相别区分
│   ├── lightingSystem/             # 场景光影系统
│   │   └── index.js                    # 方向光、环境光、阴影、IBL
│   └── visualizationPanel/         # 可视化控制面板
│       └── index.js                    # 整合三大系统的UI面板
├── utils:
│   ├── container.js                # 封装实现方法
│   │   ├── initView.js                 # 初始化场景
│   │   ├── loadModels.js               # 批量加载模型（设备与传感器）
│   │   ├── updateModelStatus.js        # 更新传感器模型颜色状态
│   │   ├── updateDeviceModelStatus.js  # 更新设备模型颜色状态
│   │   ├── updateRealData.js           # 更新实时数据
│   ├── view.js                     # 展示相关的工具方法
│   │   ├── loadgltfByPos           # 根据模型位置加载gltf模型
│   │   ├── loadgltfByPosOri        # 根据模型位置和方位角加载gltf模型
│   │   ├── flyToPosition5          # 根据经纬度定位场景位置
│   │   ├── flyToPosition3          # 根据笛卡尔值定位场景位置
│   │   ├── getCurSceneView         # 获取场景位置--笛卡尔值
│   │   ├── getCurSceneLon          # 获取场景位置--经纬度值
│   │   ├── changeModelColor        # 修改模型颜色
│   ├── enum.js
│   │   ├── getColorBystatus        # 报警状态枚举值对应颜色值；
│   │   ├── getModelUrlByChannel    # 传感器枚举值对应的模型路径；
│   │   ├── getTypeAttr             # 传感器枚举值获取需要展示的属性值；
│   │   ├── getTypeEnum             # 传感器枚举值获取对应的数据类型名称；
│   │   ├── getUnitEnum             # 传感器枚举值获取对应的单位。
│   ├── common.js
│   │   ├── getArrangeInRowData       # 处理模型位置按行排列
│   │   ├── findEndStr                # 查找字符串，从位置cha字符串结尾
│   ├── edit.js
│   │   ├── setSize                 # 设置模型大小
│   │   ├── changePosition          # 修改模型位置
│   │   ├── changeParamsValue       # 修改模型方位角
├── index.js   
├── style.css 
├── design.md                       # 设计文档
└── README.md                       # 项目说明
```

## 对外暴露的方法：

* view3dController{
  * 属性：
    - elementId：模型渲染的div标签的id
    - data：{
      + dataRes 接口getDeviceModel返回值（包含设备模型信息，传感器模型信息和对应的测点数据）
      + resourceProUrl 模型请求的地址前缀
      + deviceName 设备名称
      + deviceType 设备类型
    - }  
    - ToolBar:{
       1. 回到初始位置：
           initpos:true 是否显示该按钮
       2. 模型旋转
         rotate:{
           display:true, 是否显示旋转按钮
           direction,   旋转方向
         }
       3. 数据气泡显示与隐藏
         popup:{
           default:true, 默认显示状态
           display:true,是否显示气泡显示按钮
         }
       4. 上传模型按钮
           upload:true
       5. 编辑按钮
           edit:true
      }
    
  * 方法：
    1. 刷新模型状态 refreshStatus
    2. 刷新传感器的最新数据 refreshLatestData
    3. 更新ToolBar位置样式方法 updateToolBarStyle
    4. 上传模型按钮点击监听事件uploadBtnClick;
    5. 编辑按钮点击监听事件editBtnClick;
  }

* edit3dController{
  * 属性：
    - elementId：模型渲染的div标签的id
    - data:{
        + dataRes 接口getDeviceModel返回值（包含设备模型信息，传感器模型信息和对应的测点数据）
        + resourceProUrl 模型请求的地址前缀
        + deviceName 设备名称
        + deviceType 设备类型
      - } 
  - 方法：
      1. 保存传感器位置回调方法/完成监听事件（包括标签方向）
      2. 保存当前场景位置回调方法/完成监听事件
      3. 更新ToolBar位置样式方法
  }

* CameraSystem 相机与视角管理系统
  * 功能：
    - 视角书签管理（保存/加载/删除预设视角）
    - 相机动画过渡（飞向目标/恢复默认）
    - 环绕动画
    - 缩放边界与防穿模控制
  * 配置参数：
    ```javascript
    {
      minimumZoomDistance: 20,        // 最小视距（防止穿模）
      maximumZoomDistance: 5000,      // 最大视距
      defaultFlyDuration: 1.5,        // 默认飞行动画时长（秒）
      enableCollisionDetection: true, // 启用碰撞检测
      limitPitch: true,               // 限制俯仰角
      minimumPitch: -Math.PI/2 + 0.1, // 最小俯仰角
      maximumPitch: Math.PI/2 - 0.1   // 最大俯仰角
    }
    ```
  * 主要方法：
    - saveBookmark(name, metadata) - 保存当前视角为书签
    - loadBookmark(name, options) - 加载指定视角
    - deleteBookmark(name) - 删除书签
    - restoreDefaultView(options) - 恢复默认视角
    - flyToPosition(position, orientation, options) - 飞行到指定位置
    - startOrbit(center, options) - 开始环绕动画
    - stopOrbit() - 停止环绕动画
    - setCameraBounds(bounds) - 设置相机边界
    - exportBookmarks() / importBookmarks(json) - 导入导出书签

* MaterialSystem 材质与状态表达系统
  * 功能：
    - PBR 材质运行时调整（基础色/金属度/粗糙度/自发光）
    - 按 glTF 材质或节点区分高亮
    - 状态高亮（选中/告警/警告/离线）
    - 相别高亮（A相-黄/B相-绿/C相-红）
    - 不支持 PBR 模型的降级策略
  * 配置参数：
    ```javascript
    {
      enablePBR: true,                // 启用 PBR 材质调整
      fallbackStrategy: 'color',      // 降级策略：'color' | 'silhouette' | 'both'
      highlightIntensity: 0.3,        // 高亮强度
      selectedColor: Cesium.Color,    // 选中颜色
      alarmColor: Cesium.Color,       // 告警颜色
      warningColor: Cesium.Color,     // 警告颜色
      seriousColor: Cesium.Color,     // 严重告警颜色
      offlineColor: Cesium.Color,     // 离线颜色
      phaseColors: {                  // 相别颜色
        A: Cesium.Color,              // A相-黄色
        B: Cesium.Color,              // B相-绿色
        C: Cesium.Color               // C相-红色
      },
      emissiveIntensity: 0.5          // 自发光强度
    }
    ```
  * 主要方法：
    - isPBRSupported(model) - 检查模型是否支持 PBR
    - getMaterials(model) - 获取模型材质列表
    - getNodes(model) - 获取模型节点列表
    - setSelectedHighlight(model, options) - 设置选中高亮
    - setAlarmHighlight(model, level, options) - 设置告警高亮
    - setPhaseHighlight(model, phase, options) - 设置相别高亮
    - setMaterialHighlight(model, materialNameOrIndex, color, options) - 按材质高亮
    - setNodeHighlight(model, nodeNameOrIndex, color, options) - 按节点高亮
    - adjustPBRParams(model, params) - 调整 PBR 参数
    - clearHighlight(model, modelId) - 清除高亮
    - batchSetStatusColor(models, statusField) - 批量设置状态色

* LightingSystem 场景光影系统
  * 功能：
    - 主方向光 + 环境光控制
    - 简易 IBL（基于图像的照明）
    - 模型投射/接收阴影
    - 透明背景兼容
    - 性能自动降级
  * 配置参数：
    ```javascript
    {
      stageMode: true,                // 舞台模式（关闭全球地形与天空）
      transparentBackground: true,    // 透明背景
      directionalLight: {             // 主方向光
        enabled: true,
        direction: Cesium.Cartesian3,
        color: Cesium.Color,
        intensity: 1.0
      },
      ambientLight: {                 // 环境光
        enabled: true,
        color: Cesium.Color,
        intensity: 0.4
      },
      shadows: {                      // 阴影
        enabled: false,
        mapSize: 2048,
        darkness: 0.3,
        normalOffset: true,
        softShadows: false
      },
      ibl: {                          // IBL
        enabled: false,
        environmentMapUrl: null,
        diffuseIntensity: 0.5,
        specularIntensity: 0.5
      },
      hdr: {                          // HDR
        enabled: false,
        exposure: 1.0,
        gamma: 2.2
      },
      performance: {                  // 性能
        autoDowngrade: true,
        fpsThreshold: 30,
        checkInterval: 5000
      }
    }
    ```
  * 主要方法：
    - setDirectionalLight(config) - 设置方向光
    - setAmbientLight(config) - 设置环境光
    - setShadows(enabled, options) - 设置阴影
    - setModelShadows(model, options) - 设置模型阴影属性
    - setIBL(enabled, options) - 设置 IBL
    - setHDR(enabled, options) - 设置 HDR
    - setTransparentBackground(enabled, options) - 设置透明背景
    - exportConfig() / importConfig(json) - 导入导出配置
    - restoreOriginal() - 恢复到原始状态

* VisualizationPanel 可视化控制面板
  * 功能：
    - 整合相机、材质、光影三大系统
    - 提供统一的 UI 控制界面
    - 支持自定义容器或浮动面板
  * 配置参数：
    ```javascript
    {
      container: null,                // 自定义容器
      position: 'right',              // 面板位置：'left' | 'right'
      width: '320px',                 // 面板宽度
      collapsed: false,               // 默认折叠状态
      camera: {},                     // CameraSystem 配置
      material: {},                   // MaterialSystem 配置
      lighting: {}                    // LightingSystem 配置
    }
    ```
  * 主要方法：
    - setSelectedModel(model) - 设置当前选中的模型
    - setVisible(visible) - 显示/隐藏面板
    - destroy() - 销毁面板

* 新增对外 API
  ```javascript
  // 创建各系统实例
  pd3d.createCameraSystem(viewer, options)
  pd3d.createMaterialSystem(viewer, options)
  pd3d.createLightingSystem(viewer, options)
  pd3d.createVisualizationPanel(viewer, options)
  
  // 直接使用类（高级用户）
  pd3d.CameraSystem
  pd3d.MaterialSystem
  pd3d.LightingSystem
  pd3d.VisualizationPanel
  ```

* Cesium类

---

## 可视化与交互增强 - 使用示例

### 1. 相机系统使用示例

```javascript
// 创建相机系统
const cameraSystem = pd3d.createCameraSystem(viewer, {
  minimumZoomDistance: 10,
  maximumZoomDistance: 10000
});

// 保存视角书签
cameraSystem.saveBookmark('巡视视角', { type: 'monitor' });
cameraSystem.saveBookmark('细节观察', { type: 'detail' });

// 加载视角
cameraSystem.loadBookmark('巡视视角', { duration: 2.0 });

// 环绕动画
cameraSystem.startOrbit(
  { longitude: 0, latitude: 0, height: 0 },
  { radius: 150, speed: 0.005 }
);

// 停止环绕
cameraSystem.stopOrbit();
```

### 2. 材质系统使用示例

```javascript
// 创建材质系统
const materialSystem = pd3d.createMaterialSystem(viewer, {
  enablePBR: true
});

// 设置选中高亮
materialSystem.setSelectedHighlight(model);

// 设置告警高亮
materialSystem.setAlarmHighlight(model, 'alarm');  // 告警
materialSystem.setAlarmHighlight(model, 'serious'); // 严重告警

// 设置相别高亮
materialSystem.setPhaseHighlight(model, 'A'); // A相-黄色
materialSystem.setPhaseHighlight(model, 'B'); // B相-绿色
materialSystem.setPhaseHighlight(model, 'C'); // C相-红色

// 调整 PBR 参数
materialSystem.adjustPBRParams(model, {
  metallic: 0.8,
  roughness: 0.3,
  baseColor: Cesium.Color.RED
});

// 清除高亮
materialSystem.clearHighlight(model, model.id);
```

### 3. 光影系统使用示例

```javascript
// 创建光影系统
const lightingSystem = pd3d.createLightingSystem(viewer, {
  stageMode: true,
  transparentBackground: true
});

// 设置方向光
lightingSystem.setDirectionalLight({
  enabled: true,
  intensity: 1.2,
  color: Cesium.Color.WHITE
});

// 启用阴影（注意性能消耗）
lightingSystem.setShadows(true, {
  mapSize: 2048,
  darkness: 0.3
});

// 设置模型阴影属性
lightingSystem.setModelShadows(model, {
  cast: true,
  receive: true
});

// 切换透明背景
lightingSystem.setTransparentBackground(true);  // 透明（适合截图叠加）
lightingSystem.setTransparentBackground(false, {
  backgroundColor: new Cesium.Color(0.05, 0.18, 0.35, 1.0)
}); // 深色背景
```

### 4. 可视化面板使用示例

```javascript
// 创建完整控制面板
const panel = pd3d.createVisualizationPanel(viewer, {
  position: 'right',
  width: '350px'
});

// 设置当前选中的模型
panel.setSelectedModel(model);

// 显示/隐藏面板
panel.setVisible(true);
```

### 5. 完整集成示例

```javascript
// 初始化场景后
const viewer = pd3d.view3d('container', opts);

// 创建可视化增强系统
const cameraSystem = pd3d.createCameraSystem(viewer.viewer);
const materialSystem = pd3d.createMaterialSystem(viewer.viewer);
const lightingSystem = pd3d.createLightingSystem(viewer.viewer);

// 预设巡视视角和细节观察视角
cameraSystem.saveBookmark('巡视视角', { type: 'monitor' });
cameraSystem.saveBookmark('细节观察', { type: 'detail' });

// 根据设备状态设置高亮
if (deviceStatus === 'alarm') {
  materialSystem.setAlarmHighlight(model, 'alarm');
} else if (deviceStatus === 'selected') {
  materialSystem.setSelectedHighlight(model);
}

// 根据相别设置颜色
if (phase) {
  materialSystem.setPhaseHighlight(model, phase);
}
```

---

## 演示入口

访问 `public/visualization-demo.html` 查看完整功能演示，包括：
- 视角书签管理
- 相机环绕动画
- 缩放边界控制
- 状态高亮（选中/告警/警告/离线）
- 相别高亮（A/B/C相）
- PBR 材质参数调整
- 方向光/环境光控制
- 阴影开关
- 透明/深色背景切换




