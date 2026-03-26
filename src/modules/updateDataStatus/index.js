import { updateModelStatus, updateDeviceModelStatus, updateRealData } from '../../utils/container';
import { isEmpty } from '../../utils';
import { getModelColor } from '../../utils/enum';
class UpdateDataStatus {
    constructor(viewer, sensorEntityArr, deviceEntityArr, statusColor, sensorStatusEvent, oldColorList, sensorList) {
        this.viewer = viewer;
        this.sensorEntityArr = sensorEntityArr;
        this.deviceEntityArr = deviceEntityArr;
        this.statusColor = getModelColor(statusColor);
        this.sensorStatusEvent = sensorStatusEvent;
        this.oldColorList = oldColorList;
        this.sensorList = sensorList;
    }

    //更新传感器的状态值
    updataSensorListStatus(sensorList, latestData) {
        //从lastData筛选出该sensorId下的testpointList；(取交集)
        //对比status状态，返回最大值；
        //将该最大值赋值给该sensorId的status
        //返回sensorList;
        if (!isEmpty(sensorList)) {
            sensorList.map(item => {
                let tpList = item.testpointList;
                let tpArr = [...latestData].filter(x => [...tpList].some(y => y.testpointId == x.testpointId));
                if (!isEmpty(tpArr)) {
                    let maxObj = tpArr.reduce((p, v) => p.status < v.status ? v : p);
                    item.status = maxObj.status;
                }
            });
        }
        return sensorList;
    }

    //刷新设备和传感器模型状态--父页面监控  ，根据testpointId和testpoint.status
    // refrashDeviceStatus = (data, deviceType) => {
    refrashDeviceStatus = (sensorList, latestData, deviceType) => {
        let data = this.updataSensorListStatus(sensorList, latestData);
        if (this.viewer) {
            var status = 0,
                deviceIds = [];
            if (data && data.length > 0) {
                data.map((item) => {
                    if (this.sensorEntityArr.length > 0) {
                        updateModelStatus(this.sensorEntityArr, item.id, item.status);
                    }
                    if (deviceType !== 1) {
                        if (this.deviceEntityArr.length > 0 && item.deviceIds && item.deviceIds.length > 0) {
                            updateDeviceModelStatus(this.deviceEntityArr, item.deviceIds, item.status);
                        }
                    } else {
                        status = item.status > status ? item.status : status;
                        deviceIds = item.deviceIds;
                    }
                });
            }
            //变压器模型报警特殊处理，传感器中status值最大的作为变压器的报警状态
            if (deviceType == 1) {
                if (this.deviceEntityArr.length > 0 && deviceIds && deviceIds.length > 0) {
                    updateDeviceModelStatus(this.deviceEntityArr, deviceIds, status);
                }
            }
        }
    }
    //修改传感器状态，根据adu.status
    updateSensorStatusByAdu = (latestData, deviceIds, status) => {
        if (!isEmpty(latestData)) {
            latestData.map(item => {
                if (this.sensorEntityArr.length > 0) {
                    updateModelStatus(this.sensorEntityArr, item.aduId, item.status, this.statusColor);
                }
                if (this.deviceEntityArr.length > 0 && !isEmpty(this.sensorList)) {
                    this.sensorList.map(sl => {
                        if (sl.id == item.aduId) {
                            updateDeviceModelStatus(this.deviceEntityArr, sl.deviceIds, item.status);
                        }
                    });
                }
            });
            // if (this.deviceEntityArr.length > 0) {
            //     updateDeviceModelStatus(this.deviceEntityArr, deviceIds, status);
            // }
            // 触发事件
            window.setTimeout(() => {
                if (this.sensorStatusEvent) {
                    this.sensorStatusEvent.latestData = latestData;
                }
                if (window.dispatchEvent) {
                    document.dispatchEvent(this.sensorStatusEvent);
                } else {
                    document.fireEvent(this.sensorStatusEvent);
                }
            }, 100);
        }
    }

    //刷新传感器的最新数据--父页面监控
    refrashSensorLatestData = (data) => {
        if (data && data.length > 0) {
            data.map((dlItem) => {
                var popupWinConEl = document.getElementById(dlItem.testpointId);
                if (popupWinConEl !== undefined && popupWinConEl !== null) {
                    var tpLastRes = updateRealData(dlItem);
                    var valueEl = popupWinConEl.getElementsByClassName('value')[0];
                    if (valueEl) {
                        valueEl.innerText = tpLastRes.value;
                        valueEl.style.color = tpLastRes.color;
                    }
                    var unitEl = popupWinConEl.getElementsByClassName('unit')[0];
                    if (unitEl) {
                        unitEl.innerText = tpLastRes.unit;
                    }
                }
            });
        }
    }
}
export default UpdateDataStatus;