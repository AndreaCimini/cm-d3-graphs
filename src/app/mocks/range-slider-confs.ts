import {RangeSliderGraphConfigurationInterface} from 'cm-d3-graphs';

export const RangeSliderConfs: RangeSliderGraphConfigurationInterface = {
  id: 'range_slider_chart',
  type: 'range-slider',
  interval: {
    // type: 'continuous',
    // step: 5
  },
  tooltipFormat: (label, value) => value.toFixed(2),
  axis: {
    tickFormatX: d => Number(d).toFixed(2)
  },
  // orientation: 'vertical'
};
