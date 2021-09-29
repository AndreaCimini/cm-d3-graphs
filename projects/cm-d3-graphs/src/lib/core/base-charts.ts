import {ElementRef, Renderer2} from '@angular/core';
import * as d3 from 'd3';

import {GraphDataInterface} from '../interfaces/graph-data.interface';
import {GraphConfigurationInterface, NodeGraphInterface} from '../interfaces/graph-configuration.interface';

export abstract class BaseCharts {

  // ALL GRAPHS
  protected graphWidth: number;
  protected graphHeight: number;
  protected graphDataArranged: GraphDataInterface[];
  private windowResize: () => void;
  protected doingTransition: boolean;

  protected constructor(private renderer: Renderer2) {
  }

  // ALL GRAPHS
  protected reloadGraph(graphContainer: ElementRef, graphConfig: GraphConfigurationInterface) {
    // get container dimension
    const width = graphContainer.nativeElement.clientWidth;
    const height = graphContainer.nativeElement.clientHeight;
    // update svg dimension
    d3.select(graphContainer.nativeElement).select('svg')
      .attr('width', width) // set the width
      .attr('height', height); // set the height
    // scale to fit container
    this.fitGraph(graphContainer, graphConfig, 0);
  }

  private calculateTranslateAndScale(graphContainer: ElementRef, container, graphConfig: GraphConfigurationInterface,
                                     boundsDimension?: {x: number, y: number, width: number, height: number}):
    { scale: number, translate: number[] } {
    // get container bounds (height, width and position)
    const bounds = boundsDimension ? boundsDimension : (container.node() as SVGSVGElement).getBBox();
    // get parent
    const parent = (container.node() as SVGElement).parentElement;
    // get parent dimensions (height, width)
    let fullWidth = parent.clientWidth;
    let fullHeight = parent.clientHeight;
    // if overflow is enabled and dimensions of g are grater than svg, update svg dimensions to child ones
    if (graphConfig.overflowX && bounds.width > parent.clientWidth) {
      fullWidth = bounds.width;
      d3.select(parent).attr('width', fullWidth);
      this.renderer.setStyle(graphContainer.nativeElement, 'overflow-x', 'scroll');
      // need to update height too, due to scrollbar
      fullHeight = graphContainer.nativeElement.clientHeight;
      d3.select(parent).attr('height', fullHeight);
    } else {
      this.renderer.setStyle(graphContainer.nativeElement, 'overflow-x', 'none');
    }
    if (graphConfig.overflowY && bounds.height > parent.clientHeight) {
      fullHeight = bounds.height;
      d3.select(parent).attr('height', fullHeight);
      this.renderer.setStyle(graphContainer.nativeElement, 'overflow-y', 'scroll');
      // need to update width too, due to scrollbar
      fullWidth = graphContainer.nativeElement.clientWidth;
      d3.select(parent).attr('width', fullWidth);
    } else {
      this.renderer.setStyle(graphContainer.nativeElement, 'overflow-y', 'none');
    }
    // get container dimensions (height, width)
    const width = bounds.width;
    const height = bounds.height;
    // calc middle position
    const midX = bounds.x + (width / 2);
    const midY = bounds.y + (height / 2);
    // nothing to fit
    if (width === 0 || height === 0) {
      return;
    }
    // calc scale and translate
    const scaleX = (fullWidth - (graphConfig.margin.right + graphConfig.margin.left)) / width;
    const scaleY = (fullHeight - (graphConfig.margin.top + graphConfig.margin.bottom)) / height;
    let scale = Math.min(scaleX, scaleY);
    if ((graphConfig as NodeGraphInterface).zoom) {
      scale = scale < (graphConfig as NodeGraphInterface).zoom.minZoom ? (graphConfig as NodeGraphInterface).zoom.minZoom :
        (scale > (graphConfig as NodeGraphInterface).zoom.maxZoom ? (graphConfig as NodeGraphInterface).zoom.maxZoom : scale);
    }
    const translate = [(fullWidth / 2) - (scale * midX), (fullHeight / 2) - (scale * midY)];

    return {scale, translate};
  }

  protected fitGraph(graphContainer: ElementRef, graphConfig: GraphConfigurationInterface, animationDuration: number,
                     boundsDimension?: {x: number, y: number, width: number, height: number}) {
    // get graph container
    const container = d3.select(graphContainer.nativeElement).select('#main-g');
    // calc translate and scale
    const scaleAndTranslate = this.calculateTranslateAndScale(graphContainer, container, graphConfig, boundsDimension);
    // fit graph
    if (scaleAndTranslate) {
      container
        .transition()
        .duration(animationDuration)
        .attr('transform', 'translate(' + scaleAndTranslate.translate + ')scale(' + scaleAndTranslate.scale + ')');
    }
  }

  protected initListeners(elementRef: ElementRef, graphConfig: GraphConfigurationInterface) {
    // listen on window resize event
    this.windowResize = this.renderer.listen('window', 'resize', () => {
      if (this.graphDataArranged && this.graphDataArranged.length > 0) {
        // scale to fit container
        this.reloadGraph(elementRef, graphConfig);
      }
    });
  }

  protected removeListeners() {
    // remove window resize listener
    this.windowResize();
  }

  protected showTooltip(event, container, graphConfig: GraphConfigurationInterface, data) {
    // get mouse position (relative to the container element)
    const mousePosition = d3.pointer(event, container.node());
    // remove previous tooltips
    this.hideTooltip(container);
    // create tooltip container
    const tooltipContainer = container
      .append('g')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0);
    // fill with text
    const tooltipText = tooltipContainer
      .append('text')
      .style('font-size', '0.8rem')
      .style('font-weight', '500')
      .attr('fill', 'rgba(255, 255, 255, 0.87)')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'text-before-edge')
      .text(graphConfig.tooltipFormat(data.label, data.value));
    // create text container
    const tooltipTextNode = tooltipText.node().getBBox();
    const tooltipHeight = tooltipTextNode.height + 16;
    const tooltipWidth = tooltipTextNode.width + 20;
    tooltipContainer
      .insert('rect', 'text')
      .attr('width', tooltipWidth) // 20 it's for padding
      .attr('height', tooltipHeight) // 16 it's for padding
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'rgb(97, 97, 97)');
    // center text (the text is below the upper edge of the rectangle and middle anchored to the left upper edge)
    tooltipText
      // 8 it's the result of (rectHeight - textHeight) / 2
      .attr('transform', 'translate(' + (tooltipWidth / 2) + ',' + 8 + ')');
    // show tooltip
    const positionY = (mousePosition[1] - tooltipHeight - 15) < 0 ? (mousePosition[1] + 15) : (mousePosition[1] - tooltipHeight - 15);
    const positionX = (mousePosition[0] + tooltipWidth) > this.graphWidth ? (mousePosition[0] - tooltipWidth) : mousePosition[0];
    tooltipContainer
      .attr('transform', 'translate(' + positionX + ',' +
        positionY + ')')
      .transition()
      .duration(200)
      .style('opacity', 0.9);
  }

  protected hideTooltip(container) {
    // hide tooltip
    const tooltipContainer = container.selectAll(' .d3-tooltip')
      .transition()
      .duration(500)
      .style('opacity', 0);
    // remove tooltip
    tooltipContainer.remove();
  }

  protected addZoom(mainG, graphContainer: ElementRef, graphCfg: NodeGraphInterface) {
    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    const zoomListener = d3.zoom().scaleExtent([graphCfg.zoom.minZoom, graphCfg.zoom.maxZoom]).on('zoom', event => {
      mainG
        .attr('transform', event.transform);
    });
    // attach zoom feature to svg element
    d3.select(graphContainer.nativeElement).select('svg').call(zoomListener);
    // init zoom to current position
    this.initZoomToCurrentPosition(graphContainer, graphCfg, zoomListener, 0);
    return zoomListener;
  }

  protected initZoomToCurrentPosition(graphContainer: ElementRef, graphCfg: GraphConfigurationInterface, zoomListener,
                                      animationDuration: number, boundsDimension?: {x: number, y: number, width: number, height: number}) {
    // init zoom start point to current position
    // calc current translate and scale
    const scaleAndTranslate = this.calculateTranslateAndScale(graphContainer,
      d3.select(graphContainer.nativeElement).select('#main-g'), graphCfg, boundsDimension);
    if (scaleAndTranslate) {
      // create transform object
      const transform = d3.zoomIdentity
        .translate(scaleAndTranslate.translate[0], scaleAndTranslate.translate[1])
        .scale(scaleAndTranslate.scale);
      // call zoom
      d3.select(graphContainer.nativeElement).select('svg')
        .transition()
        .duration(animationDuration)
        .call(zoomListener.transform, transform);
    }
  }

  protected wrapLongText(textElement, width: number) {
    // loop get text element
    const textNode = d3.select(textElement);
    // get text
    const text = textNode.text();
    // split text by space and get words
    const words = text.split(/\s+/).reverse();
    let word;
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.1; // ems
    // get text node properties
    const y = textNode.attr('y');
    const dy = parseFloat(textNode.attr('dy'));
    // create a tspan (tspan is for line element)
    let tspan = textNode.text(null).append('tspan')
      .attr('x', 0)
      .attr('y', y)
      .attr('dy', dy + 'em');
    // loop over words
    while (words.length > 0) {
      // get current word
      word = words.pop();
      // push word in current line
      line.push(word);
      // set tspan text joining whit space the words in current line
      tspan.text(line.join(' '));
      // check if current line width is grater than the input width
      if ((width && tspan.node().getComputedTextLength() > width) || word.startsWith('%nl%')) {
        if (word.startsWith('%nl%')) {
          word = word.replace('%nl%', '');
        }
        // remove last word
        line.pop();
        // set again tspan text
        tspan.text(line.join(' '));
        // init new line
        line = [word];
        // add new span
        tspan = textNode.append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', `${++lineNumber * lineHeight + dy}em`)
          .text(word);
      }
    }
  }

  protected calcVerticalLegendPosition(legendElements, legendElementPadding: {top: number, right: number}, legendX: 'right' | 'left') {
    // save the sum of the width of the elements before current one
    let yPosition = 0;
    let currentColumnIndex = 0;
    let xPositionOffset = 0;
    let maxElementWidth = 0;
    legendElements
      .attr('transform', (d, i, elements) => {
        // if legend elements are too much, the legend can be outside the graph
        // increase column index and set to zero yPosition when the element height + yPosition
        // is grater than the graphHeight
        const elementHeight = elements[i].getBBox().height + legendElementPadding.top;
        if (yPosition + elementHeight >= this.graphHeight) {
          currentColumnIndex++;
          yPosition = 0;
          xPositionOffset += maxElementWidth;
          // when change column reset the max width
          maxElementWidth = 0;
        }
        const xPosition = (legendX === 'right' ? legendElementPadding.right : 0) + xPositionOffset;
        const translate = 'translate(' + xPosition + ',' + yPosition + ')'
        yPosition += elementHeight;
        // get the max width
        maxElementWidth = Math.max(elements[i].getBBox().width + legendElementPadding.top, maxElementWidth);
        return translate;
      });
  }
  protected calcHorizontalLegendPosition(legendElements, legendElementPadding: {top: number, right: number}, legendY: 'top' | 'bottom',
                                         legendElementDim: number) {
    // save the sum of the width of the elements before current one
    let xPosition = 0;
    let currentRowIndex = 0;
    legendElements
      .attr('transform', (d, i, elements) => {
        // if legend elements are too much, the legend can be outside the graph
        // increase row index and set to zero xPosition when the element width + xPosition
        // is grater than the graphWidth
        const elementWidth = elements[i].getBBox().width + legendElementPadding.top
        if (xPosition + elementWidth >= this.graphWidth) {
          currentRowIndex++;
          xPosition = 0;
        }
        const yPosition = (legendY === 'bottom' ? legendElementPadding.top : 0) +
          ((legendElementDim + legendElementPadding.top) * currentRowIndex);
        const translate = 'translate(' + xPosition + ',' + yPosition + ')';
        xPosition += elementWidth;
        return translate;
      });
  }
}
