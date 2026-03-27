# 三维组件库 pd3d（V1.6.0）

    pd3d是基于开源平台Cesium封装的设备层级三维模型加载与应用的组件库；
  -  [Cesium](https://cesium.com/cesiumjs/)
       - 一个跨平台、跨浏览器的展示三维和地图的JavaScript库;
       - 浏览器必须支持WebGL; 使用WebGL进行硬件加速图形，使用时不需要任何插件;
       - 📗 License:基于Apache2.0许可的开源程序，可以免费的用于商业和非商业用途。
  -  WebGL
     -  WebGL是一种3D绘图标准,可以为HTML5 Canvas提供硬件3D加速渲染，以借助系统显卡来在浏览器里更流畅地展示3D场景和模型;
     -  [查看浏览器对webgl的支持](http://caniuse.com)

pd3d支持的应用功能：

 * 设备与传感器模型可视化展示；
 * 显示传感器的实时数据；
 * 显示设备和传感器的报警状态；
 * 模型自旋转与停止旋转；
 * 场景视角复原；
 * 上传设备模型；
 * 在线编辑传感器位置；
 * 编辑当前场景视角；

## 使用说明

### `> 1. 引用说明`

  在使用时，需要在HTML页面中添加`pd3d.min.js`和`Cesium.js`（由于`pd3d`依赖于`Cesium`，点击下载[Cesium](https://cesium.com/downloads/)）的引用，引用方式如下：

```js
  <script type="text/javascript" src='Cesium.js'></script>
  <script type="text/javascript" src='pd3d.min.js'></script>
```

### `> 2. 接口说明`

  pd3d对外提供以下接口：
  - `view3d`: 三维可视化展示实现，设备模型与关联的传感器模型显示；
  - `edit3d`: 三维模型在线编辑实现；
  - `refreshStatus`: 更新设备和传感器模型状态（根据测点状态）；
  - `refreshSensorStatusByAdu`: 更新传感器模型状态（根据传感器状态）；
  - `refreshLatestData`: 更新传感器的最新数据；
  - `updateToolBarStyle`: 修改工具条的位置；
  - `uploadBtnClick`: 上传按钮的点击事件；
  - `editBtnClick`: 编辑按钮的点击事件；
  - `show3d`:三维可视化展示实现，单个模型的显示，设备/传感器；
  - `updateIsContinuousClick`:支持detect模式下，选中模型时，切换是否支持连续点击事件；
  - `updateEntityByPhase`:支持detect模式下，根据传入的相别名称集合更新设备实体模型的为选中状态；

  详细说明：

#### `> 2.1 view3d(elementId, data,result，application)`

  是三维模型可视化应用的核心接口，包含三维场景的渲染，设备与传感器模型的加载，模型旋转，实时数据显示等功能；
  *   `elementId`: 加载三维场景的页面div元素id;
  *   `data`: 相关数据参数，包括{device3D, params, position, toolBar}
      *   `device3D`: 设备与传感器模型信息，数据格式参考[数据结构说明->device3D](#41-device3d);
      *   `params`:其他相关参数，数据格式参考[数据结构说明->params](#42-params);
      *   `position`:设备模型的初始地理位置，数据格式参考[数据结构说明->position](#43-position);；
      *   `toolBar`: 设置工具栏中每个工具的显隐和相关属性的对象；数据格式参考[数据结构说明->toolbar](#44-toolbar);
  *   `result`:view3d接口的返回值
  *   `application`:支持的应用，'monitor'/'detect'  默认'monitor',分别对应-->在线监测应用和带电检测应用
  返回值：view3d的实例化对象；  

  引用示例：
  
```js
  import { view3d } from 'pd3d';
  //初始化三维模型加载
  let view0 =view3d(this.cesiumContainer3d, data,view0,'monitor');
```
  说明：
  - 本文中的示例均应用在React框架开发下；
  - this.cesiumContainer3d：为React中定义的元素div的ref,获取方法：ref={(element) => (this.cesiumContainer3d = element)}；
  - data：数据格式参考[数据结构说明](#4-数据结构说明)；
  - application-'monitor':在线监测应用：加载传感器模型，点击传感器，返回传感器id;监听传感器报警状态更新；加载设备模型，无响应事件，支持更新标签。
  - application-'detect'：带电检测应用：无传感器模型；加载设备模型，点击设备，根据点击区域的设备相别，高亮显示同相别设备模型，支持连续点击；返回选中的相别。

#### `> 2.2 edit3d(elementId, data,result)` 

  是实现在线编辑的核心接口，包含在线编辑传感器位置，编辑当前场景视角等功能；
  *   `elementId`: 加载三维场景的页面div元素id；
  *   `data`: 相关数据参数，包括{device3D, params}
      *   `device3D`: 与view3d中的device3D相同，设备与传感器模型信息，数据格式参考[数据结构说明->device3D](#41-device3d);
      *   `params`: 与view3d中的device3D相同，其他相关参数，数据格式参考[数据结构说明->params](#42-params);
  *   `result`:edit3d接口的返回值
  引用示例：
  
```js
  import { edit3d } from 'pd3d';
  //初始化三维模型编辑
  let edit0 =edit3d(this.cesiumContainer3d, data,edit0);
```

#### `> 2.3 refreshStatus(dataStatusUpdate,data, latestData,deviceType)` 

  用于更新模型的颜色状态；
  *  `dataStatusUpdate`:view3d返回的dataStatusUpdate实例；
  *   `data`: 该设备绑定的传感器列表，包括传感器的状态和所监测的设备编码集合deviceIds，数据格式参考[数据结构说明->sensorList](#45-sensorlist)；
  *   `latestData`:该设备绑定的所有测点的最新数据和状态列表，数据格式参考[数据结构说明->latestData](#46-latestdata)；
  *   `deviceType`: 设备类型的枚举值；

#### `> 2.4 refreshSensorStatusByAdu(dataStatusUpdate,latestData,deviceType)` 

  用于更新传感器模型的颜色状态；
  *  `dataStatusUpdate`:view3d返回的dataStatusUpdate实例；
  *  `latestData`:该设备绑定的所有传感器的最新数据和状态列表，数据格式参考[数据结构说明->latestData](#46-latestdata)；

#### `> 2.5 refreshLatestData(dataStatusUpdate,data)` 

用于更新传感器的实时数据信息；
  *  `dataStatusUpdate`:view3d返回的dataStatusUpdate实例；
  *  `data`: 该设备绑定的所有测点的最新数据和状态列表，数据格式参考[数据结构说明->latestData](#46-latestdata)；

#### `> 2.6 updateToolBarStyle(data，elementId)` 

  用于修改工具栏在页面上的相对位置；
  * `data`: style.cssText支持的格式；
  * `elementId`: 加载三维场景的页面div元素id；

  引用示例：
```js
  import { updateToolBarStyle } from 'pd3d';
  //修改toolBar的位置
  updateToolBarStyle('right: 30rem;',this.cesiumContainer3d);
```

#### `> 2.7 uploadBtnClick(data)` 

  功能待实现；

  上传设备模型的点击监听事件，方便在应用开发时处理该事件；
  * `data`：返回组件库中需要返回的数据；  引用示例：
```js
  //在toolBar参数的upload-->click中调用；
  uploadBtnClick = () => {
    //处理上传设备模型按钮的点击事件逻辑
  };
```

#### `> 2.8 editBtnClick()` 

  编辑按钮的点击事件，方便在应用开发时处理该事件；

  引用示例：
```js
  //在toolBar参数的edit-->click中调用；
  editBtnClick = () => {
    //处理编辑按钮的点击事件逻辑
  };
```
#### `> 2.9 show3d(elementId, data,result)`

  是三维模型可视化应用的核心接口，包含三维场景的渲染，模型的加载、旋转与场景位置保存等功能；
  *   `elementId`: 加载三维场景的页面div元素id;
  *   `data`: 相关数据参数，包括{dataRes, params, toolBar}
      *   `dataRes`: 模型信息，数据格式参考[数据结构说明->dataRes](#47-datares);
      *   `params`:其他相关参数，数据格式参考[数据结构说明->params](#42-params);
      *   `toolBar`: 设置工具栏中每个工具的显隐和相关属性的对象；数据格式参考[数据结构说明->toolbar](#44-toolbar);
  *   `result`:view3d接口的返回值
  返回值：show3d的实例化对象；  

  引用示例：
  
```js
  import { show3d } from 'pd3d';
  //初始化三维模型加载
  let show0 =show3d(this.cesiumContainer3d, data,show0);
```
  说明：
  - 本文中的示例均应用在React框架开发下；
  - this.cesiumContainer3d：为React中定义的元素div的ref,获取方法：ref={(element) => (this.cesiumContainer3d = element)}；
  - data：数据格式参考[数据结构说明](#4-数据结构说明)；

#### `> 2.10 updateIsContinuousClick(result,checked)` 

     view3d中application为'detect'时，点击设备是否支持连续点击,在应用开发时更新是否支持连续点击状态；
  *   `result`:view3d接口的返回值
  *   `checked`:是否支持，boolean值。true支持连续点击，false不支持连续点击，默认false.


  引用示例：
```js
  //更新是否支持连续点击状态
  updateIsContinuousClick(view0,true);
```
#### `> 2.11 updateEntityByPhase(view0,phase,flag)` 

     view3d中application为'detect'时，根据传入的相别，更新设备实体模型的选中状态；
  *   `view0`:view3d接口的返回值
  *   `phase`:包含相别名称的数组集合.如['A','B','C','NOPHASE']，
  *   `flag`:标识是否触发postMessage事件，true 触发；false 不触发


  引用示例：
```js
  //更新相别是'A','B','C','NOPHASE'的设备模型为选中状态
  updateEntityByPhase(view0,['A','B','C','NOPHASE']，true);
```

### 3. 点击交互说明

    获取点击事件后返回的数据；通过绑定window的message事件来监听发送跨文档消息传输内容。
```js
window.addEventListener('message', (event) => {
            //返回点击事件返回的数据；
            console.log(event.modelId);
            console.log(event.modelPositionList);
            console.log(event.scenePosition);
        });
```

#### 3.1 传感器点击事件

    在view3d环境下，点击传感器，返回传感器的sensorId;
    message返回值：
  * `modelId`：传感器的sensorId；

#### 3.2 传感器位置编辑保存

    在edit3d环境下，点击'保存传感器位置'，返回传感器的位置信息；
  * `modelPositionList`：传感器的位置信息；

#### 3.3 场景保存

    在edit3d环境下，点击'保存当前场景'，返回当前场景的位置信息；
  * `scenePosition`：当前场景的位置信息；

#### 3.4 设备点击事件

    在view3d环境下，application为'detect'时，点击设备，返回当前选中设备的相别，连续点击状态，返回所有选中的设备相别；
  * `phaseNames`：当前选中设备的相别集合（逗号，分割的字符串）

  

### 4. 数据结构说明
  #### 4.1 device3D

  设备模型相关的信息

  * `desOri`: 设备模型在场景中的位置与方位角；
  * `deviceUrl`: 设备模型信息列表;
    * `id`: 设备id;
    * `url`: 设备模型在服务端存放的路径信息；
  * `id`: 设备id,在组合电器GIS中为虚拟间隔id；
  * `sensorList`: 传感器模型信息列表;
    * `deviceIds`: 传感器监测的设备id集合;
    * `id`: 传感器id;
    * `labelOrientation`: 模型标签的方向,'front'|'after';
    * `position`: 模型位置和方位角；
    * `size`: 模型大小；
    * `status`: 传感器状态；
    * `testpointList`: 测点列表；
      * `channelType`: 测点通道类型枚举；
      * `status`: 测点状态；
      * `testpointId`: 测点id；
    * `type`: 传感器类型枚举；
    * `url`: 传感器模型在服务端存放的位置；

    - 说明： 
    - `位置与方位角position`:
  
      "{\"heading\":5.596585471997696,\"picth\":-0.2976971550890939,\"alt\":642.66017933799,\"roll\":8.025346547313461E-7,\"lon\":0.008070430016415013,\"lat\":-0.010358028088785791}"

```js
{
  "desOri":`position`,
  "deviceUrl":[
    {
      "id":"135001",
      "url":"3dModels\\device\\transformer\\ZBYQ01.gltf"
    }
  ],
  "id":"135001",
  "sensorList":[
    {
      "deviceIds":["135001"],
      "id":"00:00:00:00:15:59:9D:67",
      "labelOrientation":"front",
      "position":`position`,
      "size":90,
      "status":0,
      "testpointList":[
        {
          "channelType":7,
          "status":0,
          "testpointId":"205_UHFSPDC2"
        },
        {
          "channelType":7,
          "status":0,
          "testpointId":"205_UHFSPDC2"
        },
      ],
      "type":2,
      "url":"3dModels/sensor/UHF.gltf"
    },
  ]
}
```

  #### 4.2 params

  其他相关参数（接口中没有返回，或者补充的参数）

  * `resourceProUrl`:url地址+resource资源文件路径前缀；eg:url=`http//127.0.0.1:8080`;resource=`/resource\\`;
  * `deviceType`:设备类型
  * `deviceName`:设备名称
  * `statusColor`:报警颜色设置，包含预警WARNING、报警ALARM、严重SERIOUS、失联LOSTCONNECT四个对象；
  * `category`:模型类型  1 设备模型   2 传感器模型
```js
{
  resourceProUrl: `http//127.0.0.1:8080/resource\\`,
  deviceType: 32,
  deviceName: '组合电器001',
  statusColor: {
    SERIOUS: [251, 75, 28, 255],
    ALARM: [255, 227, 61, 255],
    WARNING: [81, 247, 187, 255],
    LOSTCONNECT:[118, 121, 125, 255],//失联
  }
  category: 1,//模型类型  1 设备模型   2 传感器模型
 };
```

  #### 4.3 position

    设备的初始坐标位置（一般不设置），默认都是0，坐标格式是地理坐标；
```js
{
    lon: 116.3801,
    lat: 39.9874,
    alt: 12.0,
    heading: 0,
    pitch: 0,
    roll: 0,
};
```



  #### 4.4 toolBar

  工具栏中内容是否显示与其他属性值设置;

  * `initpos`: 回到初始位置
    * `display`: 是否显示回到初始化按钮，默认显示；
    * `title`: 描述（支持多语言）； 
  * `rotate`: 旋转
    * `display`: 是否显示旋转按钮，默认显示；
    * `direction`: 旋转方向； 
    * `attribute`: [],包含两个title对象，分别表示旋转与停止旋转的描述信息；
      * `title`:旋转描述；
      * `title`:停止旋转描述；
  * `popup`: 气泡实时数据
    * `display`: 默认显示该按钮，默认显示；
    * `default`: 是否加载气泡， 默认不加载；
    * `style`: 设置气泡相对传感器的位置：eg:"top:30px;left:-20px",
    * `title`: 描述；
  * `upload`: 上传模型按钮；
    * `display`: 默认显示；
    * `click`: 上传模型按钮点击事件；
    * `title`: 描述；
  * `edit`: 编辑按钮，默认不显示；
    * `display`: 默认不显示；
    * `click`: 编辑模型按钮点击事件；
    * `title`: 描述；
view3d,edit3d和show3d支持的内容如示例所示;
* view3d示例：
```js
{
  initpos: {
      display: true,
      title:'chushihua',
  },
  rotate: {
      display: true, //是否显示旋转按钮
      direction: 'right', //旋转方向,默认右转
      attribute: [
            { title: 'xuanzhuan' },
            { title: 'tingzhixuanzhuan' },
          ],
  },
  popup: {
      default: false, //默认显示状态
      display: true, //是否显示气泡显示按钮
      style: 'top:4rem;left:-0.5rem',
      title:'实时数据',
  },
  upload: {
      display: false,
      click: uploadBtnClick,//点击事件   
      title:'upload',
  },
  edit: {
      display: false,
      click: editBtnClick,//点击事件
      title:'bianji',
  },
};
```
* edit3d示例：
```js
{
  initpos: {//回到初始位置,默认显示
      display: true,
      title:'chushihua',
    },
    saveScene: {
      display: true,
      title:'baocunScene',
    },
    savePosition: {
      display: true,
      title:'baocunweizhi',
    },
    resetPosition: {
      display: true,
      title:'chongzhiweizhi',
    },
    operaDes: {
      display: true,
      title:'caozuoshuoming',
        content: {
          text: '操作说明',
          direction: '方向',
          directionLeftRight: '左/右',
          directionFrontAfter: '前/后',
          directionHighLow: '高/低',
          size: '尺寸',
          sizeLargeSmall: '大/小',
          rotate: '旋转',
          rotateRollLeft: '向左翻转',
          rotateLeft: '左转',
          rotateRollRight: '向右翻转',
          rotateRight: '右转',
          rotatePitchUp: '向上拉高',
          rotatePitchDown: '向下俯冲',
        },
    },
};
```
* show3d示例：
```js
{
  initpos: {
    //回到初始位置,默认显示
    display: true,
  },
  rotate: {
    display: true, //旋转按钮,默认显示
    direction: 'right', //旋转方向,默认右转
  },
  saveScene: {
    display: true,
  },
};
```
  #### 4.5 sensorList

  数据来源于device3D-->sensorList；

  * `sensorList`: 传感器模型信息列表；
  * `deviceIds` : 传感器监测的设备id集合；
  * `id`: 传感器id；
  * `labelOrientation`: 模型标签的方向,'front'|'after'；
  * `position`: 模型位置和方位角；
  * `size`: 模型大小；
  * `status`: 传感器状态；
  * `testpointList`: 测点列表；
    * `channelType`: 测点通道类型枚举；
    * `status`: 测点状态；
    * `testpointId`: 测点id；
  * `type`: 传感器类型枚举；
  * `url`: 传感器模型在服务端存放的位置；
  
  #### 4.6 latestData

  设备下所有测点的最新数据列表；

  * `dataObject`: 测点数据值对象，不同数据类型的测点返回的dataObject不同；
  * `dataType`: 测点的数据类型；
  * `status`: 测点的状态；
  * `testpointId`: 测点编码；
  * `testpointName`: 测点名称；
```js
[
  {
    "daqtime":1574870400,
    "dataObject":{
      "dataUnit":1,
      "devModel":null,
      "devSerialNumber":null,
      "diagResult":null,
      "frequency":0,
      "frequency1":-15.0,
      "frequency2":-15.0,
      "gain":"100dB",
      "isBackgroundValue":null,
      "isPd":0,
      "peak":4.0,
      "rms":2.0,
      "sampleCount":0,
      "sampleRate":0,
      "signalsource":null,
      "spectrum":null,
      "testData":"205/20191128/011001_135001_205_AESPDC1_000000.dat"
    },
    "dataType":4,
    "status":0,
    "testpointId":"205_AESPDC1",
    "testpointName":"一号主变超声波高压侧测点1"
  }
]
```

#### 4.7 dataRes
模型的空间信息数据；

  * `id`: 模型的主键id；
  * `url`: 模型的URL地址列表；
  * `desOri`: 模型的视角；
  * `position`: 模型的位置；
  * `size`: 模型的尺寸；
```js
[
  {
    "id": "1234",
    "url": [
        {"id": "1234", "url": "/3dmodels/device/2229/center-A.gltf"}
        {"id": "1234", "url": "/3dmodels/device/2229/center-B.gltf"}
    ],
    "desOri": '{"lon":0.004828389114600641,"lat":-0.0114394143972348,"alt":581.6724574640796,"heading":5.8992675904372796,"picth":-0.29738117202511893,"roll":5.776062632634194e-7}',
    "position":null,
    "size":80,
  }
]
```



