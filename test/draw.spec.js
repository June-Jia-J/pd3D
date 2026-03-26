import pdcharts from '../src/index.js';
import cycle from '../mocker/datas/cycle';


test('draw cycle', () => {
    pdcharts.draw(document.getElementById('cycle'), {
        width: '25rem',
        height: '25rem',
        type: pdcharts.chartType.cycle,
        data: cycle.chartBody
    });
})