/**
 * 判断入参是否为对象
 * @param {Object} obj 需校验的参数
 */
const isObject = (obj) => {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof obj;
    return type === 'function' || !!obj && type == 'object';
}

/**
 * 节流函数
 * 短时间内触发多次绑定事件造成性能问题，如 onresize,onscroll等，使用节流函数可确保在指定时间内只触发一次
 * @param {Function} func 方法体
 * @param {Number} wait 延迟时长,ms
 * @param {Boolean} immediate 是否立即执行 
 */
export const throttle = (fn, wait = 100, immediate = false) => {
    let timer, timeStamp = 0;
    let context, args;

    let run = () => {
        timer = setTimeout(() => {
            if (!immediate) {
                fn.apply(context, args);
            }
            clearTimeout(timer);
            timer = null;
        }, wait);
    }

    return function () {
        context = this;
        args = arguments;
        if (!timer) {
            console.log("throttle, set");
            if (immediate) {
                fn.apply(context, args);
            }
            run();
        } else {
            console.log("throttle, ignore");
        }
    }

}

/**
 * 防抖函数
 * 强制一个函数在某个连续时间段内只执行一次，哪怕它本来会被调用多次。
 * @param {Function} func 方法体
 * @param {Number} wait 延迟时长,ms
 * @param {Boolean} immediate 是否立即执行 
 */
export const debounce = (fn, wait = 100, immediate = false) => {
    let timer, startTimeStamp = 0;
    let context, args;

    let run = (timerInterval) => {
        timer = setTimeout(() => {
            let now = (new Date()).getTime();
            let interval = now - startTimeStamp
            if (interval < timerInterval) { // the timer start time has been reset，so the interval is less than timerInterval
                console.log('debounce reset', timerInterval - interval);
                startTimeStamp = now;
                run(timerInterval - interval);  // reset timer for left time 
            } else {
                if (!immediate) {
                    fn.apply(context, args);
                }
                clearTimeout(timer);
                timer = null;
            }

        }, timerInterval);
    }

    return function () {
        context = this;
        args = arguments;
        let now = (new Date()).getTime();
        startTimeStamp = now; // set timer start time

        if (!timer) {
            console.log('debounce set', wait);
            if (immediate) {
                fn.apply(context, args);
            }
            run(wait);    // last timer alreay executed, set a new timer
        }

    }
}


/**
 * 多维数组初始化
 * initDimArr( 3, true )  => [true,true,true]
 * initDimArr( 3,3,"x" )  => [['x','x','x'],['x','x','x'],['x','x','x']]
 */
export function initDimArr() {
    var len = arguments.length;
    var args = Array.prototype.slice.call(arguments, 0, len - 1);
    var content = arguments[len - 1];
    var result = [];
    var traverse = function foo(from, deep) {
        var arg = args[deep];
        if (deep < args.length - 1) {
            for (var i = 0; i < arg; i++) {
                var array = [];
                from.push(array);
                foo(array, deep + 1);
            }
        }
        else {
            for (var i = 0; i < arg; i++) {
                if (typeof content === "function") {
                    from.push(content());
                }
                else {
                    from.push(content);
                }
            }
        }
    };
    traverse(result, 0);
    return result;
}

/**
 * 处理浮点数字小数点问题
 * @param {Number} num 待处理浮点数字
 * @param {Number} precision 保留数字个数
 */
export const stripNum = (num = 0, precision = 12) => {
    return parseFloat(num.toPrecision(precision));
}


/**
 * 判断参数是否为空
 * @param {Object} obj 需校验的参数
 */
export const isEmpty = (obj) => {
    if (obj === null || obj === undefined) {
        return true;
    } else if (typeof (obj) === 'number') {
        return false;
    } else {
        if (obj === '') {
            return true;
        }

        let arr = Array.isArray(obj);
        if (arr && arr.length === 0) {
            return true;
        }

        let keys = Object.keys(obj);
        if (keys && keys.length === 0) {
            return true;
        }
    }
    return false;
};

/**
 * 比较两个对象是否一样
 * @param {object} objectA
 * <对象1>
 * @param {object} objectB
 * <对象2>
 */
export const isEqual = (objectA, objectB) => {
    if (objectA && objectB && typeof objectA == 'object' && typeof objectB == 'object') {
        let i, length, key;

        //数组
        let arrA = Array.isArray(objectA),
            arrB = Array.isArray(objectB);
        if (arrA != arrB) return false;
        if (arrA && arrB) {
            length = objectA.length;
            if (length != objectB.length) return false;
            for (i = length; i-- !== 0;) if (!isEqual(objectA[i], objectB[i])) return false;
            return true;
        }

        //时间
        let dateA = objectA instanceof Date,
            dateB = objectA instanceof Date;
        if (dateA != dateB) return false;
        if (dateA && dateB) return objectB.getTime() === objectB.getTime();

        //正则
        let regexpA = objectA instanceof RegExp,
            regexpB = objectA instanceof RegExp;
        if (regexpA != regexpB) return false;
        if (regexpA && regexpB) return objectB.toString() === objectB.toString();

        //对象
        let keys = Object.keys(objectA);
        length = keys.length;
        if (length !== Object.keys(objectB).length) return false;

        for (i = length; i-- !== 0;)
            if (!Object.prototype.hasOwnProperty.call(objectB, keys[i])) return false;

        for (i = length; i-- !== 0;) {
            key = keys[i];
            if (!isEqual(objectA[key], objectB[key])) return false;
        }
        return true;
    }
    //字符串，数字等
    return objectA === objectB;
};

/**
 * 对象深拷贝
 * @param {Object} obj
 */
export const deepClone = (obj) => {
    if (!isObject(obj) || !isObject(obj)) {
        return obj;
    }
    // 判断复制的目标是数组还是对象
    const targetObj = obj.constructor === Array ? [] : {};
    for (let keys in obj) { // 遍历目标
        if (obj.hasOwnProperty(keys)) {
            if (obj[keys] && typeof obj[keys] === 'object') {
                // 如果值是对象，就递归一下
                targetObj[keys] = obj[keys].constructor === Array ? [] : {};
                targetObj[keys] = deepClone(obj[keys]);
            } else {
                // 如果不是，就直接赋值
                targetObj[keys] = obj[keys];
            }
        }
    }
    return targetObj;
};

/**
 * 
 * @param {Object} target 目标对象
 * @param {Object} source 源对象
 * @param {Boolean} overwrite 是否覆盖
 */
export const merge = (target, source, overwrite = false) => {
    if (!isObject(source) || !isObject(target)) {
        return overwrite ? deepClone(source) : target;
    }
    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            let targetProp = target[key];
            let sourceProp = source[key];

            if (isObject(sourceProp) && isObject(targetProp)) {
                // 如果需要递归覆盖，就递归调用merge
                merge(targetProp, sourceProp, overwrite);
            } else if (overwrite || !(key in target)) {
                // 否则只处理overwrite为true，或者在目标对象中没有此属性的情况
                // NOTE，在 target[key] 不存在的时候也是直接覆盖
                target[key] = deepClone(source[key]);
            }
        }
    }
    return target;
}

/**
 * 获取当前@media基准html的实际px，即当前1rem的值
 * @return float px 值
 */
export const getBaseRem = () => {
    let rem = 16;
    let html = document.getElementsByTagName('html')[0];
    let style = window.getComputedStyle(html)
    if (html && style) {
        rem = parseFloat(style.fontSize.replace('px', ''));
    }
    return rem;
};

/**
 * 获取字符串编码数
 * @param {String} text 字符串
 */
export const getStringCode = (text = '') => {
    let code = 0;
    text = text.toString();
    for (let i = 0; i < text.length; i++) {
        code = code + text.codePointAt(i);
    }
    return code;
}

/**
 * 深度合并两个对象
 * @param {Object} obj1 对象1
 * @param {Object} obj2 对象2
 */
export const deepMerge = (obj1, obj2) => {
    let key;
    for (key in obj2) {
        // 如果target(也就是obj1[key])存在，且是对象的话再去调用deepMerge，否则就是obj1[key]里面没这个对象，需要与obj2[key]合并
        // 如果obj2[key]没有值或者值不是对象，此时直接替换obj1[key]
        obj1[key] =
            obj1[key] &&
                obj1[key].toString() === "[object Object]" &&
                (obj2[key] && obj2[key].toString() === "[object Object]")
                ? deepMerge(obj1[key], obj2[key])
                : (obj1[key] = obj2[key]);
    }
    return obj1;
}

//两个数组取并集，并删除两个数组中相同的元素
export const arrayCombinedDifference = (arr1, arr2) => {
    // 并集 数组去重 
    let RemoveSame = [...new Set([...arr1, ...arr2])]

    //数组交集，或得两个数组重复的元素
    let SamePart = arr1.filter(item => arr2.includes(item))

    //差集=并集-交集  去除两个数组相同的元素
    let Difference = RemoveSame.filter(item => !SamePart.includes(item))
    return Difference
}

/** 处理工具栏上的id,后面追加pageType,以解决一个页面中多次加载工具栏时，id冲突问题
 * id 工具栏item原id
 * type 唯一标记一个工具栏的模块，如show3d、view3d_detect
**/
export const getToolbarId = (id, type) => {
    return id + '_' + type

}