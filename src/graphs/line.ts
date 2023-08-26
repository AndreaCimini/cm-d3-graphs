import { GraphCongifuration, InternalGraphCongifuration } from '../types/graphConfiguration';
import { GraphData } from '../types/graphData';
import { Graph } from '../graph';

export class Line extends Graph<'line'> {
  
  protected getDefaultConfigurations = (
    defaultConfigurations: InternalGraphCongifuration<'line'>,
    _conf: GraphCongifuration<'line'>,
    data: Array<GraphData<'line'>>
  ) => {
    // calc groups number
    const groupsNumber = data.reduce((max, d) => Math.max(max, d.values.length), 0);
    defaultConfigurations.groups = [];
    for (let i = 0; i < groupsNumber; i++) {
      defaultConfigurations.groups.push({ color: '#1980B6', label: `Line-${i + 1}` });
    }
    defaultConfigurations.events = {
      clickOnElement: false,
    };
    defaultConfigurations.orientation = 'vertical';
    defaultConfigurations.grid = {
      axisX: true,
      axisY: true,
      color: '#ccc',
    };
    defaultConfigurations.axis = {
      showAxisX: true,
      showAxisY: true,
      invertAxisX: false,
      invertAxisY: false,
      labelXOrientation: 'horizontal',
      labelYOrientation: 'horizontal',
      lineColor: 'black',
      textColor: 'black',
    };
    defaultConfigurations.hasArea = true;
    defaultConfigurations.legend = {
      enabled: false,
      position: 'right',
    };
  };

  protected buildGraph = (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<'line'>,
    data: Array<GraphData<'line'>>
  ) => {
    console.log(htmlElement, conf, data);
  };
}
