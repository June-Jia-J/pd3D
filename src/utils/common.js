import { CAMERA_HEADING_FRONT } from '../constants';

//处理模型位置按行排列
//index 模型当前的序号；
//pos 模型的位置；
//num 每行显示的模型数量；
let getArrangeInRowData = (index, pos, num) => {
    var position = {};
    let h = 12 * Math.floor(index / num);
    let lonp = 0.0002 * (index % num);
    position.lon = pos.lon + lonp - 0.001;
    position.lat = pos.lat;
    position.alt = pos.alt - h;
    return position;
};

//返回字符串，从位置cha字符串结尾
let findEndStr = (str, cha, num) => {
    var x = str.indexOf(cha);
    for (var i = 0; i < num; i++) {
        x = str.indexOf(cha, x + 1);
    }
    return x;
}

//获取标签的前后方向值
let getLabelOri = (heading) => {
    let labelOri = 'front';
    if (heading > CAMERA_HEADING_FRONT.MIN && heading < CAMERA_HEADING_FRONT.MAX) {
        labelOri = 'after';
    } else {
        labelOri = 'front';
    }
    return labelOri;
}


export { getArrangeInRowData, findEndStr, getLabelOri }
