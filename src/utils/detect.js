
import { arrayCombinedDifference } from '../utils';
import { cesiumColor } from '../utils/cesiumUtils'
//从设备名称字符串中获取相别
let getPhaseByName = (name) => {
    let phase = ''
    if (name !== '') {
        let nameArr = name.split('_');
        if (nameArr && nameArr.length > 0) {
            phase = nameArr[nameArr.length - 1]
        }
    }
    return phase
}
//根据是否支持连续点击配置，返回被点击设备模型的相别集合
let handlerIsContinuousClick = (selectedPhase, IsContinuousClick, phaseArr) => {
    let phaseList = [];
    if (IsContinuousClick + '' == 'true') {
        //支持连续点击时，将选中设备模型的相别，去重后追加到phaseArr中；
        //为了支持，二次点击同一个相别，取消选中效果；添加数组中如果有就删除，如果没有就添加逻辑
        phaseList = arrayCombinedDifference(phaseArr, [selectedPhase])
    } else if (IsContinuousClick + '' == 'false') {
        // 不支持连续点击时，直接返回选中设备模型的相位
        phaseList.push(selectedPhase)
    }
    return phaseList
}
//获取相同相别的模型实体
//entityArr设备模型实体集合
//phaseArrRes被选中的相别集合
//更新模型实体是否被选中的状态，被选中的isSelected设置为true
let getEntityBySamePhase = (entityArr, phaseArrRes) => {
    //let phaseArrRes = handlerIsContinuousClick(selectedEntryName, IsContinuousClick, phaseArr)
    if (entityArr && entityArr.length > 0) {
        entityArr.map(item => {
            let itemPhase = getPhaseByName(item.id)
            let flag = phaseArrRes.indexOf(itemPhase) > -1//相别集合中是否包含当前相别
            item.isSelected = itemPhase !== '' ? flag : false
        })
    }
    return { entityArr, phaseArrRes }
}
/*
* 修改primitive添加的模型实体的颜色
* 
*/
let changePrimitiveEntityColor = (entityArr) => {
    entityArr.map((item) => {
        if (item.isSelected) {
            let v = {
                "red": 0.09411764705882353,
                "green": 0.5647058823529412,
                "blue": 1,
                "alpha": 1
            }
            item.color = cesiumColor(v.red, v.green, v.blue, v.alpha)
            item.colorBlendAmount = 0.3
        } else {
            item.colorBlendAmount = 0.0
        }
    })
}

export {
    getPhaseByName,
    handlerIsContinuousClick,
    changePrimitiveEntityColor,
    getEntityBySamePhase,
}