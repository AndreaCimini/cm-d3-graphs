import {FlowChartGraphConfigurationInterface} from 'cm-d3-graphs';

export const FlowChartConfs: FlowChartGraphConfigurationInterface = {
  id: 'flow_chart',
  type: 'flow-chart',
  nodes: {
    shape: 'circle',
    circleRadius: 50,
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/2048px-User_icon_2.svg.png'
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
