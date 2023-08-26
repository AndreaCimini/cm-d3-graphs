import { GraphTypes } from './types/graphTypes';
import { GraphCongifuration, InternalGraphCongifuration } from './types/graphConfiguration';
import { GraphData, InternalGraphData } from './types/graphData';
import { merge, reg } from './utility/common';

export abstract class Graph<TModel extends GraphTypes> {
  constructor() {
    reg.register(this, 'sto cazzo');
  }

  protected buildGraph: (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<TModel>,
    data: Array<InternalGraphData<TModel>>
  ) => void = () => null;

  protected updateGraphOnResize: (
    conf: InternalGraphCongifuration<TModel>,
    data: Array<InternalGraphData<TModel>>
  ) => void = () => null;

  protected getDefaultConfigurations: (
    defaultConfigurations: InternalGraphCongifuration<TModel>,
    conf: GraphCongifuration<TModel>,
    data: Array<GraphData<TModel>>
  ) => void = () => null;

  protected transformIncomingData: () => void = () => null;

  private arrangeConfigurations = (
    conf: GraphCongifuration<TModel>,
    data: Array<GraphData<TModel>>
  ): InternalGraphCongifuration<TModel> => {
    // deafault configuration
    const defaultConfigurations: InternalGraphCongifuration<TModel> = {
      id: null,
      margin: { top: 10, bottom: 10, left: 10, right: 10 },
      overflowX: false,
      overflowY: false,
      tooltipFormat: (label: string, value: string | number) => `${label}: ${value}`,
    } as unknown as InternalGraphCongifuration<TModel>;

    // return default configuration based on graph type
    this.getDefaultConfigurations(defaultConfigurations, conf, data);

    // merge configurations
    return merge(defaultConfigurations, conf);
  };

  private arrangeDataIterative = (
    conf: InternalGraphCongifuration<TModel>,
    data: Array<GraphData<TModel>>,
    newData: Array<InternalGraphData<TModel>>
  ) => {
    data.forEach((d, index: number) => {
      // create new data of type GraphDataInterface
      const newD: InternalGraphData<TModel> = {
        ...d, // clone current data
        // if data doesn't have an id, create one
        id: d.id ? d.id : '_' + Math.random().toString(36).substr(2, 9),
        // set children to null (they will be added after)
        children: null,
        // set extra data if it doesn't have
        extraData: d.extraData ? d.extraData : {},
      } as unknown as InternalGraphData<TModel>;

      console.log(conf, index);
      // add custom data based on graph type
      /*
      switch (graphConfigs.type) {
        case 'pie':
          D3UtilityService.setNodeDataForPie(graphConfigs, newD, d, index);
          break;
        case 'donut':
          D3UtilityService.setNodeDataForPie(graphConfigs, newD, d, index);
          break;
        case 'tree':
          D3UtilityService.setNodeDataForTree(graphConfigs as TreeGraphConfigurationInterface, newD as TreeGraphDataInterface, d);
          break;
        case 'flow-chart':
          D3UtilityService.setNodeDataForFlowChart(graphConfigs as FlowChartGraphConfigurationInterface,
            newD as FlowChartGraphDataInterface, d);
          break;
        case 'bubble-chart':
          D3UtilityService.setNodeDataForBubbleChart(graphConfigs as BubbleChartGraphConfigurationInterface,
            newD as BubbleChartGraphDataInterface, d);
          break;
      }
      */
      // check if there are children
      /*
      if (d) {
        newD.children = [];
        this.arrangeDataIterative((d as TreeGraphDataInterface | BubbleChartGraphDataInterface).children, newD.children);
      }
      */
      // push in new data array
      newData.push(newD);
    });
  };

  private arrangeData = (
    conf: InternalGraphCongifuration<TModel>,
    data: Array<GraphData<TModel>>
  ): Array<InternalGraphData<TModel>> => {
    const graphData: Array<InternalGraphData<TModel>> = [];
    this.arrangeDataIterative(conf, data, graphData);
    return graphData;
  };

  private initListeners(
    conf: InternalGraphCongifuration<TModel>,
    data: Array<InternalGraphData<TModel>>
  ) {
    // listen on window resize event
    window.addEventListener('resize', () => this.updateGraphOnResize(conf, data));
  }

  public build = (
    htmlElement: HTMLElement,
    conf: GraphCongifuration<TModel>,
    data: Array<GraphData<TModel>>
  ) => {
    const graphConf = this.arrangeConfigurations(conf, data);
    const graphData = this.arrangeData(graphConf, data);
    if (graphData.length > 0) {
      this.buildGraph(htmlElement, graphConf, graphData);
      this.initListeners(graphConf, graphData);
    }
  };
}
