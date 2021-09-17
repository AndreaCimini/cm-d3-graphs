import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';

import {RangeSliderGraphDataInterface} from '../../interfaces/graph-data.interface';
import {RangeSliderGraphConfigurationInterface} from '../../interfaces/graph-configuration.interface';
import {D3UtilityService} from '../../services/d3-utility.service';
import {BaseAxesCharts} from '../../core/base-axes-charts';

@Component({
  selector: 'cm-range-slider-chart',
  templateUrl: './range-slider-chart.component.html',
  styleUrls: ['./range-slider-chart.component.less']
})
export class RangeSliderChartComponent extends BaseAxesCharts implements OnInit, OnChanges, OnDestroy {

  @ViewChild('rangeSliderChart', {static: true}) rangeSliderChart: ElementRef;

  @Input() graphData: RangeSliderGraphDataInterface[];
  @Input() graphConfigs: RangeSliderGraphConfigurationInterface;

  @Output() rangeChanging: EventEmitter<RangeSliderGraphDataInterface[]> = new EventEmitter<RangeSliderGraphDataInterface[]>();
  @Output() rangeChanged: EventEmitter<RangeSliderGraphDataInterface[]> = new EventEmitter<RangeSliderGraphDataInterface[]>();

  handleDomain: RangeSliderGraphDataInterface[];
  private handleDraggedIndex: number;

  constructor(private d3UtilityService: D3UtilityService, private renderer2: Renderer2) {
    super(renderer2);
  }

  ngOnInit() {
    if (this.graphConfigs && this.graphData) {
      // init variables
      this.initVariables();
      // get container dimension
      const graphContainer = this.rangeSliderChart.nativeElement;
      const width = graphContainer.clientWidth;
      const height = graphContainer.clientHeight;

      // create graph
      if (this.graphDataArranged.length > 0) {
        this.createGraph(width, height);
      }

      // init listeners
      this.initListeners(this.rangeSliderChart, this.graphConfigs);
    }
  }

  private initVariables() {
    // arrange configuration
    this.graphConfigs = this.d3UtilityService.arrangeConfigurations(this.graphConfigs) as RangeSliderGraphConfigurationInterface;
    // arrange data
    this.graphDataArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.graphData) as RangeSliderGraphDataInterface[];
    // sort data
    this.graphDataArranged = this.graphDataArranged.sort((a, b) => {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      }
      return 0;
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.graphConfigs && !changes.graphConfigs.firstChange) || (changes.graphData && !changes.graphData.firstChange)) {
      // init variables
      this.initVariables();
      if (this.graphDataArranged && this.graphDataArranged.length > 0) {
        const g = d3.select(this.rangeSliderChart.nativeElement).select('#main-g');
        // build graph
        this.buildGraph(g);
        // scale to fit container
        this.fitGraph(this.rangeSliderChart, this.graphConfigs, 0);
      } else {
        // empty graph container
        d3.select(this.rangeSliderChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private createTrack(slider, trackClass: string, trackColor: string, trackWidth: number) {
    // create new track
    slider.append('line')
      .attr('class', trackClass)
      .attr('x1', this.graphConfigs.orientation === 'horizontal' ? 0 : this.graphWidth / 2)
      .attr('x2', this.graphConfigs.orientation === 'horizontal' ? this.graphWidth : this.graphWidth / 2)
      .attr('y1', this.graphConfigs.orientation === 'horizontal' ? this.graphHeight / 2 : 0)
      .attr('y2', this.graphConfigs.orientation === 'horizontal' ? this.graphHeight / 2 : this.graphHeight)
      .attr('stroke', trackColor)
      .attr('stroke-width', trackWidth)
      .attr('stroke-linecap', 'round');
  }

  private createSliderAxis(slider) {
    // define axis range and axis based on orientation and interval type
    let axisRange;
    let axis;
    if (this.graphConfigs.orientation === 'horizontal') {
      axisRange = [0, this.graphWidth];
    } else {
      axisRange = [0, this.graphHeight];
    }
    if (this.graphConfigs.interval.type === 'discrete') {
      // create scale that map from a discrete set of values to equally spaced points along the specified range
      axis = d3.scalePoint()
        .range(axisRange)
        .domain(this.graphDataArranged.map(d => (d as RangeSliderGraphDataInterface).value.toString()));
    } else {
      // create scale that use a linear function (y = m * x + b) to interpolate across the domain and range.
      const firstData: RangeSliderGraphDataInterface = this.graphDataArranged[0];
      const endData: RangeSliderGraphDataInterface = this.graphDataArranged[this.graphDataArranged.length - 1];
      axis = d3.scaleLinear()
        .range(axisRange)
        .domain([firstData.value, endData.value]);
    }
    // create axes object based on orientation
    const axes = {
      x: this.graphConfigs.orientation === 'horizontal' ? axis : undefined,
      y: this.graphConfigs.orientation === 'vertical' ? axis : undefined,
      axisXRange: this.graphConfigs.orientation === 'horizontal' ? axisRange : undefined,
      axisYRange: this.graphConfigs.orientation === 'vertical' ? axisRange : undefined,
      groupedAxis: undefined,
      tickValuesX: this.graphConfigs.orientation === 'horizontal' ?
        this.graphDataArranged.map(d =>
          this.graphConfigs.interval.type === 'discrete' ? (d as RangeSliderGraphDataInterface).value.toString() :
            (d as RangeSliderGraphDataInterface).value
        ) : undefined,
      tickValuesY: this.graphConfigs.orientation === 'vertical' ?
        this.graphDataArranged.map(d =>
          this.graphConfigs.interval.type === 'discrete' ? (d as RangeSliderGraphDataInterface).value.toString() :
            (d as RangeSliderGraphDataInterface).value
        ) : undefined
    };
    // add axes
    this.addAxes(this.rangeSliderChart, this.graphDataArranged, this.graphConfigs, slider, axes);
    // axes added with the previous function, by default, are positioned at bottom (for x axis) or at left (for y axis)
    // of the graph container. So we need to translate it
    const axisElem = slider.select(this.graphConfigs.orientation === 'horizontal' ? '.x-axis' : '.y-axis')
      .attr('transform', 'translate(' +
        (this.graphConfigs.orientation === 'horizontal' ? 0 : this.graphWidth / 2 - this.graphConfigs.track.width / 2) + ',' +
        (this.graphConfigs.orientation === 'horizontal' ? this.graphHeight / 2 + this.graphConfigs.track.width / 2 : 0)
        + ')');
    // remove axis line
    axisElem.select('.domain')
      .remove();
    return axis;
  }

  private createHandleSelection(slider, axis) {
    // remove old handle
    slider.selectAll('.parameter-value').remove();
    // define handle path
    // upper case letters are for absolute coordinates, while lowercase ones are for relative coordinates
    const handle = this.graphConfigs.orientation === 'horizontal' ? 'M-6,-5v10l6,5l6,-5v-10z' :
      'M5,-6h-10l-5,6l5,6h10z';
    // define handle domain (at first, if range is double we select all the range, otherwise we select the first value)
    this.handleDomain = this.graphConfigs.handle.type === 'double' ?
      [this.graphDataArranged[0], this.graphDataArranged[this.graphDataArranged.length - 1]] : [this.graphDataArranged[0]];
    // calc step
    let handleStep = this.graphConfigs.interval.step || 0;
    if ((this.graphConfigs.interval.step === undefined || this.graphConfigs.interval.step === null) && this.graphConfigs.interval.type === 'discrete') {
      // calc min distance between values
      handleStep = this.graphDataArranged.reduce((distance, elem, index) => {
        if (index > 1) {
          return Math.min(distance, Math.abs((elem as RangeSliderGraphDataInterface).value -
            (this.graphDataArranged[index - 1] as RangeSliderGraphDataInterface).value))
        } else if (index === 1) {
          return Math.abs((elem as RangeSliderGraphDataInterface).value -
            (this.graphDataArranged[index - 1] as RangeSliderGraphDataInterface).value);
        }
        return distance;
      }, 0);
    }
    // create handle container
    const handleG = slider.selectAll('.parameter-value')
      .data(this.handleDomain)
      .enter()
      .append('g')
      .attr('class', 'parameter-value')
      .attr('transform', d => 'translate(' +
        (this.graphConfigs.orientation === 'horizontal' ?
          axis(this.graphConfigs.interval.type === 'discrete' ? d.value.toString() : d.value) : this.graphWidth / 2) + ',' +
        (this.graphConfigs.orientation === 'horizontal' ? this.graphHeight / 2 :
          axis(this.graphConfigs.interval.type === 'discrete' ? d.value.toString() : d.value))
        + ')')
      .on('mouseenter', e => {
        if (this.graphConfigs.handle.showTooltip === 'on-hover') {
          // show tooltip
          d3.select(e.currentTarget).select('.d3-tooltip')
            .transition()
            .duration(200)
            .style('opacity', 0.9);
        }
      })
      .on('mouseout', e => {
        if (this.graphConfigs.handle.showTooltip === 'on-hover' &&
          (!(e.toElement as HTMLElement) || (e.toElement as HTMLElement).className !== 'd3-tooltip')) {
          // hide tooltip
          slider.selectAll('.d3-tooltip')
            .transition()
            .duration(500)
            .style('opacity', 0);
        }
      })
      .call( // init drag events
        d3.drag()
          .on('start', (e, d) => {
            this.handleDraggedIndex = this.handleDomain.findIndex(el => el.id === (d as RangeSliderGraphConfigurationInterface).id);
          })
          .on('drag', e => {
            this.dragged(e, this.handleDraggedIndex, slider, axis, handleStep)
          })
          .on('end', () => this.dragEnded())
      );
    // create handle
    handleG.append('path')
      .attr('d', handle)
      .attr('fill', this.graphConfigs.handle.fillColor)
      .attr('stroke', this.graphConfigs.handle.strokeColor);
    // create handle tooltip
    if (this.graphConfigs.handle.showTooltip === 'always' || this.graphConfigs.handle.showTooltip === 'on-hover') {
      this.createHandleTooltip(slider);
    }
  }

  private createHandleTooltip(slider) {
    // append tooltip container
    const tooltipContainer = slider.selectAll('.parameter-value')
      .append('g')
      .attr('class', (d, i) => i === 0 ? 'd3-tooltip start-handle-tooltip' : 'd3-tooltip end-handle-tooltip')
      .style('opacity', this.graphConfigs.handle.showTooltip === 'always' ? 1 : 0);
    // append tooltip text
    const tooltipText = tooltipContainer
      .append('text')
      .style('font-size', '0.8rem')
      .style('font-weight', '500')
      .attr('fill', 'rgba(255, 255, 255, 0.87)')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'text-before-edge')
      .text(d => this.graphConfigs.tooltipFormat(undefined, d.value));
    // create text container
    const tooltipTextNodes = tooltipText.nodes();
    tooltipContainer
      .insert('rect', 'text')
      .attr('width', (d, i) => tooltipTextNodes[i].getBBox().width + 20) // 20 it's for padding
      .attr('height', (d, i) => tooltipTextNodes[i].getBBox().height + 16) // 16 it's for padding
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'rgb(97, 97, 97)');
    // center text (the text is below the upper edge of the rectangle and middle anchored to the left upper edge)
    tooltipText
      // 8 it's the result of (rectHeight - textHeight) / 2
      .attr('transform', (d, i) => 'translate(' + ((tooltipTextNodes[i].getBBox().width + 20) / 2) + ',' + 8 + ')');
    // get handle
    const handlesPath = slider.selectAll('.parameter-value path').nodes();
    // translate tooltip
    if (this.graphConfigs.orientation === 'horizontal') {
      tooltipContainer
        .attr('transform', (d, i) => 'translate(' +
          (i === 0 ? -(tooltipTextNodes[i].getBBox().width + 20 - handlesPath[i].getBBox().width / 2) :
            -(handlesPath[i].getBBox().width / 2)) + ',' +
          // 26 it's the sum between label padding (16) and the distance between tooltip and handle (10)
          (-tooltipTextNodes[i].getBBox().height - 26) + ')');
    } else {
      tooltipContainer
        .attr('transform', (d, i) => 'translate(' + 10 + ',' +
          (i === 0 ? -(tooltipTextNodes[i].getBBox().height + 16 - handlesPath[i].getBBox().height / 2) :
            -(handlesPath[i].getBBox().height / 2)) + ')');
    }
  }

  private scalePointPosition(axis, pos): {value: number} | RangeSliderGraphDataInterface {
    if (this.graphConfigs.interval.type === 'discrete') {
      // calc x value from position (in pixels)
      const domain = axis.domain(); // get domain (values from data)
      const range = axis.range(); // get range (values in pixels)
      const rangePoints = d3.range(range[0], range[1], axis.step()); // for each data get pixel position /(excluded last point)
      // include last point
      rangePoints.push(range[1]);
      // find the index of the point nearest the current position and get corresponding domain element
      const position = domain[d3.leastIndex(rangePoints.map(d => Math.abs(d - pos)))];
      // return corresponding graph data
      return this.graphDataArranged.find(d => (d as RangeSliderGraphDataInterface).value.toString() === position);
    } else {
      return {value: axis.invert(pos)};
    }
  }

  private updateHandleTooltip(slider, index: number) {
    const parameterValue = slider.selectAll('.parameter-value').filter((d, i) => i === index);
    const tooltipText = parameterValue.select('.d3-tooltip text')
      .text(() => this.graphConfigs.tooltipFormat(undefined, this.handleDomain[index].value));
    const tooltipTextNode = tooltipText.node().getBBox();
    // update tooltip dimensions
    parameterValue.select('.d3-tooltip rect')
      .attr('width', tooltipTextNode.width + 20) // 20 it's for padding
      .attr('height', tooltipTextNode.height + 16); // 16 it's for padding
    // center text (the text is below the upper edge of the rectangle and middle anchored to the left upper edge)
    tooltipText
      // 8 it's the result of (rectHeight - textHeight) / 2
      .attr('transform', (d, i) => 'translate(' + ((tooltipTextNode.width + 20) / 2) + ',' + 8 + ')');
    // get handle
    const handlesPath = parameterValue.select('path').node();
    // translate tooltip
    if (this.graphConfigs.orientation === 'horizontal') {
      parameterValue.select('.d3-tooltip')
        .attr('transform', 'translate(' +
          (index === 0 ? -(tooltipTextNode.width + 20 - handlesPath.getBBox().width / 2) : -(handlesPath.getBBox().width / 2)) + ',' +
          // 26 it's the sum between label padding (16) and the distance between tooltip and handle (10)
          (-tooltipTextNode.height - 26) + ')'
        );
    } else {
      parameterValue.select('.d3-tooltip')
        .attr('transform', 'translate(' + 10 + ',' +
          (index === 0 ? -(tooltipTextNode.height + 16 - handlesPath.getBBox().height / 2) : -(handlesPath.getBBox().height / 2)) + ')'
        );
    }
  }

  private updateHandle(index: number, slider, axis, newValue) {
    this.handleDomain[index] = newValue;
    slider.selectAll('.parameter-value')
      .data(this.handleDomain)
      .transition()
      .ease(d3.easeQuadOut)
      .duration(200)
      .attr('transform', d => 'translate(' +
        (this.graphConfigs.orientation === 'horizontal' ?
          axis(this.graphConfigs.interval.type === 'discrete' ? d.value.toString() : d.value) : this.graphWidth / 2) + ',' +
        (this.graphConfigs.orientation === 'horizontal' ? this.graphHeight / 2 :
          axis(this.graphConfigs.interval.type === 'discrete' ? d.value.toString() : d.value))
        + ')');
    // update track fill
    const firstData: RangeSliderGraphDataInterface = this.graphDataArranged[0];
    if (this.graphConfigs.orientation === 'horizontal') {
      slider.select('.track-fill')
        .attr('x1', axis(this.graphConfigs.handle.type === 'double' ?
          (this.graphConfigs.interval.type === 'discrete' ? this.handleDomain[0].value.toString() : this.handleDomain[0].value ) :
          (this.graphConfigs.interval.type === 'discrete' ? firstData.value.toString() : firstData.value )
        ))
        .attr('x2', axis(this.graphConfigs.handle.type === 'double' ?
          (this.graphConfigs.interval.type === 'discrete' ? this.handleDomain[1].value.toString() : this.handleDomain[1].value ) :
          (this.graphConfigs.interval.type === 'discrete' ? this.handleDomain[0].value.toString() : this.handleDomain[0].value )
        ));
    } else {
      slider.select('.track-fill')
        .attr('y1', axis(this.graphConfigs.handle.type === 'double' ?
          (this.graphConfigs.interval.type === 'discrete' ? this.handleDomain[0].value.toString() : this.handleDomain[0].value ) :
          (this.graphConfigs.interval.type === 'discrete' ? firstData.value.toString() : firstData.value )
        ))
        .attr('y2', axis(this.graphConfigs.handle.type === 'double' ?
          (this.graphConfigs.interval.type === 'discrete' ? this.handleDomain[1].value.toString() : this.handleDomain[1].value ) :
          (this.graphConfigs.interval.type === 'discrete' ? this.handleDomain[0].value.toString() : this.handleDomain[0].value )
        ));
    }
    // update handle tooltip
    if (this.graphConfigs.handle.showTooltip === 'always' || this.graphConfigs.handle.showTooltip === 'on-hover') {
      this.updateHandleTooltip(slider, index);
    }
  }

  private dragged(event, index: number, slider, axis, handleStep: number) {
    // get position (in pixels)
    const position = this.graphConfigs.orientation === 'horizontal' ? event.x : event.y;
    // compute new value from position
    const newValue = this.scalePointPosition(axis, position);
    // check if newValue coincides with start/end (depends on index)
    let canBeMoved = false;
    if (newValue) {
      // if we have two handles, we can move them if they don't overcome with each other
      if (this.graphConfigs.handle.type === 'double' &&
        ((index === 0 && newValue.value <= this.handleDomain[1].value - handleStep) ||
          (index === 1 && newValue.value >= this.handleDomain[0].value + handleStep))) {
        canBeMoved = true;
      } else if (this.graphConfigs.handle.type === 'single' && newValue) { // if we have one handle, we can move it always
        canBeMoved = true;
      }
      // prevent outside range event
      const startHandle: RangeSliderGraphDataInterface = this.graphDataArranged[0];
      const endHandle: RangeSliderGraphDataInterface = this.graphDataArranged[this.graphDataArranged.length - 1];
      if (newValue.value < startHandle.value) {
        newValue.value = startHandle.value;
      } else if (newValue.value > endHandle.value) {
        newValue.value = endHandle.value;
      }
    }
    // move handler
    if (canBeMoved) {
      // update handle
      this.updateHandle(index, slider, axis, newValue);
      // send event
      if (this.graphConfigs.events.rangeChanging) {
        this.rangeChanging.emit(this.handleDomain);
      }
    } else {
      // stop drag
      event.sourceEvent.stopPropagation();
    }
  }

  private dragEnded() {
    // reset handle dragged index
    this.handleDraggedIndex = null;
    // send event
    if (this.graphConfigs.events.rangeChanged) {
      this.rangeChanged.emit(this.handleDomain);
    }
  }

  private moveHandleOnClick(event, slider, axis) {
    // get position (in pixels)
    const position = this.graphConfigs.orientation === 'horizontal' ? d3.pointer(event, event.currentTarget)[0] :
      d3.pointer(event, event.currentTarget)[1];
    // compute new value from position
    const newValue = this.scalePointPosition(axis, position);
    if (newValue) {
      // check if newValue coincides with start/end
      let handleIndex;
      if (newValue === this.handleDomain[0]) {
        handleIndex = 0;
      } else if (newValue === this.handleDomain[1]) {
        handleIndex = 1;
      } else {
        handleIndex = d3.leastIndex(
          this.handleDomain.map(d => Math.abs(
            axis(this.graphConfigs.interval.type === 'discrete' ? d.value.toString() : d.value) -
            axis(this.graphConfigs.interval.type === 'discrete' ? newValue.value.toString() : newValue.value)
          ))
        );
      }
      // prevent outside range event
      const startHandle: RangeSliderGraphDataInterface = this.graphDataArranged[0];
      const endHandle: RangeSliderGraphDataInterface = this.graphDataArranged[this.graphDataArranged.length - 1];
      if (newValue.value < startHandle.value) {
        newValue.value = startHandle.value;
      } else if (newValue.value > endHandle.value) {
        newValue.value = endHandle.value;
      }
      // update handle
      this.updateHandle(handleIndex, slider, axis, newValue);
      // send event
      if (this.graphConfigs.events.rangeChanging) {
        this.rangeChanging.emit(this.handleDomain);
      }
      if (this.graphConfigs.events.rangeChanged) {
        this.rangeChanged.emit(this.handleDomain);
      }
    }
  }

  private buildGraph(g) {
    // remove old slider
    d3.select('#slider').remove();
    // create slider
    const slider = g.append('g')
      .attr('id', 'slider')
      .style('cursor', this.graphConfigs.orientation === 'horizontal' ? 'ew-resize' : 'ns-resize');
    // create track
    this.createTrack(slider, 'track', this.graphConfigs.track.color, this.graphConfigs.track.width);
    // create inset track
    this.createTrack(slider, 'track-inset', this.graphConfigs.track.insetColor, this.graphConfigs.track.insetWidth);
    // create track fill
    this.createTrack(slider, 'track-fill', this.graphConfigs.track.fillColor, this.graphConfigs.track.fillWidth);
    // if we have only one handle, update track fill
    if (this.graphConfigs.handle.type === 'single') {
      const trackFill = slider.select('.track-fill');
      if (this.graphConfigs.orientation === 'horizontal') {
        trackFill.attr('x2', 0);
      } else {
        trackFill.attr('y2', 0);
      }
    }
    // create axis
    const axis = this.createSliderAxis(slider);
    // create handle selection
    this.createHandleSelection(slider, axis);
    // click event
    slider.on('click', e => this.moveHandleOnClick(e, slider, axis));
  }

  private createGraph(width: number, height: number) {
    const svg = d3.select(this.rangeSliderChart.nativeElement).select('#chart-container')
      .append('svg:svg') // create the SVG element inside the container
      .attr('width', width) // set the width
      .attr('height', height); // set the height

    this.graphWidth = width - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = height - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);

    const g = svg
      .append('svg:g') // make a group to hold pie chart
      .attr('id', 'main-g');

    // build the graph
    this.buildGraph(g);
    // scale to fit container
    this.fitGraph(this.rangeSliderChart, this.graphConfigs, 0);
  }

  protected reloadGraph(graphContainer: ElementRef, graphConfig: RangeSliderGraphConfigurationInterface) {
    // empty container
    d3.select(graphContainer.nativeElement).select('svg').remove();
    // get container dimension
    const width = graphContainer.nativeElement.clientWidth;
    const height = graphContainer.nativeElement.clientHeight;

    // create graph
    if (this.graphDataArranged.length > 0) {
      this.createGraph(width, height);
    }
  }

  ngOnDestroy() {
    // remove listeners
    this.removeListeners();
  }

}
