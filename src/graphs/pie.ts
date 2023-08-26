import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { GraphData } from '../types/graphData';
import { Graph } from '../graph';

export class Pie extends Graph<'pie' | 'donut'> {
  protected getDefaultConfigurations = (
    defaultConfigurations: InternalGraphCongifuration<'pie' | 'donut'>
  ) => {
    defaultConfigurations.events = {
      clickOnElement: false,
    };
    defaultConfigurations.slices = {
      colors: [
        '#e61400',
        '#ff0f64',
        '#0555fa',
        '#008c5a',
        '#ff5a0f',
        '#ff4687',
        '#41b9e6',
        '#55be5a',
        '#c6c6c6',
        '#000000',
      ],
      textColor: 'white',
    };
    defaultConfigurations.legend = {
      enabled: false,
      position: 'right',
    };
  };

  protected buildGraph = (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<'pie' | 'donut'>,
    data: Array<GraphData<'pie' | 'donut'>>
  ) => {
    console.log(htmlElement, conf, data);
  };
}