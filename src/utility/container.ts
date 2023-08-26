import * as d3 from 'd3';

import { GraphTypes } from '../types/graphTypes';
import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { GElement } from '../types/d3Types';

export class ContainerUtility<TModel extends GraphTypes> {
  /**
   * html Element that containts the graph
   */
  private htmlElement: HTMLElement;
  /**
   * graph configurations
   */
  private conf: InternalGraphCongifuration<TModel>;
  /**
   * the main g that containts the graph
   */
  private gElem!: GElement;
  /**
   * the total width available
   */
  private width!: number;
  /**
   * the total height available
   */
  private height!: number;
  /**
   * the total width available for the graph without legend
   */
  private graphWidth!: number;
  /**
   * the total height available for the graph without legend
   */
  private graphHeight!: number;

  constructor(htmlElement: HTMLElement, conf: InternalGraphCongifuration<TModel>) {
    this.htmlElement = htmlElement;
    this.conf = conf;
  }

  /**
   * Returns the g element that contains the graph
   * @returns {GElement} gElem
   */
  getG(): GElement {
    return this.gElem;
  }

  /**
   * Returns the total width available
   * @returns {number} width
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Returns the total height available
   * @returns {number} height
   */
  getHeight(): number {
    return this.height;
  }

  /**
   * Returns the total width available for the graph without legend
   * @returns {number} graphWidth
   */
  getGraphWidth(): number {
    return this.graphWidth;
  }

  /**
   * Returns the total height available for the graph without legend
   * @returns {number} graphHeight
   */
  getGraphHeight(): number {
    return this.graphHeight;
  }

  /**
   * Create the svg and the main g element that contains the graph
   */
  createContainer() {
    // get container dimensions
    this.width = this.htmlElement.clientWidth;
    this.height = this.htmlElement.clientHeight;
    const svg = d3
      .select(this.htmlElement)
      .append('svg') // create the SVG element inside the container
      .attr('width', this.width) // set the width
      .attr('height', this.height) // set the height
      .attr('id', `${this.conf.id}`);

    this.gElem = svg
      .append('g') // make a group to hold chart
      .attr('id', 'main-g')
      .attr(
        'transform',
        `translate(${this.conf.margin.left}, ${this.conf.margin.top})`
      ) as unknown as GElement;
  }

  /**
   * Calc graph dimensions based on scroll and legend
   * @param scrollDimension the dimension of the scrollbar
   * @param numberOfData the number of data
   * @param legendDimension the dimension of the legend
   */
  calcGraphDimensions(scrollDimension: number, numberOfData: number, legendDimension: number) {
    // get container dimensions
    this.graphWidth = this.width - (this.conf.margin.left + this.conf.margin.right);
    this.graphHeight = this.height - (this.conf.margin.top + this.conf.margin.bottom);

    const scrollableConf: InternalGraphCongifuration<Extract<TModel, 'histogram' | 'line'>> =
      this.conf;
    const legendConf: InternalGraphCongifuration<Extract<TModel, 'histogram' | 'line' | 'pie'>> =
      this.conf;

    if (
      scrollableConf.maxDisplayedNumber &&
      numberOfData > scrollableConf.maxDisplayedNumber &&
      scrollableConf.orientation === 'vertical'
    ) {
      this.graphHeight -= scrollDimension;
    }

    if (
      scrollableConf.maxDisplayedNumber &&
      numberOfData > scrollableConf.maxDisplayedNumber &&
      scrollableConf.orientation === 'horizontal'
    ) {
      this.graphWidth -= scrollDimension;
    }

    if (
      legendConf.legend.enabled &&
      (legendConf.legend.position === 'right' || legendConf.legend.position === 'left')
    ) {
      this.graphWidth -= legendDimension;
    }

    if (
      legendConf.legend.enabled &&
      (legendConf.legend.position === 'top' || legendConf.legend.position === 'bottom')
    ) {
      this.graphHeight -= legendDimension;
    }
  }

  /**
   * Create the g that contains the graph without legend
   * @param legendDimension the dimension of the legend
   */
  createGraphContainer(legendDimension: number) {
    let xOffset = 0;
    let yOffset = 0;

    const legendConf: InternalGraphCongifuration<Extract<TModel, 'histogram' | 'line' | 'pie'>> =
      this.conf;

    if (legendConf.legend.position === 'left') {
      xOffset = legendDimension;
    }
    if (legendConf.legend.position === 'top') {
      yOffset = legendDimension;
    }
    this.gElem = this.gElem
      .append('g')
      .attr('class', 'graph-container')
      .attr('transform', `translate(${xOffset}, ${yOffset})`);
  }

  /**
   * Update the svg dimensions
   */
  updateContainer() {
    // get new container dimensions
    this.width = this.htmlElement.clientWidth;
    this.height = this.htmlElement.clientHeight;
    const svg = d3
      .select(this.htmlElement)
      .select('svg')
      .attr('width', this.width) // set the width
      .attr('height', this.height); // set the height

    this.gElem = svg.select('#main-g') as unknown as GElement;
  }
}
