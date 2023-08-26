import { GraphCongifuration, InternalGraphCongifuration } from '../types/graphConfiguration';
import { GraphData } from '../types/graphData';
import { Graph } from '../graph';

export class RangeChart extends Graph<'range'> {
  protected getDefaultConfigurations = (
    defaultConfigurations: InternalGraphCongifuration<'range'>,
    conf: GraphCongifuration<'range'>
  ) => {
    defaultConfigurations.events = {
      rangeChanged: false,
      rangeChanging: false,
    };
    defaultConfigurations.orientation = 'horizontal';
    defaultConfigurations.track = {
      color: '#bbb',
      width: 6,
      insetColor: '#eee',
      insetWidth: 4,
      fillColor: '#3883fa',
      fillWidth: 4,
    };
    defaultConfigurations.interval = {
      type: 'discrete',
    };
    defaultConfigurations.handle = {
      strokeColor: '#777',
      fillColor: 'white',
      type: 'double',
      showTooltip: 'always',
    };
    defaultConfigurations.axis = {
      showAxisX: conf.orientation !== 'vertical',
      showAxisY: conf.orientation === 'vertical',
      invertAxisX: false,
      invertAxisY: false,
      labelXOrientation: 'horizontal',
      labelYOrientation: 'horizontal',
      lineColor: 'black',
      textColor: 'black',
    };
  };

  protected buildGraph = (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<'range'>,
    data: Array<GraphData<'range'>>
  ) => {
    console.log(htmlElement, conf, data);
  };
}
