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
import {DefaultArcObject} from 'd3';

import {PieGraphConfigurationInterface} from '../../interfaces/graph-configuration.interface';
import {PieGraphDataInterface} from '../../interfaces/graph-data.interface';
import {D3UtilityService} from '../../services/d3-utility.service';
import {BasePieCharts} from '../../core/base-pie-charts';

@Component({
  selector: 'cm-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartComponent extends BasePieCharts implements OnInit, OnChanges, OnDestroy {

  @ViewChild('pieChart', {static: true}) pieChart: ElementRef;

  @Input() graphData: PieGraphDataInterface[];
  @Input() graphConfigs: PieGraphConfigurationInterface;

  @Output() clickOnSlice: EventEmitter<PieGraphDataInterface> = new EventEmitter<PieGraphDataInterface>();

  private radius: number;

  constructor(private d3UtilityService: D3UtilityService, private renderer2: Renderer2) {
    super(renderer2);
  }

  ngOnInit() {
    if (this.graphConfigs && this.graphData) {
      // init variables
      this.initVariables();
      // get container dimension
      const graphContainer = this.pieChart.nativeElement;
      const width = graphContainer.clientWidth;
      const height = graphContainer.clientHeight;

      // create graph
      if (this.graphDataArranged.length > 0) {
        this.createGraph(width, height, true);
      }

      // init listeners
      this.initListeners(this.pieChart, this.graphConfigs);
    }
  }

  private initVariables() {
    // arrange configuration
    this.graphConfigs = this.d3UtilityService.arrangeConfigurations(this.graphConfigs) as PieGraphConfigurationInterface;
    // arrange data
    this.graphDataArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.graphData);
    // init variables
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
        const g = d3.select(this.pieChart.nativeElement).select('#main-g');
        // build graph
        const pie = this.buildGraph(g, true);
        // add legend
        this.createLegend(g, pie);
        // scale to fit container
        this.fitGraph(this.pieChart, this.graphConfigs, 0);
      } else {
        // empty graph container
        d3.select(this.pieChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private createLabel(g, pie, arc, outerArc) {
    // remove old labels
    d3.select(this.pieChart.nativeElement).selectAll('.slice-label-line').remove();
    d3.select(this.pieChart.nativeElement).selectAll('.slice-label-text').remove();
    // calc positions
    const positions = [];
    // get all slices
    d3.select(this.pieChart.nativeElement).selectAll('.slice-path').each(d => {
      // line insertion in the slice
      const posA = arc.centroid(d);
      // line break: use the other arc generator that has been built only for that
      const posB = outerArc.centroid(d);
      // Label position = almost the same as posB
      const posC = outerArc.centroid(d);
      // calc the angle to see if the X position will be at the extreme right or extreme left
      const midAngle = (d as DefaultArcObject).startAngle + (((d as DefaultArcObject).endAngle - (d as DefaultArcObject).startAngle) / 2);
      // multiply by 1 or -1 to put it on the right or on the left
      posC[0] += 50 * (midAngle < Math.PI ? 1 : -1);
      positions.push([posA, posB, posC]);
    });
    // prevent overlap
    this.manageLabelOverlap(positions);
    // create labels
    g.selectAll('.slice-label-line')
      .data(pie.reverse())
      .enter()
      .append('svg:polyline')
      .attr('class', 'slice-label-line')
      .attr('stroke', '#777')
      .style('fill', 'none')
      .attr('stroke-width', 1)
      .attr('points', (d, i) => positions[i]);

    g.selectAll('.slice-label-text')
      .data(pie.reverse())
      .enter()
      .append('svg:text') // add a label to each slice
      .attr('class', 'slice-label-text')
      .attr('transform', (d, i) => { // set the label's origin to the center of the arc
        // calc position
        const pos = positions[i][2];
        // calc the angle to see if the X position will be at the extreme right or extreme left
        const midAngle = d.startAngle + ((d.endAngle - d.startAngle) / 2);
        // move along x
        pos[0] -= 50 * (midAngle < Math.PI ? 1 : -1);
        // move along y
        pos[1] -= 5;
        return 'translate(' + pos + ')';
      })
      .style('text-anchor', d => {
        const midAngle = d.startAngle + ((d.endAngle - d.startAngle) / 2);
        return (midAngle < Math.PI ? 'start' : 'end');
      })
      .text(d => d.data.label); // get the label from original data
  }

  private pathAnim(nodes, i: number, dir: number, levels: number) {
    switch (dir) {
      case 0:
        nodes.forEach((node, index) => {
          if (index === i) {
            d3.select(node).transition()
              .duration(500)
              .ease(d3.easeBounce)
              .attr('d', d3.arc()
                .innerRadius(d => (d['data'].level - 1) * (this.radius / levels)) // tslint:disable-line
                .outerRadius(d => d['data'].level * (this.radius / levels)) // tslint:disable-line
              );
          } else {
            d3.select(node)
              .style('opacity', 1);
          }
        });
        break;
      case 1:
        nodes.forEach((node, index) => {
          if (index === i) {
            d3.select(node).transition()
              .attr('d', d3.arc()
                .innerRadius(d => (d['data'].level - 1) * (this.radius / levels)) // tslint:disable-line
                .outerRadius(d => (d['data'].level * (this.radius / levels)) * 1.08) // tslint:disable-line
              );
          } else {
            d3.select(node)
              .style('opacity', 0.3);
          }
        });
        break;
      default:
        break;
    }
  }

  private arcTween(arc, d) {
    const i = d3.interpolate({startAngle: 0, endAngle: 0, data: {level: d.data.level}},
      {startAngle: d.startAngle, endAngle: d.endAngle, data: {level: d.data.level}});
    return t => arc(i(t));
  }

  private createSlice(g, pie, arc, outerArc, levels: number, enableAnimation: boolean) {
    this.doingTransition = true;
    // delete old slice
    g.selectAll('.slice').remove();
    // create arcs
    const arcs = g.selectAll('.slice') // select all <g> elements (there aren't any yet)
      .data(pie.reverse()) // associate original data (reverse data to add before outer data and after inner data.
      // This is done for slice animation)
      .enter() // create <g> elements for every object in the data array
      .append('svg:g') // create a group to hold each slice (there are <path> and <text> element associated with each slice)
      .attr('class', 'slice');

    arcs.append('svg:path')
      .attr('class', 'slice-path')
      // set the color for each slice to be chosen from the color set defined above
      .attr('fill', d => d.data.slice.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 3)
      .attr('d', arc) // create the SVG path using the associated data (pie) with the arc drawing function
      .style('cursor', this.graphConfigs.events.clickOnElement ? 'pointer' : '')
      .on('mouseenter', (e, d, b) => {
        if (!this.doingTransition) {
          const nodes = arcs.selectAll('path').nodes();
          this.pathAnim(nodes, nodes.indexOf(e.currentTarget), 1, levels);
          // show tooltip
          this.showTooltip(e, g, this.graphConfigs, d.data);
        }
      })
      .on('mouseout', e => {
        if (!this.doingTransition &&
          (!(e.toElement as HTMLElement) || (e.toElement as HTMLElement).className !== 'd3-tooltip')) {
          const nodes = arcs.selectAll('path').nodes();
          this.pathAnim(nodes, nodes.indexOf(e.currentTarget), 0, levels);
          // hide tooltip
          this.hideTooltip(g);
        }
      })
      .on('click', (e, d) => {
        if (!this.doingTransition && this.graphConfigs.events.clickOnElement) {
          // send event
          this.clickOnSlice.emit(d.data);
        }
      })
      .transition()
      .duration(enableAnimation ? 1000 : 0)
      .attrTween('d', d => this.arcTween(arc, d))
      .on('end', () => {
        this.doingTransition = false;
      });

    // add values labels to slices
    arcs.append('svg:text') // add a label to each slice
      .attr('transform', d => 'translate(' + arc.centroid(d) + ')') // set the label's origin to the center of the arc
      .attr('text-anchor', 'middle') // center the text on it's origin
      .attr('fill', this.graphConfigs.slices.textColor)
      .text(d => d.value);

    // add labels
    this.createLabel(g, pie, arc, outerArc);
  }

  private arrangeDataByLevel() {
    const dataByLevel = [[]];
    // loop over data
    let level = this.graphConfigs.type === 'donut' ? 2 : 1;
    let currentLevelCounter = 0;
    // sort data to have grater elements in first level and smaller elements in last level (descending order)
    const sortedData = this.graphDataArranged.sort((a: PieGraphDataInterface, b: PieGraphDataInterface) => {
      if (a.value < b.value) {
        return 1;
      }
      if (a.value > b.value) {
        return -1;
      }
      return 0;
    });
    for (const d of sortedData) {
      // check if current level is full
      if (this.graphConfigs.maxDisplayedNumber && currentLevelCounter >= this.graphConfigs.maxDisplayedNumber) {
        // go to next level
        level++;
        // reset current level
        currentLevelCounter = 0;
        // add new empty level
        dataByLevel.push([]);
      }
      dataByLevel[dataByLevel.length - 1].push({...d, level});
      currentLevelCounter++;
    }
    return dataByLevel;
  }

  private buildGraph(g, enableAnimation: boolean): any[] {
    // manage graph data (divide data by level to manage a lot of data - depends on maxDisplayedNumber)
    const graphData = this.arrangeDataByLevel();
    // create <path> elements using arc data
    const totLevels = this.graphConfigs.type === 'donut' ? graphData.length + 1 : graphData.length;
    const arc = d3.arc()
      .innerRadius(d => (d['data'].level - 1) * (this.radius / totLevels)) // tslint:disable-line
      .outerRadius(d => d['data'].level * (this.radius / totLevels)); // tslint:disable-line

    // for each level calc pie data
    let pie = [];
    let firstLevelValuesSum;
    const endAngles = [];
    graphData.forEach((levelData, index: number) => {
      let endAngle;
      if (index === 0) { // first level
        // for the first level the end angle is 2*PI
        endAngle = 2 * Math.PI;
        // calc the sum of values of first level
        firstLevelValuesSum = levelData.reduce((sum: number, elem) => sum + elem.value, 0);
      } else { // others level
        // for the first level the sum of values corresponds to 2*PI angle
        // to normalize the angles of the others levels, we have to find the ratio between first level and current level
        const currentLevelValuesSum = levelData.reduce((sum: number, elem) => sum + elem.value, 0);
        const ratio = currentLevelValuesSum / firstLevelValuesSum;
        // the end angle will be 2*PI*ratio
        endAngle = 2 * Math.PI * ratio;
      }
      endAngles.push(endAngle);
      // create arc data from list of values
      pie = pie.concat(d3.pie<PieGraphDataInterface>()
        .value(d => (d.value)).endAngle(endAngle)(levelData));
    });

    // Another arc that won't be drawn. Just for labels positioning
    const labelArcFn = d => {
      let labelArcRadius = this.radius * 1.1;
      let labelLevel = d.data.level;
      // check if over current element there are others levels
      endAngles.forEach((angle: number, i: number) => {
        // i corresponds to the level number for current end angle
        if (i + (this.graphConfigs.type === 'donut' ? 1 : 0) > d.data.level - 1) {
          // calc the bisector of current angle
          const bisector = (d.endAngle + d.startAngle) / 2;
          // check if bisector angle is between current level angle range
          if (bisector <= angle) {
            // update label level
            labelLevel = i + 1;
          } else {
            labelArcRadius = labelLevel * (this.radius / totLevels) * 1.1;
            return false;
          }
        }
      });
      return labelArcRadius;
    };

    const outerArc = d3.arc()
      .innerRadius(d => labelArcFn(d))
      .outerRadius(d => labelArcFn(d));

    // create slice
    this.createSlice(g, pie, arc, outerArc, totLevels, enableAnimation);

    return pie;
  }

  private createGraph(width: number, height: number, enableAnimation: boolean) {
    const svg = d3.select(this.pieChart.nativeElement).select('#chart-container')
      .append('svg:svg') // create the SVG element inside the container
      .attr('width', width) // set the width
      .attr('height', height); // set the height

    this.graphWidth = width - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = height - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);
    this.radius = this.graphHeight / 2;

    const g = svg
      .append('svg:g') // make a group to hold pie chart
      .attr('id', 'main-g');

    // build the graph
    const pie = this.buildGraph(g, enableAnimation);
    // add legend
    this.createLegend(g, pie);
    // scale to fit container
    this.fitGraph(this.pieChart, this.graphConfigs, 0);
  }

  protected reloadGraph(graphContainer: ElementRef, graphConfig: PieGraphConfigurationInterface) {
    // empty container
    d3.select(graphContainer.nativeElement).select('svg').remove();
    // get container dimension
    const width = graphContainer.nativeElement.clientWidth;
    const height = graphContainer.nativeElement.clientHeight;

    // create graph
    if (this.graphDataArranged.length > 0) {
      this.createGraph(width, height, false);
    }
  }

  ngOnDestroy() {
    // remove listeners
    this.removeListeners();
  }

}
