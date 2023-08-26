import * as d3 from 'd3';

import { GraphCongifuration, InternalGraphCongifuration } from '../types/graphConfiguration';
import { GraphData, InternalGraphData } from '../types/graphData';
import { Graph } from '../graph';
import { ContainerUtility } from '../utility/container';
import {
  createScaleBandAxis,
  createScaleLinearAxis,
  addBottomAxis,
  addLeftAxis,
  scaleAxes,
  updateBottomAxisDomain,
  updateLeftAxisDomain,
} from '../utility/axes';
import { createGrid, updateGrid } from '../utility/grid';
import { BarsUtility } from '../utility/bars';
import { createScroll, updateScrollOnResize } from '../utility/scroll';
import { createLegend, updateLegend } from '../utility/legend';
import { Axis, GElement, Scale } from '../types/d3Types';
import { calcMinAndMaxValues, calcNumOfSeries } from '../utility/common';

export class Histogram extends Graph<'histogram'> {
  private graphData: Array<InternalGraphData<'histogram'>> = [];
  private readonly padding = 0.2; // 0 no padding, 1 padding equals to bandwidth (graphWidth / (graphData.length - 1))
  private readonly scrollDimension = 40;
  private readonly scrollPadding = 10;
  private bottomAxisScale!: Scale;
  private leftAxisScale!: Scale;
  private groupedAxisScale!: Scale;
  private bottomAxis: Axis | undefined;
  private leftAxis: Axis | undefined;
  private legendDimension: number = 0;
  private gridAxisHorizontal: Axis | undefined;
  private gridAxisVertical: Axis | undefined;
  private numOfSeries: number = 0;

  private containerUtility!: ContainerUtility<'histogram'>;
  private barsUtility!: BarsUtility;

  protected getDefaultConfigurations = (
    defaultConfigurations: InternalGraphCongifuration<'histogram'>,
    _conf: GraphCongifuration<'histogram'>,
    data: Array<GraphData<'histogram'>>
  ) => {
    // calc groups number
    const groupsNumber = data.reduce((max, d) => Math.max(max, d.values.length), 0);
    defaultConfigurations.groups = [];
    for (let i = 0; i < groupsNumber; i++) {
      defaultConfigurations.groups.push({ color: '#1980B6', label: `Group-${i + 1}` });
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
    defaultConfigurations.groupedType = 'inline';
    defaultConfigurations.legend = {
      enabled: false,
      position: 'right',
    };
  };

  private createGroupedAxis(
    conf: InternalGraphCongifuration<'histogram'>,
    bottomAxisScale: Scale,
    leftAxisScale: Scale
  ): any {
    return createScaleBandAxis(
      [
        0,
        conf.orientation === 'vertical'
          ? (bottomAxisScale as d3.ScaleBand<string | number>).bandwidth()
          : (leftAxisScale as d3.ScaleBand<string | number>).bandwidth(),
      ],
      0.05,
      d3.range(this.numOfSeries)
    );
  }

  private createAxes(
    conf: InternalGraphCongifuration<'histogram'>,
    data: Array<InternalGraphData<'histogram'>>,
    min: number,
    max: number,
    g: GElement,
    dimensionData: {
      width: number;
      height: number;
      padding: number;
    }
  ): {
    bottomAxisScale: Scale;
    leftAxisScale: Scale;
    bottomAxis: Axis | undefined;
    leftAxis: Axis | undefined;
    groupedAxisScale: Scale;
  } {
    const { width, height, padding } = dimensionData;
    let bottomAxisScale: Scale;
    let leftAxisScale: Scale;
    let bottomAxis: Axis | undefined;
    let leftAxis: Axis | undefined;
    // define axis bottom range from configuration
    const axisBottomRange: [number, number] = [0, width];
    // define axis left range from configuration
    const axisLeftRange: [number, number] = [0, height];
    // calc axes by orientation
    if (conf.orientation === 'vertical') {
      bottomAxisScale = createScaleBandAxis(
        axisBottomRange,
        padding,
        conf.axis.invertAxisX ? data.map((d) => d.label).reverse() : data.map((d) => d.label)
      );
      leftAxisScale = createScaleLinearAxis(
        axisLeftRange,
        conf.axis.invertAxisY ? [min, max] : [max, min]
      );
    } else {
      bottomAxisScale = createScaleLinearAxis(
        axisBottomRange,
        conf.axis.invertAxisX ? [max, min] : [min, max]
      );
      leftAxisScale = createScaleBandAxis(
        axisLeftRange,
        padding,
        conf.axis.invertAxisY ? data.map((d) => d.label) : data.map((d) => d.label).reverse()
      );
    }

    // add axes
    if (conf.axis.showAxisX) {
      bottomAxis = addBottomAxis(conf, g, bottomAxisScale);
    }
    if (conf.axis.showAxisY) {
      leftAxis = addLeftAxis(conf, g, leftAxisScale);
    }
    // scale axes
    ({ bottomScale: bottomAxisScale, leftScale: leftAxisScale } = scaleAxes(
      conf,
      g,
      height,
      width,
      {
        bottomScale: bottomAxisScale,
        leftScale: leftAxisScale,
        leftAxis,
        bottomAxis,
      }
    ));

    // define axis for grouped histogram
    return {
      bottomAxisScale,
      leftAxisScale,
      bottomAxis,
      leftAxis,
      groupedAxisScale: this.createGroupedAxis(conf, bottomAxisScale, leftAxisScale),
    };
  }

  private updateGraphOnScroll(
    g: GElement,
    dataIndex: number,
    conf: InternalGraphCongifuration<'histogram'>,
    data: Array<InternalGraphData<'histogram'>>
  ) {
    this.graphData = data.slice(dataIndex, dataIndex + conf.maxDisplayedNumber);
    if (conf.orientation === 'vertical') {
      // update bottom axis
      this.bottomAxisScale = updateBottomAxisDomain(
        g,
        conf.axis.invertAxisX
          ? this.graphData.map((d) => d.label).reverse()
          : this.graphData.map((d) => d.label),
        this.bottomAxisScale,
        this.bottomAxis
      );
    } else {
      // update left axis
      this.leftAxisScale = updateLeftAxisDomain(
        g,
        conf.axis.invertAxisY
          ? this.graphData.map((d) => d.label)
          : this.graphData.map((d) => d.label).reverse(),
        this.leftAxisScale,
        this.leftAxis
      );
    }

    this.barsUtility.updateBarsOnScroll({
      bottomAxisScale: this.bottomAxisScale,
      leftAxisScale: this.leftAxisScale,
      groupedAxisScale: this.groupedAxisScale,
    });
  }

  protected buildGraph = (
    htmlElement: HTMLElement,
    conf: InternalGraphCongifuration<'histogram'>,
    data: Array<InternalGraphData<'histogram'>>
  ) => {
    // create graph
    // calc grouped series
    this.numOfSeries = calcNumOfSeries(conf, data);
    // calc minimum and maximum value
    const { min, max } = calcMinAndMaxValues(conf, data);
    // manage graph data
    this.graphData = conf.maxDisplayedNumber ? data.slice(0, conf.maxDisplayedNumber) : data;
    // create container
    this.containerUtility = new ContainerUtility(htmlElement, conf);
    this.containerUtility.createContainer();
    let g = this.containerUtility.getG();
    // add legend
    this.legendDimension = createLegend(
      g,
      conf,
      this.containerUtility.getWidth(),
      this.containerUtility.getHeight()
    );
    // if there is a legend create an inner g to contain the graph
    if (this.legendDimension) {
      this.containerUtility.createGraphContainer(this.legendDimension);
      g = this.containerUtility.getG();
    }
    // calc graph dimensions
    this.containerUtility.calcGraphDimensions(
      this.scrollDimension + this.scrollPadding,
      data.length,
      this.legendDimension
    );
    // create axes
    ({
      bottomAxisScale: this.bottomAxisScale,
      leftAxisScale: this.leftAxisScale,
      bottomAxis: this.bottomAxis,
      leftAxis: this.leftAxis,
      groupedAxisScale: this.groupedAxisScale,
    } = this.createAxes(conf, this.graphData, min, max, g, {
      width: this.containerUtility.getGraphWidth(),
      height: this.containerUtility.getGraphHeight(),
      padding: this.padding,
    }));
    // crate grid
    ({ gridAxisHorizontal: this.gridAxisHorizontal, gridAxisVertical: this.gridAxisVertical } =
      createGrid(
        conf,
        g,
        this.bottomAxisScale,
        this.leftAxisScale,
        this.containerUtility.getGraphWidth(),
        this.containerUtility.getGraphHeight()
      ));
    // create bars
    this.barsUtility = new BarsUtility(conf, this.graphData, g);
    this.barsUtility.createBars(
      {
        bottomScale: this.bottomAxisScale,
        leftScale: this.leftAxisScale,
        groupedScale: this.groupedAxisScale,
      },
      'group-bars',
      'main-bars',
      2000
    );
    // create scroll
    /*
    createScroll(
      g,
      conf,
      data,
      {
        scrollDimension: this.scrollDimension,
        scrollPadding: this.scrollPadding,
        width: this.containerUtility.getGraphWidth(),
        height: this.containerUtility.getGraphHeight(),
      },
      (dataIndex: number) => this.updateGraphOnScroll(g, dataIndex, conf, data),
      () =>
        this.createAxes(
          { ...conf, axis: { ...conf.axis, showAxisX: false, showAxisY: false } },
          data,
          min,
          max,
          g, // useless for scroll axes because we don't have axes added to DOM
          {
            width: conf.orientation === 'vertical' ? this.containerUtility.getGraphWidth() : this.scrollDimension,
            height: conf.orientation === 'vertical' ? this.scrollDimension : this.containerUtility.getGraphHeight(),
            padding: 0,
          }
        )
    );
    */
  };

  protected updateGraphOnResize = (
    conf: InternalGraphCongifuration<'histogram'>,
    data: Array<InternalGraphData<'histogram'>>
  ) => {
    // calc graph dimensions
    this.containerUtility.calcGraphDimensions(
      this.scrollDimension + this.scrollPadding,
      data.length,
      this.legendDimension
    );
    // update graph
    this.containerUtility.updateContainer();
    const g = this.containerUtility.getG();
    // update legegend
    updateLegend(
      g,
      conf,
      this.containerUtility.getWidth(),
      this.containerUtility.getHeight(),
      this.legendDimension
    );
    // scale axes
    ({ bottomScale: this.bottomAxisScale, leftScale: this.leftAxisScale } = scaleAxes(
      conf,
      g,
      this.containerUtility.getGraphHeight(),
      this.containerUtility.getGraphWidth(),
      {
        bottomScale: this.bottomAxisScale,
        leftScale: this.leftAxisScale,
        leftAxis: this.leftAxis,
        bottomAxis: this.bottomAxis,
      }
    ));
    // update grouped axis
    this.groupedAxisScale = this.createGroupedAxis(conf, this.bottomAxisScale, this.leftAxisScale);
    // update grid
    updateGrid(
      conf,
      g,
      this.containerUtility.getGraphWidth(),
      this.containerUtility.getGraphHeight(),
      this.gridAxisHorizontal,
      this.gridAxisVertical
    );
    // update bars
    this.barsUtility.updateBarsOnResize(
      {
        bottomAxisScale: this.bottomAxisScale,
        leftAxisScale: this.leftAxisScale,
        groupedAxisScale: this.groupedAxisScale,
      },
      'group-bars',
      'main-bars'
    );
    // update scroll
    /*
    updateScrollOnResize(
      g,
      conf,
      {
        scrollPadding: this.scrollPadding,
        width: this.containerUtility.getGraphWidth(),
        height: this.containerUtility.getGraphHeight(),
      },
      {
        bottomAxisScale: this.bottomAxisScale,
        leftAxisScale: this.leftAxisScale,
        groupedAxisScale: this.groupedAxisScale,
      }
    );
    */
  };
}
