import * as d3 from 'd3';

import { Axis, GElement, Scale } from '../types/d3Types';
import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { formatNumber } from './common';

export function createScaleBandAxis(
  range: [number, number],
  padding: number,
  domain: Array<string | number>
): d3.ScaleBand<string | number> {
  // split the range into n bands and compute the positions and widths of the bands taking into account any specified padding
  return d3.scaleBand<string | number>().rangeRound(range).paddingInner(padding).domain(domain);
}

export function createScaleLinearAxis(range: [number, number], domain: Array<number>): d3.ScaleLinear<number, number> {
  // create scale that use a linear function (y = m * x + b) to interpolate across the domain and range.
  return d3.scaleLinear().range(range).domain(domain);
}

export function addBottomAxis<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  g: GElement,
  scale: Scale
): Axis {
  const bottomAxis = d3.axisBottom(scale as d3.AxisScale<string | number>);
  // TODO: manage tick format and values
  /*
  if (conf.axis.tickFormatX) {
    bottomAxis.tickFormat(conf.axis.tickFormatX);
  }
  */
  /*
  if (axes.tickValuesX) {
    bottomAxis.tickValues(axes.tickValuesX);
  }
  */
  const axis = g.append('g').attr('class', 'bottom-axis').call(bottomAxis);

  // change axis color
  axis.select('path').attr('stroke', conf.axis.lineColor);
  axis.selectAll('line').attr('stroke', conf.axis.lineColor);
  axis.selectAll('text').attr('fill', conf.axis.textColor);

  // TODO: manage tick visualization
  /*
  this.manageAxisTicks(
    graphContainer,
    'vertical',
    graphConfigs.axis.labelXOrientation,
    graphConfigs.axis.labelYOrientation,
    graphData
  );
  */

  return bottomAxis as Axis;
}

export function addLeftAxis<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  g: GElement,
  scale: Scale
): Axis {
  const leftAxis = d3.axisLeft(scale as d3.AxisScale<string | number>);
  // TODO: manage tick format and values
  /*
      if (conf.axis.tickFormatY) {
        leftAxis.tickFormat(conf.axis.tickFormatY);
      }
      */
  /*
      if (axes.tickValuesY) {
        leftAxis.tickValues(axes.tickValuesY);
      }
      */
  const axis = g.append('g').attr('class', 'left-axis').call(leftAxis);

  // change axis color
  axis.select('path').attr('stroke', conf.axis.lineColor);
  axis.selectAll('line').attr('stroke', conf.axis.lineColor);
  axis.selectAll('text').attr('fill', conf.axis.textColor);

  // TODO: manage tick visualization
  /*
      this.manageAxisTicks(graphContainer, 'horizontal', graphConfigs.axis.labelXOrientation,
        graphConfigs.axis.labelYOrientation, graphData);
    */

  return leftAxis as Axis;
}

export function scaleAxes<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  g: GElement,
  height: number,
  width: number,
  axesData: {
    bottomScale: Scale;
    leftScale: Scale;
    leftAxis?: Axis;
    bottomAxis?: Axis;
  }
) {
  const { bottomScale, leftScale, bottomAxis, leftAxis } = axesData;
  // get html axis elemet
  const leftAxisHtml: GElement = g.select('.left-axis');
  const bottomAxisHtml: GElement = g.select('.bottom-axis');
  if (conf.axis.showAxisX && conf.axis.showAxisY && bottomAxis && leftAxis) {
    const axisBottomHeight = (bottomAxisHtml.node() as Element).getBoundingClientRect().height;
    const axisLeftWidth = (leftAxisHtml.node() as Element).getBoundingClientRect().width;
    // apply new range
    bottomScale.range([axisLeftWidth, width]);
    leftScale.range([0, height - axisBottomHeight]);
    // update range and translate axis to right position
    bottomAxisHtml.call(bottomAxis).attr('transform', `translate(0, ${formatNumber(height - axisBottomHeight)})`);
    leftAxisHtml.call(leftAxis).attr('transform', `translate(${formatNumber(axisLeftWidth)}, 0)`);

    return { bottomScale, leftScale };
  }

  if (conf.axis.showAxisX && bottomAxis) {
    const axisBottomHeight = (bottomAxisHtml.node() as Element).getBoundingClientRect().height;
    // apply new range
    leftScale.range([0, height - axisBottomHeight]);
    // translate axis to right position
    bottomAxisHtml.call(bottomAxis).attr('transform', `translate(0, ${formatNumber(height - axisBottomHeight)})`);
    return { bottomScale, leftScale };
  }

  if (conf.axis.showAxisY && leftAxis) {
    const axisLeftWidth = (leftAxisHtml.node() as Element).getBoundingClientRect().width;
    // apply new range
    bottomScale.range([axisLeftWidth, width]);
    // translate axis to right position
    leftAxisHtml.call(leftAxis).attr('transform', `translate(${formatNumber(axisLeftWidth)}, 0)`);
  }

  return { bottomScale, leftScale };
}

export function updateLeftAxisDomain(
  g: GElement,
  domain: Array<string | number>,
  leftScale: Scale,
  leftAxis?: Axis
) {
  // get html axis elemet
  const leftAxisHtml: GElement = g.select('.left-axis');
  // update axis domain
  leftScale.domain(domain);
  // update axis
  if (leftAxisHtml && leftAxis) {
    leftAxisHtml.call(leftAxis);
  }
  return leftScale;
}

export function updateBottomAxisDomain(
  g: GElement,
  domain: Array<string | number>,
  bottomScale: Scale,
  bottomAxis?: Axis
) {
  // get html axis elemet
  const bottomAxisHtml: GElement = g.select('.bottom-axis');
  // update axis domain
  bottomScale.domain(domain);
  // update axis
  if (bottomAxisHtml && bottomAxis) {
    bottomAxisHtml.call(bottomAxis);
  }
  return bottomScale;
}