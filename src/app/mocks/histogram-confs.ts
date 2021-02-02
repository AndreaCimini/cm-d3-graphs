import {HistogramGraphConfigurationInterface} from 'cm-d3-graphs';

export const HistogramConfs: HistogramGraphConfigurationInterface = {
  id: 'histogram_chart',
  type: 'histogram',
  groups: [
    {color: '#1980B6'},
    {color: '#ec1f1f'},
    {color: '#09b116'}
  ],
  axis: {
    invertAxisY: false,
    invertAxisX: false
  },
  orientation: 'vertical',
  maxDisplayedNumber: 10,
  legend: {
    position: 'right',
    enabled: true
  }
};
