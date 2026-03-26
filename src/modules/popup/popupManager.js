import { getTypeEnum } from '../../utils/enum';
import { isEmpty } from '../../utils';
import { getLabelOri } from '../../utils/common';
import { cartesian3FromDegrees, wgs84ToWindowCoordinates } from '../../utils/cesiumUtils'

let popWin = (sensorId, showDefault, style) => {
    var id = sensorId == undefined ? 'trackPopUpContent' : `trackPopUpContent${sensorId}`;
    let displayDef = showDefault ? 'block' : 'none';
    var infoDiv =
        '<div class="trackPopUp" style="display:' + displayDef + '">' +
        '<div type="' +
        `${id}` +
        '" class="leaflet-popup" style="' + style + ';">' +
        '<div class="leaflet-popup-content-wrapper">' +
        '<div class="trackPopUpLink" class="leaflet-popup-content" style="max-width: 300px;"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    var node = new DOMParser().parseFromString(infoDiv, 'text/html').body.childNodes[0];
    document.getElementById('bubble2').appendChild(node);
};

let winContent = (id, sensorList) => {
    var content = '',
        testPointList = [];
    if (sensorList.length > 0) {
        sensorList.map((item) => {
            if (item.id == id) {
                if (!isEmpty(item.testpointList)) {
                    testPointList = item.testpointList;
                }
            }
        });
    }
    if (testPointList.length > 0) {
        testPointList.map((tpItem) => {
            var typeName = getTypeEnum(tpItem.channelType);
            content += `<div id='${tpItem.testpointId}'><span class='name'>${typeName}</span><span class='value' ></span><span class='unit'></span></div>`;
        });
    }
    var nodeContent = new DOMParser().parseFromString(content, 'text/html').body.childNodes[0];
    return nodeContent;
};

let positionPopUp = (c, id) => {
    var trackPopUpContentEl = document.querySelector(`div[type="trackPopUpContent${id}"]`);
    if (trackPopUpContentEl !== null) {
        var width = trackPopUpContentEl.style.width;
        var height = trackPopUpContentEl.style.height;
        var x = c.x - width / 2;
        var y = c.y - height;
        trackPopUpContentEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
};

// 控制传感器显隐
let updateSensorDataDisplay = (displayFlag, sensorList) => {
    if (sensorList.length > 0) {
        sensorList.map((item) => {
            var labelOri = 'front';
            if (!isEmpty(item.position)) {
                var position = JSON.parse(item.position);
                labelOri = getLabelOri(position.heading);
            }
            // item.labelOrientation = labelOri;
            var dFlag = true;
            // if (item.labelOrientation !== null) {
            //     dFlag = displayFlag == item.labelOrientation;
            // }
            if (labelOri !== null) {
                dFlag = displayFlag == labelOri;
            }
            var displayValue = dFlag ? 'block' : 'none';
            var trackPopUpContentEl = document.querySelector(
                `div[type="trackPopUpContent${item.id}"]`
            );
            if (trackPopUpContentEl) {
                trackPopUpContentEl.style.display = displayValue;
            }
        });
    }
};

//根据第一个传感器的屏幕位置判断scene是否移动
let getFirstSensorScreenPosition = (viewer, sensorList) => {
    var change;
    if (sensorList.length > 0) {
        var cData0 = sensorList[0];
        var cp0 = { lon: 0, lat: 0, alt: 0 };
        if (cData0.position) {
            cp0 = JSON.parse(cData0.position);
        }
        var c0 = cartesian3FromDegrees(cp0.lon, cp0.lat, cp0.alt);
        change = wgs84ToWindowCoordinates(viewer.scene, c0);
    }
    if (change == undefined || change == null) {
        change = { x: 0, y: 0 };
    }
    return { x: Number(change.x).toFixed(4), y: Number(change.y).toFixed(4) };
};

export {
    popWin,
    winContent,
    positionPopUp,
    updateSensorDataDisplay,
    getFirstSensorScreenPosition,
}
