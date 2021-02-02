import {FlowChartGraphConfigurationInterface} from 'cm-d3-graphs';

export const FlowChartConfs: FlowChartGraphConfigurationInterface = {
  id: 'flow_chart',
  type: 'flow-chart',
  nodes: {
    shape: 'rect'
  },
  zoom: {
    minZoom: 0.5,
    maxZoom: 4
  },
  links: {
    arrowDirection: 'end'
  },
  orientation: 'horizontal',
  clusters: {
    position: 'full-space',
    label: {
      position: 'bottom-right'
    }
  },
  overflowY: false
};
