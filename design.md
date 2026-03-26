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

* Cesium类




