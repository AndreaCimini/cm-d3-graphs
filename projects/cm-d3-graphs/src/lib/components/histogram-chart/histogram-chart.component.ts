import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input, OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2, SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';

import {HistogramGraphConfigurationInterface} from '../../interfaces/graph-configuration.interface';
import {HistogramGraphDataInterface} from '../../interfaces/graph-data.interface';
import {D3UtilityService} from '../../services/d3-utility.service';
import {BaseAxesCharts} from '../../core/base-axes-charts';

@Component({
  selector: 'cm-histogram-chart',
  templateUrl: './histogram-chart.component.html',
  styleUrls: ['./histogram-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistogramChartComponent extends BaseAxesCharts implements OnInit, OnChanges, OnDestroy {

  @ViewChild('histogramChart', {static: true}) histogramChart: ElementRef;

  @Input() graphData: HistogramGraphDataInterface[];
  @Input() graphConfigs: HistogramGraphConfigurationInterface;

  @Output() clickOnBar: EventEmitter<HistogramGraphDataInterface> = new EventEmitter<HistogramGraphDataInterface>();

  private padding: number;

  constructor(private d3UtilityService: D3UtilityService, private renderer2: Renderer2) {
    super(renderer2);
  }

  ngOnInit() {
    if (this.graphConfigs && this.graphData) {
      // init variables
      this.initVariables();
      this.scrollHeight = 40;
      // get container dimension
      const graphContainer = this.histogramChart.nativeElement;
      const width = graphContainer.clientWidth;
      const height = graphContainer.clientHeight;

      // create graph
      if (this.graphDataArranged.length > 0) {
        // calc grouped series
        this.calcGroupedSeries(this.graphConfigs);
        this.createGraph(width, height);
      }

      // init listeners
      this.initListeners(this.histogramChart, this.graphConfigs);
    }
  }

  private initVariables() {
    // arrange configuration
    this.graphConfigs = this.d3UtilityService.arrangeConfigurations(this.graphConfigs, this.graphData) as HistogramGraphConfigurationInterface;
    // arrange data
    this.graphDataArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.graphData);
    // init variables
    this.scrollX = this.graphConfigs.orientation === 'vertical' && this.graphDataArranged.length > this.graphConfigs.maxDisplayedNumber;
    this.scrollY = this.graphConfigs.orientation === 'horizontal' && this.graphDataArranged.length > this.graphConfigs.maxDisplayedNumber;
    this.legendX = this.graphConfigs.legend.enabled && (this.graphConfigs.legend.position === 'right' ||
      this.graphConfigs.legend.position === 'left') ? this.graphConfigs.legend.position : null;
    this.legendY = this.graphConfigs.legend.enabled && (this.graphConfigs.legend.position === 'top' ||
      this.graphConfigs.legend.position === 'bottom') ? this.graphConfigs.legend.position : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.graphConfigs && !changes.graphConfigs.firstChange) || (changes.graphData && !changes.graphData.firstChange)) {
      // init variables
      this.initVariables();
      if (this.graphDataArranged && this.graphDataArranged.length > 0) {
        this.calcGroupedSeries(this.graphConfigs);
        // update graph
        this.onScroll(0, false, true);
      } else {
        // empty graph container
        d3.select(this.histogramChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private createBarsUtilFn(container, groupClass: string, graphData, graphOrientation: string,
                           axes: { x, y, axisXRange, axisYRange, groupedAxis }, subBarClass: string) {
    // remove old data
    container.selectAll('.' + groupClass).remove();
    // append the bar rectangles to the container element
    return container.selectAll('.' + groupClass)
      .data(graphData)
      .enter()
      // for each group append an g
      .append('g')
      .attr('id', d => d.id)
      .attr('class', groupClass)
      .attr('transform', d => {
        if (graphOrientation === 'horizontal') {
          return 'translate(0,' + axes.y(d.label) + ')';
        } else if (graphOrientation === 'vertical') {
          return 'translate(' + axes.x(d.label) + ',0)';
        }
      })
      .selectAll('.' + subBarClass)
      .data(d => d.values.map((v, i) => ({...v, id: subBarClass + '_' + d.id + '_' + i})))
      .enter()
      .append('rect')
      .attr('class', subBarClass)
      .attr('id', d => d.id)
      .attr('fill', (d, i: number) => this.graphConfigs.groups[i].color);
  }

  private computeBarsData(graphData: HistogramGraphDataInterface[]): any[] {
    const barsData = [];
    // loop over input data
    for (const d of graphData) {
      // copy input data, but remove values
      const newData = {...d, values: []};
      // init offsets
      let offsetXNegative = 0;
      let offsetYNegative = 0;
      let offsetXPositive = 0;
      let offsetYPositive = 0;
      // set new data values
      d.values.forEach((v, i: number) => {
        newData.values.push({
          index: i,
          label: d.label,
          value: v,
          offsetX: v >= 0 ? offsetXPositive : offsetXNegative,
          offsetY: v >= 0 ? offsetYPositive : offsetYNegative
        });
        // increase offset
        if (this.graphConfigs.groupedType === 'stacked') {
          if (v >= 0) {
            offsetXPositive += v;
            offsetYPositive += v;
          } else {
            offsetXNegative += v;
            offsetYNegative += v;
          }
        }
      });
      barsData.push(newData);
    }
    return barsData;
  }

  private createBars(g, axes: { x, y, axisXRange, axisYRange, groupedAxis }, graphData: HistogramGraphDataInterface[],
                     enableAnimation: boolean) {
    this.doingTransition = true;
    // adjust data
    const barsData = this.computeBarsData(graphData);
    // call utility function to create bars
    const bars = this.createBarsUtilFn(g, 'groupG', barsData, this.graphConfigs.orientation, axes, 'mainBars');
    bars
      .attr('x', d => {
        if (this.graphConfigs.orientation === 'vertical') {
          return axes.groupedAxis(d.index);
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return axes.x(d.offsetX);
        }
      })
      .attr('y', d => {
        if (this.graphConfigs.orientation === 'vertical') {
          return axes.y(d.offsetY);
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return axes.groupedAxis(d.index);
        }
      })
      .attr('width', () => {
        if (this.graphConfigs.orientation === 'vertical') {
          return axes.groupedAxis.bandwidth();
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return 0;
        }
      })
      .attr('height', () => {
        if (this.graphConfigs.orientation === 'vertical') {
          return 0;
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return axes.groupedAxis.bandwidth();
        }
      })
      .style('cursor', this.graphConfigs.events.clickOnElement ? 'pointer' : '')
      .on('mouseenter', (e, d) => {
        // get all bar nodes
        const barNodes = d3.select(this.histogramChart.nativeElement).selectAll('.mainBars').nodes();
        if (!this.doingTransition) {
          for (const node of barNodes) {
            if (node['id'] !== d.id) { // tslint:disable-line
              d3.select(node)
                .style('opacity', 0.3);
            }
          }
          // show tooltip
          this.showTooltip(e, g, this.graphConfigs, d);
        }
      })
      .on('mouseout', event => {
        // get all group nodes
        const barNodes = d3.select(this.histogramChart.nativeElement).selectAll('.mainBars').nodes();
        if (!this.doingTransition &&
          (!(event.toElement as HTMLElement) || (event.toElement as HTMLElement).className !== 'd3-tooltip')) {
          for (const node of barNodes) {
            d3.select(node)
              .style('opacity', 1);
          }
          // hide tooltip
          this.hideTooltip(g);
        }
      })
      .on('click', (e, d) => {
        if (!this.doingTransition && this.graphConfigs.events.clickOnElement) {
          // send event
          this.clickOnBar.emit(d);
        }
      });
    // set animation
    if (this.graphConfigs.orientation === 'vertical') {
      g.selectAll('.mainBars')
        .transition()
        .duration(enableAnimation ? 2000 : 0)
        .attr('height', d => Math.abs(axes.y(0) - axes.y(d.value)))
        .attr('y', d => {
          if (this.graphConfigs.axis.invertAxisY) {
            return d.value >= 0 ? axes.y(d.offsetY) : axes.y(d.offsetY + d.value);
          }
          return d.value >= 0 ? axes.y(d.offsetY + d.value) : axes.y(d.offsetY);
        })
        .on('end', () => {
          this.doingTransition = false;
        });
    } else if (this.graphConfigs.orientation === 'horizontal') {
      g.selectAll('.mainBars')
        .transition()
        .duration(enableAnimation ? 2000 : 0)
        .attr('width', d => Math.abs(axes.x(0) - axes.x(d.value)))
        .attr('x', d => {
          if (this.graphConfigs.axis.invertAxisX) {
            return d.value >= 0 ? axes.x(d.offsetX + d.value) : axes.x(d.offsetX);
          }
          return d.value >= 0 ? axes.x(d.offsetX) : axes.x(d.offsetX + d.value);
        })
        .on('end', () => {
          this.doingTransition = false;
        });
    }
  }

  private createScroll(g) {
    // remove old data
    g.select('.scrollContainer').remove();
    if (this.scrollX || this.scrollY) {
      const scrollData = this.createScrollContainer(g, this.graphConfigs);
      // adjust data
      const barsData = this.computeBarsData(this.graphDataArranged);
      // call utility function to create sub bars
      const bars = this.createBarsUtilFn(scrollData.scrollContainer, 'subGroupG', barsData, scrollData.orientation,
        scrollData.axes, 'subBars');
      bars
        .style('opacity', 0.5)
        .attr('x', d => {
          if (this.scrollX) {
            return scrollData.axes.groupedAxis(d.index);
          } else if (this.scrollY) {
            if (this.graphConfigs.axis.invertAxisX) {
              return d.value >= 0 ? scrollData.axes.x(d.offsetX + d.value) : scrollData.axes.x(d.offsetX);
            }
            return d.value >= 0 ? scrollData.axes.x(d.offsetX) : scrollData.axes.x(d.offsetX + d.value);
          }
        })
        .attr('y', d => {
          if (this.scrollX) {
            if (this.graphConfigs.axis.invertAxisY) {
              return d.value >= 0 ? scrollData.axes.y(d.offsetY) : scrollData.axes.y(d.value + d.offsetY);
            }
            return d.value >= 0 ? scrollData.axes.y(d.value + d.offsetY) : scrollData.axes.y(d.offsetY);
          } else if (this.scrollY) {
            return scrollData.axes.groupedAxis(d.index);
          }
        })
        .attr('width', d => {
          if (this.scrollX) {
            return scrollData.axes.groupedAxis.bandwidth();
          } else if (this.scrollY) {
            return Math.abs(scrollData.axes.x(0) - scrollData.axes.x(d.value))
          }
        })
        .attr('height', d => {
          if (this.scrollX) {
            return Math.abs(scrollData.axes.y(0) - scrollData.axes.y(d.value))
          } else if (this.scrollY) {
            return scrollData.axes.groupedAxis.bandwidth();
          }
        });
      // create scroll cursor
      this.createScrollCursor(this.graphConfigs, this.histogramChart, scrollData.scrollContainer, scrollData.axes,
        this.onScroll.bind(this));
    }
  }

  private buildGraph(graphData: HistogramGraphDataInterface[], g, enableAnimation: boolean) {
    // set axis by orientation
    const axes = this.createAxis(graphData, this.graphConfigs, this.padding);

    // crate grid
    this.createGrid(this.histogramChart, this.graphConfigs, g, axes);

    // create bars
    this.createBars(g, axes, graphData, enableAnimation);

    // add axes
    this.addAxes(this.histogramChart, graphData, this.graphConfigs, g, axes);
  }

  private createGraph(width: number, height: number) {
    // manage graph data
    const graphData = this.graphConfigs.maxDisplayedNumber ? this.graphDataArranged.slice(0, this.graphConfigs.maxDisplayedNumber) :
      this.graphDataArranged;

    const svg = d3.select(this.histogramChart.nativeElement).select('#chart-container')
      .append('svg:svg') // create the SVG element inside the container
      .attr('width', width) // set the width
      .attr('height', height); // set the height

    this.graphWidth = width - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = height - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);
    this.padding = 0.2; // 0 no padding, 1 padding equals to bandwidth (graphWidth / (graphData.length - 1))

    const g = svg
      .append('svg:g') // make a group to hold histogram chart
      .attr('id', 'main-g');

    // build the graph
    this.buildGraph(graphData, g, true);

    // add scroll
    this.createScroll(g);

    // add legend
    this.createLegend(g, this.graphConfigs);

    // scale to fit container
    this.fitGraph(this.histogramChart, this.graphConfigs, 0);
  }

  private onScroll(graphPage: number, isScrollEvent: boolean, enableAnimation: boolean) {
    // update graph
    const graphData = this.graphConfigs.maxDisplayedNumber ?
      this.graphDataArranged.slice(graphPage, graphPage + this.graphConfigs.maxDisplayedNumber) :
      this.graphDataArranged;
    // calc if scroll is needed
    this.scrollX = this.graphConfigs.orientation === 'vertical' && this.graphDataArranged.length > this.graphConfigs.maxDisplayedNumber;
    this.scrollY = this.graphConfigs.orientation === 'horizontal' && this.graphDataArranged.length > this.graphConfigs.maxDisplayedNumber;

    const g = d3.select(this.histogramChart.nativeElement).select('#main-g');
    // build the graph
    this.buildGraph(graphData, g, enableAnimation);
    // rebuild scroll
    if (!isScrollEvent) {
      // add scroll
      this.createScroll(g);
      // add legend
      this.createLegend(g, this.graphConfigs);
      // scale to fit container
      this.fitGraph(this.histogramChart, this.graphConfigs, 0);
    }
  }

  protected reloadGraph(graphContainer: ElementRef, graphConfig: HistogramGraphConfigurationInterface) {
    // get container dimension
    const newWidth = graphContainer.nativeElement.clientWidth;
    const newHeight = graphContainer.nativeElement.clientHeight;
    // update svg dimension
    d3.select(graphContainer.nativeElement).select('svg')
      .attr('width', newWidth) // set the width
      .attr('height', newHeight); // set the height
    // update dimension variables
    this.graphWidth = newWidth - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = newHeight - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);
    // update graph
    this.onScroll(0, false, false);
  }

  ngOnDestroy() {
    // remove listeners
    this.removeListeners();
  }


}
