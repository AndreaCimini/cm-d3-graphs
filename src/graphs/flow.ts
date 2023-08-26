import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { GraphData } from '../types/graphData';
import { Graph } from '../graph';

export class Flow extends Graph<'flow'> {
  protected getDefaultConfigurations = (
    defaultConfigurations: InternalGraphCongifuration<'flow'>
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
    };
    defaultConfigurations.links = {
      color: 'lightsteelblue',
      arrow: true,
      arrowDirection: 'end',
      shape: 'straight',
      width: '0.125rem',
    };
    defaultConfigurations.label = {
      color: 'black',
      padding: { top: 5, left: 10, right: 10, bottom: 5 },
    };
    defaultConfigurations.clusters = {
      strokeColor: 'lightsteelblue',
      fillColor: 'transparent',
      position: 'default',
      shape: 'rectangle',
      label: {
        color: 'lightsteelblue',
        position: 'center',
        fontSize: 25,
        padding: { top: 5, left: 10, right: 10, bottom: 5 },
      },
    };
  };

  protected buildGraph = (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<'flow'>,
    data: Array<GraphData<'flow'>>
  ) => {
    console.log(htmlElement, conf, data);
  };
}
