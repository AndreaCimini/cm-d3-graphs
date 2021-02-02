import {ElementRef} from '@angular/core';
import * as d3 from 'd3';

import {BaseCharts} from './base-charts';
import {AxisGraphDataInterface, HistogramGraphDataInterface, LineGraphDataInterface} from '../interfaces/graph-data.interface';
import {
  AxesGraphInterface,
  HistogramGraphConfigurationInterface,
  LineGraphConfigurationInterface
} from '../interfaces/graph-configuration.interface';

export abstract class BaseAxesCharts extends BaseCharts {
  protected scrollX: boolean;
  protected scrollY: boolean;
  protected scrollHeight: number;
  protected groupedSeries: number;
  protected legendX: string;
  protected legendY: string;

  protected calcGroupedSeries(graphConfigs: HistogramGraphConfigurationInterface) {
    if (graphConfigs.groupedType === 'inline') {
      this.groupedSeries = this.graphDataArranged.reduce((max: number, elem: HistogramGraphDataInterface) => {
        return Math.max(max, elem.values.length);
      }, 0);
    } else if (graphConfigs.groupedType === 'stacked') {
      return 0;
    }
  }

  private calcMinAndMaxData(graphConfigs: HistogramGraphConfigurationInterface): { min: number, max: number } {
    const graphValues = this.graphDataArranged.map((d: HistogramGraphDataInterface) => d.values).reduce((arr: number[], elem: number[]) => {
      if (graphConfigs.groupedType === 'inline') {
        return arr.concat(elem)
      } else if (graphConfigs.groupedType === 'stacked') {
        const sums = elem.reduce((a: number[], b: number) => {
          // first element is for positive sum
          if (b >= 0) {
            a[0] += b;
          } else { // second element is for negative sum
            a[1] += b;
          }
          return a;
        }, [0, 0]);
        return arr.concat(sums);
      }
    }, []);
    // calc min and max value
    const min = Math.min(0, ...graphValues);
    const max = Math.max(...graphValues);
    return {min, max};
  }

  private sortValues(graphData: LineGraphDataInterface[]): number[] {
    const values = graphData.reduce((arr: number[], elem: LineGraphDataInterface) => {
      return arr.concat(elem.values);
    }, []);

    // add zero
    values.push(0);

    // sort values
    return values.sort((a: number, b: number) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      }
      return 0;
    });
  }

  private createAxesByOrientationAndRange(axisXRange, axisYRange, graphData: HistogramGraphDataInterface[] | LineGraphDataInterface[],
                                          graphOrientation: string, padding: number, graphConfigs: AxesGraphInterface):
    { x, y, axisXRange, axisYRange, groupedAxis } {
    let x;
    let y;
    let groupedAxis;
    // calc axes by orientation
    if (graphOrientation === 'vertical') {
      switch (graphConfigs.type) {
        case 'histogram':
          // calc min and max
          const minMax = this.calcMinAndMaxData(graphConfigs);
          // split the range into n bands and compute the positions and widths of the bands taking into account any specified padding
          x = d3.scaleBand()
            .rangeRound(axisXRange)
            .paddingInner(padding)
            .domain(graphData.map(d => d.label));
          // create scale that use a linear function (y = m * x + b) to interpolate across the domain and range.
          y = d3.scaleLinear()
            .range(axisYRange)
            .domain([minMax.min, minMax.max]);
          // define axis for grouped histogram
          groupedAxis = d3.scaleBand<number>()
            .domain(d3.range(this.groupedSeries))
            .range([0, x.bandwidth()]).padding(0.05);
          break;
        case 'line':
          // create scale that map from a discrete set of values to equally spaced points along the specified range
          x = d3.scalePoint<string>()
            .range(axisXRange)
            .domain(graphData.map(d => d.label));
          // create scale that map from a discrete set of values to equally spaced points along the specified range
          y = d3.scalePoint<number>()
            .range(axisYRange)
            .domain(this.sortValues(graphData));
          break;
      }
    } else if (graphOrientation === 'horizontal') {
      switch (graphConfigs.type) {
        case 'histogram':
          // calc min and max
          const minMax = this.calcMinAndMaxData(graphConfigs);
          // create scale that use a linear function (y = m * x + b) to interpolate across the domain and range.
          x = d3.scaleLinear()
            .range(axisXRange)
            .domain([minMax.min, minMax.max]);
          // split the range into n bands and compute the positions and widths of the bands taking into account any specified padding
          y = d3.scaleBand()
            .rangeRound(axisYRange)
            .paddingInner(padding)
            .domain(graphData.map(d => d.label));
          // define axis for grouped histogram
          groupedAxis = d3.scaleBand<number>()
            .domain(d3.range(this.groupedSeries))
            .range([0, y.bandwidth()]).padding(0.05);
          break;
        case 'line':
          // create scale that map from a discrete set of values to equally spaced points along the specified range
          x = d3.scalePoint<number>()
            .range(axisXRange)
            .domain(this.sortValues(graphData));
          // create scale that map from a discrete set of values to equally spaced points along the specified range
          y = d3.scalePoint()
            .range(axisYRange)
            .domain(graphData.map(d => d.label));
          break;
      }
    }

    return {x, y, axisXRange, axisYRange, groupedAxis};
  }

  protected createAxis(graphData: AxisGraphDataInterface[], graphConfigs: AxesGraphInterface, padding: number):
    { x, y, axisXRange, axisYRange, groupedAxis } {
    // define axis x range from configuration
    const axisXRange = graphConfigs.axis.invertAxisX ? [this.graphWidth, 0] :
      [0, this.graphWidth];
    // define axis y range from configuration
    const axisYRange = graphConfigs.axis.invertAxisY ? [0, this.graphHeight] :
      [this.graphHeight, 0];
    // return axes by orientation and range
    return this.createAxesByOrientationAndRange(axisXRange, axisYRange, graphData, graphConfigs.orientation, padding, graphConfigs);
  }

  private manageAxisLabelOrientation(graphContainer: ElementRef, labelXOrientation: string, labelYOrientation: string) {
    if (labelXOrientation) {
      d3.select(graphContainer.nativeElement).selectAll('.x-axis .tick text')
        .attr('transform', () => {
          if (labelXOrientation === 'vertical') {
            return 'rotate(-90)';
          } else if (labelXOrientation === 'oblique') {
            return 'rotate(-45)';
          }
          return 'rotate(0)';
        })
        .style('text-anchor', labelXOrientation === 'horizontal' ? 'middle' : 'end')
        .attr('dx', () => {
          if (labelXOrientation === 'horizontal') {
            return 0;
          } else if (labelXOrientation === 'vertical' || labelXOrientation === 'oblique') {
            return '-.8em';
          }
          // labelXOrientation === 'horizontal' ? '0' : '-.8em'
        })
        .attr('dy', () => {
          if (labelXOrientation === 'horizontal') {
            return '.71em';
          } else if (labelXOrientation === 'vertical') {
            return '-.60em';
          } else if (labelXOrientation === 'oblique') {
            return 0;
          }
          // labelXOrientation === 'horizontal' ? '.71em' : '.15em'
        });
    }

    if (labelYOrientation) {
      d3.select(graphContainer.nativeElement).selectAll('.y-axis .tick text')
        .attr('transform', () => {
          if (labelYOrientation === 'vertical') {
            return 'rotate(-90)';
          } else if (labelYOrientation === 'oblique') {
            return 'rotate(-45)';
          }
          return 'rotate(0)';
        })
        .style('text-anchor', labelYOrientation === 'horizontal' ? 'end' : 'middle')
        .attr('dx', () => {
          if (labelYOrientation === 'horizontal' || labelYOrientation === 'oblique') {
            return -9;
          } else if (labelYOrientation === 'vertical') {
            return '.9em';
          }
        })
        .attr('dy', () => {
          if (labelYOrientation === 'horizontal') {
            return '.32em';
          } else if (labelYOrientation === 'vertical' || labelYOrientation === 'oblique') {
            return '-.85em';
          }
        });
    }
  }

  private manageAxisTicks(graphContainer: ElementRef, graphOrientation: string, labelXOrientation: string, labelYOrientation: string,
                          graphData: AxisGraphDataInterface[]) {
    // manage label orientation
    this.manageAxisLabelOrientation(graphContainer, labelXOrientation, labelYOrientation);
    // get axis class by graph orientation
    const axisClass = graphOrientation === 'vertical' ? '.x-axis' : '.y-axis';
    // calc axis length
    const axisDimensions = (d3.select(graphContainer.nativeElement).select(axisClass).node() as SVGElement).getBoundingClientRect();
    const axisLength = graphOrientation === 'vertical' ? axisDimensions.width : axisDimensions.height;
    // calc max tick length
    let tickLength = 0;
    const axisTicks = d3.select(graphContainer.nativeElement).selectAll(axisClass + ' .tick');
    // manage label visualization
    axisTicks
      .nodes()
      .forEach(n => {
        const currentTickLength = graphOrientation === 'vertical' ? (n as SVGElement).getBoundingClientRect().width :
          (n as SVGElement).getBoundingClientRect().height;
        tickLength = Math.max(tickLength, currentTickLength);
      });
    // check if ticks labels total length is greater than axis length
    if (axisLength < (tickLength * graphData.length)) {
      // calc max number of ticks permitted by the axis length and the label length
      const maxNumberOfTicks = Math.floor(axisLength / tickLength);
      const tickInterval = Math.ceil((graphData.length - maxNumberOfTicks) / (maxNumberOfTicks - 1));
      // redraw labels
      let currentTickIndex = 0;
      d3.selectAll(axisClass + ' .tick')
        .nodes()
        .forEach((n, i) => {
          if (i > 0 && i < (graphData.length - 1)) { // first and last label must be always present
            if (currentTickIndex < tickInterval) {
              currentTickIndex++;
              // remove tick
              (n as SVGElement).innerHTML = '';
            } else {
              if (i + tickInterval + 1 > graphData.length - 1) {
                // remove tick
                (n as SVGElement).innerHTML = '';
              }
              currentTickIndex = 0;
            }
          }
        });
    }
  }

  protected createGrid(graphContainer: ElementRef, graphConfigs: HistogramGraphConfigurationInterface | LineGraphConfigurationInterface, g,
                       axes: { x, y, axisXRange, axisYRange, groupedAxis }) {
    // remove old grid
    d3.select(graphContainer.nativeElement).selectAll('.grid').remove();
    // create grid
    if (graphConfigs.grid.axisY) {
      const gridLinesY = d3.axisLeft(axes.y)
        .tickFormat(() => '')
        .tickSize(-this.graphWidth);

      // add grid
      const grid = g.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(0, 0)')
        .call(gridLinesY);

      grid.selectAll('line')
        .attr('stroke', graphConfigs.grid.color)
    }
    if (graphConfigs.grid.axisX) {
      const gridLinesX = d3.axisBottom(axes.x)
        .tickFormat(() => '')
        .tickSize(this.graphHeight);

      // add grid
      const grid = g.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(0, 0)')
        .call(gridLinesX);

      grid.selectAll('line')
        .attr('stroke', graphConfigs.grid.color)
    }
  }

  protected addAxes(graphContainer: ElementRef, graphData: AxisGraphDataInterface[], graphConfigs: AxesGraphInterface,
                    g, axes: { x, y, axisXRange, axisYRange, groupedAxis, tickValuesX?: string[] | number[],
      tickValuesY?: string[] | number[]}) {
    // remove old axes
    d3.select(graphContainer.nativeElement).select('.x-axis').remove();
    d3.select(graphContainer.nativeElement).select('.y-axis').remove();
    // add the x Axis
    if (graphConfigs.axis.showAxisX) {
      const axisX = d3.axisBottom(axes.x);
      if (graphConfigs.axis.tickFormatX) {
          axisX.tickFormat(graphConfigs.axis.tickFormatX);
      }
      if (axes.tickValuesX) {
        axisX.tickValues(axes.tickValuesX);
      }
      const axis = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + this.graphHeight + ')')
        .call(axisX);

      // change axis color
      axis.select('path')
        .attr('stroke', graphConfigs.axis.lineColor)
      axis.selectAll('line')
        .attr('stroke', graphConfigs.axis.lineColor)
      axis.selectAll('text')
        .attr('fill', graphConfigs.axis.textColor)

      // manage tick visualization
      this.manageAxisTicks(graphContainer, 'vertical', graphConfigs.axis.labelXOrientation,
        graphConfigs.axis.labelYOrientation, graphData);
    }

    // add the y Axis
    if (graphConfigs.axis.showAxisY) {
      const axisY = d3.axisLeft(axes.y);
      if (graphConfigs.axis.tickFormatY) {
        axisY.tickFormat(graphConfigs.axis.tickFormatY);
      }
      if (axes.tickValuesY) {
        axisY.tickValues(axes.tickValuesY);
      }
      const axis = g.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(0, 0)')
        .call(axisY);

      // change axis color
      axis.select('path')
        .attr('stroke', graphConfigs.axis.lineColor)
      axis.selectAll('line')
        .attr('stroke', graphConfigs.axis.lineColor)
      axis.selectAll('text')
        .attr('fill', graphConfigs.axis.textColor)

      // manage tick visualization
      this.manageAxisTicks(graphContainer, 'horizontal', graphConfigs.axis.labelXOrientation,
        graphConfigs.axis.labelYOrientation, graphData);
    }
  }

  protected createScrollContainer(g, graphConfigs: AxesGraphInterface): {
    orientation: string, axes: { x, y, axisXRange, axisYRange, groupedAxis }, scrollContainer
  } {
    let orientation: string;
    let axes: { x, y, axisXRange, axisYRange, groupedAxis };
    // create scroll container
    const scrollContainer = g.append('g')
      .attr('class', 'scrollContainer');
    // set axis
    if (this.scrollX) {
      orientation = 'vertical';
      // define axis x range from configuration
      const axisXRange = graphConfigs.axis.invertAxisX ? [this.graphWidth, 0] :
        [0, this.graphWidth];
      // define axis y range from configuration
      const axisYRange = graphConfigs.axis.invertAxisY ? [0, this.scrollHeight] : [this.scrollHeight, 0];
      // create axes by orientation and range
      axes = this.createAxesByOrientationAndRange(axisXRange, axisYRange, this.graphDataArranged, 'vertical', 0, graphConfigs);
      // translate container
      scrollContainer.attr('transform',
        'translate(0, ' + (this.graphHeight + g.select('.x-axis').node().getBBox().height) + ')');
    } else if (this.scrollY) {
      orientation = 'horizontal';
      // define axis x range from configuration
      const axisXRange = graphConfigs.axis.invertAxisX ? [this.scrollHeight, 0] : [0, this.scrollHeight];
      // define axis y range from configuration
      const axisYRange = graphConfigs.axis.invertAxisY ? [0, this.graphHeight] :
        [this.graphHeight, 0];
      // create axes by orientation and range
      axes = this.createAxesByOrientationAndRange(axisXRange, axisYRange, this.graphDataArranged, 'horizontal', 0, graphConfigs);
      // translate container
      scrollContainer.attr('transform',
        'translate(' + this.graphWidth + ', 0)');
    }

    return {orientation, axes, scrollContainer};
  }

  protected createScrollCursor(graphConfigs: HistogramGraphConfigurationInterface | LineGraphConfigurationInterface, container: ElementRef,
                               scrollContainer, axes: { x, y, axisXRange, axisYRange, groupedAxis },
                               scrollCbk: (dataIndex: number, isScrollEvent: boolean) => void) {
    // create scroll cursor
    const displayed = d3.scaleQuantize()
      .domain(this.scrollX ? [0, this.graphWidth] : [0, this.graphHeight])
      .range(d3.range(this.graphDataArranged.length));

    scrollContainer.append('rect')
      .attr('class', 'mover')
      .attr('x', () => {
        if (this.scrollX) {
          if (graphConfigs.axis.invertAxisX) {
            return this.graphWidth - (this.graphWidth * graphConfigs.maxDisplayedNumber /
              this.graphDataArranged.length);
          }
          return 0;
        }
        return 0;
      })
      .attr('y', () => {
        if (this.scrollY) {
          if (graphConfigs.axis.invertAxisY) {
            return 0;
          }
          return this.graphHeight - (this.graphHeight * graphConfigs.maxDisplayedNumber /
            this.graphDataArranged.length);
        }
        return 0;
      })
      .attr('height', this.scrollX ? this.scrollHeight :
        this.graphHeight * graphConfigs.maxDisplayedNumber / this.graphDataArranged.length)
      .attr('width', () => {
        return this.scrollX ? this.graphWidth * graphConfigs.maxDisplayedNumber / this.graphDataArranged.length :
          this.scrollHeight
      })
      .attr('cursor', () => (this.scrollX ? 'ew-resize' : 'ns-resize'))
      .call( // init drag events
        d3.drag()
          .on('drag', event => {
            const rect = scrollContainer.select('.mover');
            const position = parseInt(this.scrollX ? rect.attr('x') : rect.attr('y'), 10);
            const newPosition = Math.floor(position + (this.scrollX ? event.dx : event.dy));
            const length = parseInt(this.scrollX ? rect.attr('width') : rect.attr('height'), 10);

            // if we move outside the scrollbar
            if (newPosition < 0 || newPosition + length > (this.scrollX ? this.graphWidth : this.graphHeight)) {
              return;
            }
            // update position
            rect.attr(this.scrollX ? 'x' : 'y', newPosition);
            const f = displayed(position);
            const nf = displayed(newPosition);
            if (f === nf) {
              return;
            }
            // update graph
            let dataIndex;
            if (this.scrollX) {
              if (graphConfigs.axis.invertAxisX) {
                dataIndex = this.graphDataArranged.length - (nf + graphConfigs.maxDisplayedNumber);
              } else {
                dataIndex = nf;
              }
            } else if (this.scrollY) {
              if (graphConfigs.axis.invertAxisY) {
                dataIndex = nf;
              } else {
                dataIndex = this.graphDataArranged.length - (nf + graphConfigs.maxDisplayedNumber);
              }
            }
            scrollCbk(dataIndex, true);
          })
          .on('end', () => this.fitGraph(container, graphConfigs, 0)) // scale to fit container
      );
  }

  protected createLegend(g, graphConfigs: HistogramGraphConfigurationInterface | LineGraphConfigurationInterface) {
    // remove old data
    g.select('.legendContainer').remove();
    if (this.legendX || this.legendY) {
      const legendPadding = 10;
      const legendElementDim = 15;
      const legendElementPadding = {top: 15, right: 10};
      // create legend container
      const legendContainer = g
        .append('g')
        .attr('class', 'legendContainer');
      // add rect and text for each group
      const legendElements = legendContainer
        .selectAll('g')
        .data(graphConfigs.groups)
        .enter()
        .append('g')
      legendElements
        .append('rect')
        .attr('width', legendElementDim)
        .attr('height', legendElementDim)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', d => d.color)
      legendElements
        .append('text')
        .attr('x', legendElementDim + legendElementPadding.right)
        .style('dominant-baseline', 'text-before-edge')
        .text(d => d.label);
      if (this.legendX === 'right' || this.legendX === 'left') {
        // translate elements
        this.calcVerticalLegendPosition(legendElements, legendElementPadding, this.legendX);
        // calc legend dimension
        const legendDimension = legendContainer.node().getBBox().width + 2 * legendPadding +
          (this.legendX === 'left' ? g.select('.y-axis').node().getBBox().width : 0);
        // translate container
        const xOffset = this.legendX === 'left' ? -legendDimension : (this.graphWidth + (this.scrollY ? this.scrollHeight : 0));
        legendContainer
          .attr('transform', 'translate(' + xOffset + ', 0)');
      } else if (this.legendY === 'bottom' || this.legendY === 'top') {
        // translate elements
        this.calcHorizontalLegendPosition(legendElements, legendElementPadding, this.legendY, legendElementDim);
        // calc legend dimension
        const legendDimension = legendContainer.node().getBBox().height + 2 * legendPadding
        const axisDimension = this.legendY === 'bottom' ? g.select('.x-axis').node().getBBox().height : 0;
        // translate container
        const xOffset = (this.graphWidth - legendContainer.node().getBBox().width) / 2;
        const yOffset = this.legendY === 'top' ? -legendDimension : this.graphHeight + axisDimension +
          (this.scrollX ? this.scrollHeight : 0);
        legendContainer
          .attr('transform', 'translate(' + xOffset + ',' + yOffset + ')');
      }
    }
  }
}
