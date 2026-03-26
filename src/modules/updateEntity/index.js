import { changePrimitiveEntityColor, getEntityBySamePhase } from '../../utils/detect';

class UpdateEntity {
    constructor(viewer, entityArr) {
        this.viewer = viewer;
        this.entityArr = entityArr;
    }
    //phaseArr:包含当前被选中的相别名称集合
    //flag：是否触发postMessage事件
    updateEntityByPhase(phaseArr, flag) {
        let entitryRes = getEntityBySamePhase(this.entityArr, phaseArr)
        let phaseNames = entitryRes.phaseArrRes ? entitryRes.phaseArrRes.join(',') : '';
        //触发父页面的点击事件
        if (flag) {
            // console.log('phaseNames::' + phaseNames)
            window.postMessage({ phaseNames: phaseNames }, '*');
        }
        //更新实体颜色
        changePrimitiveEntityColor(entitryRes.entityArr)
    }
}
export default UpdateEntity;