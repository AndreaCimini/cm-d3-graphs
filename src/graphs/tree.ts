import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { GraphData } from '../types/graphData';
import { Graph } from '../graph';

export class Tree extends Graph<'tree'> {
  protected getDefaultConfigurations = (
    defaultConfigurations: InternalGraphCongifuration<'tree'>
  ) => {
    defaultConfigurations.events = {
      clickOnElement: false,
    };
    defaultConfigurations.orientation = 'vertical';
    defaultConfigurations.nodes = {
      shape: 'circle',
      collapsedColor: 'lightsteelblue',
      expandedColor: 'white',
      strokeColor: 'lightsteelblue',
      circleRadius: 10,
      rectangleDimensions: { width: 150, height: 40 },
      squareDimensions: 80,
      rhombusDimensions: 120,
      distanceBetweenBrothers: 20,
      distanceBetweenCousins: 40,
      distanceBetweenParentAndChild: 150,
      expandable: true,
      maxInitialExpandedLevel: 2,
    };
    defaultConfigurations.links = {
      color: 'lightsteelblue',
      arrow: true,
      arrowDirection: 'end',
      width: '0.125rem',
    };
    defaultConfigurations.label = {
      color: 'black',
      padding: { top: 5, left: 10, right: 10, bottom: 5 },
    };
  };

  protected buildGraph = (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<'tree'>,
    data: Array<GraphData<'tree'>>
  ) => {
    console.log(htmlElement, conf, data);
  };
}
