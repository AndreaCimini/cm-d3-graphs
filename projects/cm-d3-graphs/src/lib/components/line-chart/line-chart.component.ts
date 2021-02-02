import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  Output,
  Renderer2, SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';

import {LineGraphConfigurationInterface} from '../../interfaces/graph-configuration.interface';
import {LineGraphDataInterface} from '../../interfaces/graph-data.interface';
import {D3UtilityService} from '../../services/d3-utility.service';
import {BaseAxesCharts} from '../../core/base-axes-charts';

@Component({
  selector: 'cm-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineChartComponent extends BaseAxesCharts implements OnInit, OnChanges, OnDestroy {

  @ViewChild('lineChart', {static: true}) lineChart: ElementRef;

  @Input() graphData: LineGraphDataInterface[];
  @Input() graphConfigs: LineGraphConfigurationInterface;

  @Output() clickOnDot: EventEmitter<LineGraphDataInterface> = new EventEmitter<LineGraphDataInterface>();

  constructor(private d3UtilityService: D3UtilityService, private renderer2: Renderer2) {
    super(renderer2);
  }

  ngOnInit() {
    if (this.graphConfigs && this.graphData) {
      // init variables
      this.initVariables();
      this.scrollHeight = 40;
      // get container dimension
      const graphContainer = this.lineChart.nativeElement;
      const width = graphContainer.clientWidth;
      const height = graphContainer.clientHeight;

      // create graph
      if (this.graphDataArranged.length > 0) {
        this.createGraph(width, height);
      }

      // init listeners
      this.initListeners(this.lineChart, this.graphConfigs);
    }
  }

  private initVariables() {
    // arrange configuration
    this.graphConfigs = this.d3UtilityService.arrangeConfigurations(this.graphConfigs , this.graphData) as LineGraphConfigurationInterface;
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
        this.onScroll(0, false, true)
      } else {
        // empty graph container
        d3.select(this.lineChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private createArea(g, axes: { x, y, axisXRange, axisYRange, groupedAxis },
                     linesData: {value: number, label: string, index: number, id: string}[][], enableAnimation: boolean) {
    // remove old areas
    g.selectAll('.groupArea').remove();
    // create new area
    const area = d3.area<{value: number, label: string, index: number, id: string}>()
      .curve(d3.curveMonotoneX); // apply smoothing to the area
    if (this.graphConfigs.orientation === 'vertical') {
      area
        .x(d => axes.x(d.label))
        .y0(() => axes.y(0))
        .y1(() => axes.y(0));
    } else if (this.graphConfigs.orientation === 'horizontal') {
      area
        .y(d => axes.y(d.label))
        .x0(() => axes.x(0))
        .x1(() => axes.x(0));
    }

    // add the area
    g.selectAll('.groupArea')
      .data(linesData) // binds data to the line
      .enter()
      // for each group append an g
      .append('g')
      .attr('class', 'groupArea') // assign a class for styling
      .append('path')
      .attr('class', 'area')
      .attr('d', d => area(d))
      .style('fill', (d, i: number) => this.graphConfigs.groups[i].color)
      .style('opacity', 0.5);

    if (this.graphConfigs.orientation === 'vertical') {
      area.y1(d => axes.y(d.value));
    } else if (this.graphConfigs.orientation === 'horizontal') {
      area.x1(d => axes.x(d.value));
    }

    // animation
    g.selectAll('.area')
      .transition()
      .duration(enableAnimation ? 1000 : 0)
      .attr('d', d => area(d));
  }

  private createLines(g, axes: { x, y, axisXRange, axisYRange, groupedAxis },
                      linesData: {value: number, label: string, index: number, id: string}[][],
                      enableAnimation: boolean, groupClass: string, lineClass: string, orientation: string, isScroll: boolean) {
    // remove old lines
    g.selectAll('.' + groupClass).remove();
    // create new line
    const line = d3.line<{value: number, label: string, index: number, id: string}>()
      .curve(d3.curveMonotoneX); // apply smoothing to the line

    if (orientation === 'vertical') {
      line
        .x(d => axes.x(d.label)) // set the x values for the line generator
        .y(() => axes.y(0)); // set the y values for the line generator
    } else if (orientation === 'horizontal') {
      line
        .y(d => axes.y(d.label)) // set the y values for the line generator
        .x(() => axes.x(0)); // set the x values for the line generator
    }

    // append the line to the main g element
    const groupG = g.selectAll('.' + groupClass)
      .data(linesData) // binds data to the line
      .enter()
      // for each group append an g
      .append('g')
      .attr('class', groupClass); // assign a class for styling

    groupG
      .append('path')
      .attr('class', lineClass)
      .attr('d', d => line(d))
      .style('stroke', (d, i: number) => this.graphConfigs.groups[i].color)
      .style('opacity', isScroll ? 0.5 : 1);

    if (orientation === 'vertical') {
      line.y(d => axes.y(d.value)); // set the y values for the line generator
    } else if (orientation === 'horizontal') {
      line.x(d => axes.x(d.value)); // set the x values for the line generator
    }

    // animation
    g.selectAll('.' + lineClass)
      .transition()
      .duration(enableAnimation ? 1000 : 0)
      .attr('d', d => line(d));

    return groupG;
  }

  private createDots(g, groupG, axes: { x, y, axisXRange, axisYRange, groupedAxis }, enableAnimation: boolean) {
    this.doingTransition = true;
    // appends a circle for each data point
    groupG
      .selectAll('.dot')
      .data(d => d)
      .enter()
      .append('circle')
      .attr('id', d => d.id + '_' + d.index)
      .attr('class', 'dot') // assign a class for styling
      .style('fill', d => this.graphConfigs.groups[d.index].color)
      .style('cursor', this.graphConfigs.events.clickOnElement ? 'pointer' : '')
      .attr('cx', d => {
        if (this.graphConfigs.orientation === 'vertical') {
          return axes.x(d.label);
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return axes.x(0);
        }
      })
      .attr('cy', d => {
        if (this.graphConfigs.orientation === 'vertical') {
          return axes.y(0);
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return axes.y(d.label);
        }
      })
      .attr('r', 5)
      .on('mouseenter', (e, d) => {
        if (!this.doingTransition) {
          const dots = d3.selectAll('.dot').nodes();
          for (const dot of dots) {
            if (dot['id'] !== d.id + '_' + d.index) { // tslint:disable-line
              d3.select(dot)
                .style('opacity', 0.3);
            } else {
              d3.select(dot)
                .attr('r', 8);
            }
          }
          d3.selectAll('.line')
            .style('opacity', 0.3);
          // show tooltip
          this.showTooltip(e, g, this.graphConfigs, d);
        }
      })
      .on('mouseout', (e, d, i, nodes) => {
        if (!this.doingTransition &&
          (!(e.toElement as HTMLElement) || (e.toElement as HTMLElement).className !== 'd3-tooltip')) {
          const dots = d3.selectAll('.dot').nodes();
          for (const dot of dots) {
            d3.select(dot)
              .attr('r', 5)
              .style('opacity', 1);
          }
          d3.selectAll('.line')
            .style('opacity', 1);
          // hide tooltip
          this.hideTooltip(g);
        }
      })
      .on('click', (e, d) => {
        if (!this.doingTransition && this.graphConfigs.events.clickOnElement) {
          // send event
          this.clickOnDot.emit(d);
        }
      });
    // set animation
    g.selectAll('.dot')
      .transition()
      .duration(enableAnimation ? 1000 : 0)
      .attr('cy', d => {
        if (this.graphConfigs.orientation === 'vertical') {
          return axes.y(d.value);
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return axes.y(d.label);
        }
      })
      .attr('cx', d => {
        if (this.graphConfigs.orientation === 'vertical') {
          return axes.x(d.label);
        } else if (this.graphConfigs.orientation === 'horizontal') {
          return axes.x(d.value);
        }
      })
      .on('end', () => {
        this.doingTransition = false;
      });
  }

  private computeLinesData(graphData: LineGraphDataInterface[]): {value: number, label: string, index: number, id: string}[][] {
    return graphData.reduce((arr: {value: number, label: string, index: number, id: string}[][], elem: LineGraphDataInterface) => {
      const singleValues = elem.values.map((v: number, i: number) => ({value: v, label: elem.label, index: i, id: elem.id}));
      singleValues.forEach((v, j: number) => {
        if (!arr[j]) {
          arr[j] = [];
        }
        arr[j].push(v);
      });
      return arr;
    }, []);
  }

  private buildGraph(graphData: LineGraphDataInterface[], g, enableAnimation: boolean) {
    // adjust data
    const linesData = this.computeLinesData(graphData);
    // set axis by orientation
    const axes = this.createAxis(graphData, this.graphConfigs, 0);

    // crate grid
    this.createGrid(this.lineChart, this.graphConfigs, g, axes);

    // create area (areas must be added in a different g before line and dots one to guarantee hover and click)
    if (this.graphConfigs.hasArea) {
      this.createArea(g, axes, linesData, enableAnimation);
    }

    // create line
    const groupG = this.createLines(g, axes, linesData, enableAnimation, 'groupG', 'line', this.graphConfigs.orientation, false);

    // create dots
    this.createDots(g, groupG, axes, enableAnimation);

    // add axes
    this.addAxes(this.lineChart, graphData, this.graphConfigs, g, axes);
  }

  private createScroll(g) {
    // remove old data
    g.select('.scrollContainer').remove();
    if (this.scrollX || this.scrollY) {
      const scrollData = this.createScrollContainer(g, this.graphConfigs);
      // adjust data
      const linesData = this.computeLinesData(this.graphDataArranged);
      // create sub line
      this.createLines(scrollData.scrollContainer, scrollData.axes, linesData, false, 'subGroupG', 'sub-line',
        scrollData.orientation, true);
      // create scroll cursor
      this.createScrollCursor(this.graphConfigs, this.lineChart, scrollData.scrollContainer, scrollData.axes, this.onScroll.bind(this));
    }
  }

  private createGraph(width: number, height: number) {
    // manage graph data
    const graphData = this.graphConfigs.maxDisplayedNumber ? this.graphDataArranged.slice(0, this.graphConfigs.maxDisplayedNumber) :
      this.graphDataArranged;

    const svg = d3.select(this.lineChart.nativeElement).select('#chart-container')
      .append('svg:svg') // create the SVG element inside the container
      .attr('width', width) // set the width
      .attr('height', height); // set the height

    this.graphWidth = width - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = height - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);

    const g = svg
      .append('svg:g') // make a group to hold line chart
      .attr('id', 'main-g');

    // build the graph
    this.buildGraph(graphData, g, true);

    // add scroll
    this.createScroll(g);

    // add legend
    this.createLegend(g, this.graphConfigs);

    // scale to fit container
    this.fitGraph(this.lineChart, this.graphConfigs, 0);
  }

  private onScroll(graphPage: number, isScrollEvent: boolean, enableAnimation: boolean) {
    // update graph
    const graphData = this.graphConfigs.maxDisplayedNumber ?
      this.graphDataArranged.slice(graphPage, graphPage + this.graphConfigs.maxDisplayedNumber) :
      this.graphDataArranged;
    // calc if scroll is needed
    this.scrollX = this.graphConfigs.orientation === 'vertical' && this.graphDataArranged.length > this.graphConfigs.maxDisplayedNumber;
    this.scrollY = this.graphConfigs.orientation === 'horizontal' && this.graphDataArranged.length > this.graphConfigs.maxDisplayedNumber;

    const g = d3.select(this.lineChart.nativeElement).select('#main-g');
    // build the graph
    this.buildGraph(graphData, g, enableAnimation);
    // rebuild scroll
    if (!isScrollEvent) {
      // add scroll
      this.createScroll(g);
      // add legend
      this.createLegend(g, this.graphConfigs);
      // scale to fit container
      this.fitGraph(this.lineChart, this.graphConfigs, 0);
    }
  }

  protected reloadGraph(graphContainer: ElementRef, graphConfig: LineGraphConfigurationInterface) {
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
