import * as d3 from 'd3';

import { Axis, GElement, Scale } from '../types/d3Types';
import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { formatNumber } from './common';

export function createGrid<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  g: GElement,
  bottomScale: Scale,
  leftScale: Scale,
  width: number,
  height: number
): {
  gridAxisHorizontal: Axis | undefined;
  gridAxisVertical: Axis | undefined;
} {
  const axisLeft = g.select('.left-axis');
  const axisBottom = g.select('.bottom-axis');
  let gridAxisVertical: Axis | undefined;
  let gridAxisHorizontal: Axis | undefined;
  // create grid
  if (conf.grid.axisY) {
    const axisLeftWidth = conf.axis.showAxisY ? (axisLeft.node() as Element).getBoundingClientRect().width : 0;

    gridAxisVertical = d3
      .axisLeft(leftScale as d3.AxisScale<string | number>)
      .tickFormat(() => '')
      .tickSize(axisLeftWidth - width) as Axis;

    // add grid
    const grid = g
      .append('g')
      .lower()
      .attr('class', 'h-grid')
      .attr('transform', `translate(${formatNumber(axisLeftWidth)}, 0)`)
      .call(gridAxisVertical)
      .call((g: GElement) => g.select('.domain').remove());

    grid.selectAll('line').attr('stroke', conf.grid.color);
  }
  if (conf.grid.axisX) {
    const axisBottomHeight = conf.axis.showAxisX
      ? (axisBottom.node() as Element).getBoundingClientRect().height
      : 0;

    gridAxisHorizontal = d3
      .axisBottom(bottomScale as d3.AxisScale<string | number>)
      .tickFormat(() => '')
      .tickSize(height - axisBottomHeight) as Axis;

    // add grid
    const grid = g
      .append('g')
      .lower()
      .attr('class', 'v-grid')
      .call(gridAxisHorizontal)
      .call((g: GElement) => g.select('.domain').remove());

    grid.selectAll('line').attr('stroke', conf.grid.color);
  }

  return { gridAxisHorizontal, gridAxisVertical };
}

export function updateGrid<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  g: GElement,
  width: number,
  height: number,
  gridAxisHorizontal: Axis | undefined,
  gridAxisVertical: Axis| undefined
) {
  const axisLeft = g.select('.left-axis');
  const axisBottom = g.select('.bottom-axis');
  // update grid
  if (conf.grid.axisY && gridAxisVertical) {
    const axisLeftWidth = conf.axis.showAxisY ? (axisLeft.node() as Element).getBoundingClientRect().width : 0;
    gridAxisVertical.tickSize(axisLeftWidth - width);
    const hGrid: GElement = g.select('.h-grid');
    hGrid
      .call(gridAxisVertical)
      .call((g: GElement) => g.select('.domain').remove());
  }
  if (conf.grid.axisX && gridAxisHorizontal) {
    const axisBottomHeight = conf.axis.showAxisX
      ? (axisBottom.node() as Element).getBoundingClientRect().height
      : 0;
    gridAxisHorizontal.tickSize(height - axisBottomHeight);
    const vGrid: GElement = g.select('.v-grid');
    vGrid
      .call(gridAxisHorizontal)
      .call((g: GElement) => g.select('.domain').remove());
  }
}
