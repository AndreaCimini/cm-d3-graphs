import {FlowChartGraphConfigurationInterface} from 'cm-d3-graphs';

export const FlowChartConfs: FlowChartGraphConfigurationInterface = {
  id: 'flow_chart',
  type: 'flow-chart',
  nodes: {
    shape: 'circle',
    circleRadius: 50
  },
  zoom: {
    minZoom: 0.5,
    maxZoom: 4
  },
  links: {
    arrowDirection: 'end',
    shape: 'smooth'
  },
  orientation: 'horizontal',
  clusters: {
    position: 'full-space',
    shape: 'rectangle',
    label: {
      position: 'bottom-right'
    }
  },
  overflowY: false
};
