import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { GraphData } from '../types/graphData';
import { Graph } from '../graph';

export class Bubble extends Graph<'bubble'> {
  protected getDefaultConfigurations = (
    defaultConfigurations: InternalGraphCongifuration<'bubble'>
  ) => {
    defaultConfigurations.events = {
      clickOnElement: false,
    };
    defaultConfigurations.nodes = {
      backgroundStartColor: 'lightsteelblue',
      backgroundEndColor: 'steelblue',
      strokeColorOnHover: 'darkgrey',
      expandable: true,
      maxInitialExpandedLevel: 2,
    };
    defaultConfigurations.label = {
      color: 'black',
    };
  };

  protected buildGraph = (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<'bubble'>,
    data: Array<GraphData<'bubble'>>
  ) => {
    console.log(htmlElement, conf, data);
  };
}
