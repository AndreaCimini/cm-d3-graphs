import {TreeGraphConfigurationInterface} from 'cm-d3-graphs';

export const TreeConfs: TreeGraphConfigurationInterface = {
  id: 'tree_chart',
  type: 'tree',
  nodes: {
    shape: 'rect'
  },
  // orientation: 'horizontal',
  zoom: {
    minZoom: 0.5,
    maxZoom: 4
  }
};
