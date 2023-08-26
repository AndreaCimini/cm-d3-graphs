import { GraphData } from '../types/graphData';
import { GraphCongifuration } from '../types/graphConfiguration';

const histogramConf: GraphCongifuration<'histogram'> = {
  id: 'histogram_chart',
  groups: [{ color: '#1980B6' }, { color: '#ec1f1f' }, { color: '#09b116' }],
  // groups: [{ color: '#1980B6' }],
  axis: {
    invertAxisY: false,
    invertAxisX: false,
  },
  orientation: 'vertical',
  maxDisplayedNumber: 10,
  legend: {
    position: 'right',
    enabled: true,
  },
};

const histogramData: Array<GraphData<'histogram'>> = [
  { values: [-12, 34, -56], label: 'Label1' },
  { values: [23, -5, 67], label: 'Label2' },
  { values: [1, 7, 4], label: 'Label3' },
  { values: [67, 31, -12], label: 'Label4' },
  { values: [-43, -43, 9], label: 'Label5' },
  { values: [2, -89, -63], label: 'Label6' },
  { values: [98, 11, 45], label: 'Label7' },
  { values: [-53, 26, -12], label: 'Label8' },
  { values: [-29, 26, 35], label: 'Label9' },
  { values: [31, 1, -5], label: 'Label10' },
  { values: [81, -12, -34], label: 'Label11' },
  { values: [60, 51, -41], label: 'Label12' },
  { values: [-4, -17, 31], label: 'Label13' },
  { values: [35, 67, 18], label: 'Label14' },
  { values: [19, 56, 25], label: 'Label15' },
  { values: [-93, 5, -89], label: 'Label16' },
  { values: [51, 34, -57], label: 'Label17' },
  { values: [56, 76, 12], label: 'Label18' },
  { values: [-48, 87, 90], label: 'Label19' },
  { values: [11, -32, -12], label: 'Label20' },
  /*
    { values: [12], label: 'Label1' },
    { values: [23], label: 'Label2' },
    { values: [1], label: 'Label3' },
    { values: [67], label: 'Label4' },
    { values: [43], label: 'Label5' },
    { values: [2], label: 'Label6' },
    { values: [98], label: 'Label7' },
    { values: [53], label: 'Label8' },
    { values: [29], label: 'Label9' },
    { values: [31], label: 'Label10' },
    { values: [81], label: 'Label11' },
    { values: [60], label: 'Label12' },
    { values: [4], label: 'Label13' },
    { values: [35], label: 'Label14' },
    { values: [19], label: 'Label15' },
    { values: [93], label: 'Label16' },
    { values: [51], label: 'Label17' },
    { values: [56], label: 'Label18' },
    { values: [48], label: 'Label19' },
    { values: [11], label: 'Label20' },
    */
];

export { histogramConf, histogramData };
