import {Injectable} from '@angular/core';

import {
  BubbleChartGraphConfigurationInterface,
  FlowChartGraphConfigurationInterface,
  GraphConfigurationInterface,
  HistogramGraphConfigurationInterface, LineGraphConfigurationInterface,
  PieGraphConfigurationInterface, RangeSliderGraphConfigurationInterface, TreeGraphConfigurationInterface
} from '../interfaces/graph-configuration.interface';
import {
  BubbleChartGraphDataInterface,
  FlowChartGraphDataInterface,
  GraphDataInterface, HistogramGraphDataInterface, LineGraphDataInterface, NodesGraphDataInterface,
  PieGraphDataInterface,
  TreeGraphDataInterface
} from '../interfaces/graph-data.interface';

@Injectable({
  providedIn: 'root'
})
export class D3UtilityService {

  constructor() {
  }

  private static merge(obj1: any, obj2: any) {
    for (const p in obj2) {
      if (obj2.hasOwnProperty(p)) {
        if (Array.isArray(obj2[p])) {
          if (!obj1[p]) {
            obj1[p] = [];
          }
          obj2[p].forEach((el, index) => {
            if (obj1[p][index]) {
              obj1[p][index] = D3UtilityService.merge(obj1[p][index], el);
            } else {
              obj1[p].push(D3UtilityService.merge(obj1[p][index], el));
            }
          });
        } else if (typeof obj2[p] === 'object') {
          if (!obj1[p]) {
            obj1[p] = {};
          }
          obj1[p] = D3UtilityService.merge(obj1[p], obj2[p]);
        } else {
          obj1[p] = obj2[p];
        }
      }
    }
    return obj1;
  }

  private static getDefaultConfigurationForHistogram(defaultConfigurations: HistogramGraphConfigurationInterface,
                                                     data: HistogramGraphDataInterface[]) {
    // calc groups number
    const groupsNumber = data.reduce((max, d) => Math.max(max, d.values.length), 0);
    defaultConfigurations.groups = [];
    for (let i = 0; i < groupsNumber; i++) {
      defaultConfigurations.groups.push({color: '#1980B6', label: 'Group-' + (i + 1)});
    }
    defaultConfigurations.events = {
      clickOnElement: false
    };
    defaultConfigurations.orientation = 'vertical';
    defaultConfigurations.grid = {
      axisX: true,
      axisY: true,
      color: '#ccc'
    };
    defaultConfigurations.axis = {
      showAxisX: true,
      showAxisY: true,
      invertAxisX: false,
      invertAxisY: false,
      labelXOrientation: 'horizontal',
      labelYOrientation: 'horizontal',
      lineColor: 'black',
      textColor: 'black'
    };
    defaultConfigurations.groupedType = 'inline';
    defaultConfigurations.legend = {
      enabled: false,
      position: 'right'
    };
  }

  private static getDefaultConfigurationForPieAndDonut(defaultConfigurations: PieGraphConfigurationInterface) {
    defaultConfigurations.events = {
      clickOnElement: false
    };
    defaultConfigurations.slices = {
      colors: ['#e61400', '#ff0f64', '#0555fa', '#008c5a', '#ff5a0f', '#ff4687', '#41b9e6', '#55be5a', '#c6c6c6', '#000000'],
      textColor: 'white'
    };
    defaultConfigurations.legend = {
      enabled: false,
      position: 'right'
    };
  }

  private static getDefaultConfigurationForLine(defaultConfigurations: LineGraphConfigurationInterface, data: LineGraphDataInterface[]) {
    // calc groups number
    const groupsNumber = data.reduce((max, d) => Math.max(max, d.values.length), 0);
    defaultConfigurations.groups = [];
    for (let i = 0; i < groupsNumber; i++) {
      defaultConfigurations.groups.push({color: '#1980B6', label: 'Line-' + (i + 1)});
    }
    defaultConfigurations.events = {
      clickOnElement: false
    };
    defaultConfigurations.orientation = 'vertical';
    defaultConfigurations.grid = {
      axisX: true,
      axisY: true,
      color: '#ccc'
    };
    defaultConfigurations.axis = {
      showAxisX: true,
      showAxisY: true,
      invertAxisX: false,
      invertAxisY: false,
      labelXOrientation: 'horizontal',
      labelYOrientation: 'horizontal',
      lineColor: 'black',
      textColor: 'black'
    };
    defaultConfigurations.hasArea = true;
    defaultConfigurations.legend = {
      enabled: false,
      position: 'right'
    };
  }

  private static getDefaultConfigurationForTree(defaultConfigurations: TreeGraphConfigurationInterface) {
    defaultConfigurations.events = {
      clickOnElement: false
    };
    defaultConfigurations.orientation = 'vertical';
    defaultConfigurations.nodes = {
      shape: 'circle',
      collapsedColor: 'lightsteelblue',
      expandedColor: 'white',
      strokeColor: 'lightsteelblue',
      circleRadius: 10,
      rectangleDimensions: {width: 150, height: 40},
      squareDimensions: 80,
      rhombusDimensions: 120,
      distanceBetweenBrothers: 20,
      distanceBetweenCousins: 40,
      distanceBetweenParentAndChild: 150,
      expandable: true,
      maxInitialExpandedLevel: 2
    };
    defaultConfigurations.links = {
      color: 'lightsteelblue',
      arrow: true,
      arrowDirection: 'end'
    };
    defaultConfigurations.label = {
      color: 'black',
      padding: {top: 5, left: 10, right: 10, bottom: 5}
    };
  }

  private static getDefaultConfigurationForFlowChart(defaultConfigurations: FlowChartGraphConfigurationInterface) {
    defaultConfigurations.events = {
      clickOnElement: false
    };
    defaultConfigurations.orientation = 'vertical';
    defaultConfigurations.nodes = {
      shape: 'circle',
      collapsedColor: 'lightsteelblue',
      expandedColor: 'white',
      strokeColor: 'lightsteelblue',
      circleRadius: 10,
      rectangleDimensions: {width: 150, height: 40},
      squareDimensions: 80,
      rhombusDimensions: 120,
      distanceBetweenBrothers: 20,
      distanceBetweenCousins: 40,
      distanceBetweenParentAndChild: 150
    };
    defaultConfigurations.links = {
      color: 'lightsteelblue',
      arrow: true,
      arrowDirection: 'end',
      shape: 'straight'
    };
    defaultConfigurations.label = {
      color: 'black',
      padding: {top: 5, left: 10, right: 10, bottom: 5}
    };
    defaultConfigurations.clusters = {
      strokeColor: 'lightsteelblue',
      fillColor: 'transparent',
      position: 'default',
      shape: 'rectangle',
      label: {
        color: 'lightsteelblue',
        position: 'center',
        'font-size': 25,
        padding: {top: 5, left: 10, right: 10, bottom: 5}
      }
    };
  }

  private static getDefaultConfigurationForRangeSlider(defaultConfigurations: RangeSliderGraphConfigurationInterface,
                                                       graphConfigs: RangeSliderGraphConfigurationInterface) {
    defaultConfigurations.events = {
      rangeChanged: false,
      rangeChanging: false
    };
    defaultConfigurations.orientation = 'horizontal';
    defaultConfigurations.track = {
      color: '#bbb',
      width: 6,
      insetColor: '#eee',
      insetWidth: 4,
      fillColor: '#3883fa',
      fillWidth: 4
    };
    defaultConfigurations.interval = {
      type: 'discrete'
    };
    defaultConfigurations.handle = {
      strokeColor: '#777',
      fillColor: 'white',
      type: 'double',
      showTooltip: 'always'
    };
    defaultConfigurations.axis = {
      showAxisX: graphConfigs.orientation !== 'vertical',
      showAxisY: graphConfigs.orientation === 'vertical',
      invertAxisX: false,
      invertAxisY: false,
      labelXOrientation: 'horizontal',
      labelYOrientation: 'horizontal',
      lineColor: 'black',
      textColor: 'black'
    };
  }

  private static getDefaultConfigurationForBubbleChart(defaultConfigurations: BubbleChartGraphConfigurationInterface) {
    defaultConfigurations.events = {
      clickOnElement: false
    };
    defaultConfigurations.nodes = {
      backgroundStartColor: 'lightsteelblue',
      backgroundEndColor: 'steelblue',
      strokeColorOnHover: 'darkgrey',
      expandable: true,
      maxInitialExpandedLevel: 2
    };
    defaultConfigurations.label = {
      color: 'black'
    };
  }

  private static setNodeDataForPie(config: PieGraphConfigurationInterface, newData: PieGraphDataInterface, inputData,
                                   index: number) {
    const colorIndex = index < config.slices.colors.length ? index :
      index - (config.slices.colors.length * Math.floor(index / config.slices.colors.length));
    newData.slice = D3UtilityService.merge({
      color: config.slices.colors[colorIndex]
    }, inputData.slice ? inputData.slice : {});
  }

  private static setNodeDataForTree(config: TreeGraphConfigurationInterface, newData: TreeGraphDataInterface, inputData) {
    newData.node = D3UtilityService.merge({
      shape: config.nodes.shape,
      collapsedColor: config.nodes.collapsedColor,
      expandedColor: config.nodes.expandedColor,
      strokeColor: config.nodes.strokeColor,
      labelColor: config.label.color
    }, inputData.node ? inputData.node : {});
    newData.link = D3UtilityService.merge({
      color: 'lightsteelblue'
    }, inputData.link ? inputData.link : {});
  }

  private static setNodeDataForFlowChart(config: FlowChartGraphConfigurationInterface, newData: FlowChartGraphDataInterface, inputData) {
    newData.node = D3UtilityService.merge({
      shape: config.nodes.shape,
      collapsedColor: config.nodes.collapsedColor,
      expandedColor: config.nodes.expandedColor,
      strokeColor: config.nodes.strokeColor,
      labelColor: config.label.color,
      icon: config.nodes.icon
    }, inputData.node ? inputData.node : {});
    newData.link = D3UtilityService.merge({
      color: 'lightsteelblue'
    }, inputData.link ? inputData.link : {});
    newData.cluster = D3UtilityService.merge({
      strokeColor: config.clusters.strokeColor,
      fillColor: config.clusters.fillColor,
      level: 0,
      label: {...config.clusters.label}
    }, inputData.cluster ? inputData.cluster : {});
  }

  private static setNodeDataForBubbleChart(config: BubbleChartGraphConfigurationInterface, newData: BubbleChartGraphDataInterface,
                                           inputData) {
    newData.node = D3UtilityService.merge({
      strokeColorOnHover: config.nodes.strokeColorOnHover
    }, inputData.node ? inputData.node : {});
  }

  arrangeConfigurations(graphConfigs: GraphConfigurationInterface, data?: GraphDataInterface[]): GraphConfigurationInterface {
    const defaultConfigurations: GraphConfigurationInterface = {
      id: null,
      type: graphConfigs.type,
      margin: {top: 10, bottom: 10, left: 10, right: 10},
      overflowX: false,
      overflowY: false,
      tooltipFormat: (label, value) => label + ': ' + value
    };

    // return default configuration based on graph type
    switch (graphConfigs.type) {
      case 'histogram':
        D3UtilityService.getDefaultConfigurationForHistogram(defaultConfigurations as HistogramGraphConfigurationInterface, data);
        break;
      case 'pie':
        D3UtilityService.getDefaultConfigurationForPieAndDonut(defaultConfigurations as PieGraphConfigurationInterface);
        break;
      case 'donut':
        D3UtilityService.getDefaultConfigurationForPieAndDonut(defaultConfigurations as PieGraphConfigurationInterface);
        break;
      case 'line':
        D3UtilityService.getDefaultConfigurationForLine(defaultConfigurations as LineGraphConfigurationInterface, data);
        break;
      case 'tree':
        D3UtilityService.getDefaultConfigurationForTree(defaultConfigurations as TreeGraphConfigurationInterface);
        break;
      case 'flow-chart':
        D3UtilityService.getDefaultConfigurationForFlowChart(defaultConfigurations as FlowChartGraphConfigurationInterface);
        break;
      case 'range-slider':
        D3UtilityService.getDefaultConfigurationForRangeSlider(defaultConfigurations as RangeSliderGraphConfigurationInterface,
          graphConfigs);
        break;
      case 'bubble-chart':
        D3UtilityService.getDefaultConfigurationForBubbleChart(defaultConfigurations as BubbleChartGraphConfigurationInterface);
        break;
    }

    // merge configurations
    return D3UtilityService.merge(defaultConfigurations, graphConfigs);
  }

  arrangeData(graphConfigs: GraphConfigurationInterface, data: GraphDataInterface[]): GraphDataInterface[] {
    const graphData = [];
    const arrangeDataIterativeFn = (gData: GraphDataInterface[], newData: GraphDataInterface[]) => {
      gData.forEach((d, index: number) => {
        // create new data of type GraphDataInterface
        const newD: GraphDataInterface = {
          ...d, // clone current data
          // if data doesn't have an id, create one
          id: d.id ? d.id : '_' + Math.random().toString(36).substr(2, 9),
          // set children to null (they will be added after)
          children: null,
          // set extra data if it doesn't have
          extraData: d.extraData ? d.extraData : {}
        };
        // add custom data based on graph type
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
        // check if there are children
        if ((d as TreeGraphDataInterface | BubbleChartGraphDataInterface).children) {
          newD.children = [];
          arrangeDataIterativeFn((d as TreeGraphDataInterface | BubbleChartGraphDataInterface).children, newD.children);
        }
        // push in new data array
        newData.push(newD);
      });
    };

    arrangeDataIterativeFn(data, graphData);
    return graphData;
  }
}
