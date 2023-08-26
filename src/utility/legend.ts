import { GraphTypes } from '../types/graphTypes';
import { Group, InternalGraphCongifuration } from '../types/graphConfiguration';
import { formatNumber } from './common';

export class LegendUtility<TModel extends GraphTypes> {

  private calcVerticalLegendPosition(
    legendElements: any,
    legendElementPadding: { top: number; right: number },
    height: number
  ) {
    // save the sum of the width of the elements before current one
    let yPosition = 0;
    let xPositionOffset = 0;
    let maxElementWidth = 0;
    legendElements.attr('transform', (_: any, i: number, elements: any) => {
      // if legend elements are too much, the legend can be outside the graph
      // increase column index and set to zero yPosition when the element height + yPosition
      // is grater than the graphHeight
      const elementHeight = ++elements[i].getBBox().height + legendElementPadding.top;
      if (yPosition + elementHeight >= height) {
        yPosition = 0;
        xPositionOffset += maxElementWidth;
        // when change column reset the max width
        maxElementWidth = 0;
      }
      const xPosition = xPositionOffset;
      const translate = `translate(${formatNumber(xPosition)}, ${formatNumber(yPosition)})`;
      yPosition += elementHeight;
      // get the max width
      maxElementWidth = Math.max(
        ++elements[i].getBBox().width + legendElementPadding.top,
        maxElementWidth
      );
      return translate;
    });
  }
  
  private calcHorizontalLegendPosition(
    legendElements: any,
    legendElementPadding: { top: number; right: number },
    legendElementDim: number,
    width: number
  ) {
    // save the sum of the width of the elements before current one
    let xPosition = 0;
    let currentRowIndex = 0;
    legendElements.attr('transform', (_: any, i: number, elements: any) => {
      // if legend elements are too much, the legend can be outside the graph
      // increase row index and set to zero xPosition when the element width + xPosition
      // is grater than the graphWidth
      const elementWidth = ++elements[i].getBBox().width + legendElementPadding.right;
      if (xPosition + elementWidth >= width) {
        currentRowIndex++;
        xPosition = 0;
      }
      const yPosition = (legendElementDim + legendElementPadding.top) * currentRowIndex;
      const translate = `translate(${formatNumber(xPosition)}, ${formatNumber(yPosition)})`;
      xPosition += elementWidth;
      return translate;
    });
  }
  
  createLegend(
    g: any,
    conf: InternalGraphCongifuration<TModel>,
    width: number,
    height: number
  ): number {
    const legendPosition: 'left-right' | 'up-bottom' =
      conf.legend.position === 'right' || conf.legend.position === 'left'
        ? 'left-right'
        : 'up-bottom';
  
    if (conf.legend.enabled) {
      const legendPadding = 10;
      const legendElementDim = 15;
      const legendElementPadding = { top: 15, right: 10 };
      // create legend container
      const legendContainer = g.append('g').attr('class', 'legend-container');
      // add rect and text for each group
      const legendElements = legendContainer.selectAll('g').data(conf.groups).enter().append('g');
      legendElements
        .append('rect')
        .attr('width', legendElementDim)
        .attr('height', legendElementDim)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', (d: Group) => d.color);
      legendElements
        .append('text')
        .attr('x', legendElementDim + legendElementPadding.right)
        .style('dominant-baseline', 'text-before-edge')
        .text((d: Group) => d.label);
      if (legendPosition === 'left-right') {
        // translate elements
        calcVerticalLegendPosition(legendElements, legendElementPadding, height);
        // calc legend dimension
        const legendDimension = ++legendContainer.node().getBBox().width + 2 * legendPadding;
        // translate container
        const xOffset = conf.legend.position === 'left' ? 0 : width - legendDimension;
        legendContainer.attr('transform', `translate(${formatNumber(xOffset)}, 0)`);
        return legendDimension;
      }
      // translate elements
      calcHorizontalLegendPosition(legendElements, legendElementPadding, legendElementDim, width);
      // calc legend dimension
      const legendDimension = ++legendContainer.node().getBBox().height + 2 * legendPadding;
      // translate container
      const xOffset = (width - legendContainer.node().getBBox().width) / 2;
      const yOffset = conf.legend.position === 'top' ? 0 : height - legendDimension;
      legendContainer.attr('transform', `translate(${formatNumber(xOffset)}, ${formatNumber(yOffset)})`);
      return legendDimension;
    }
    return 0;
  }
  
  updateLegend(
    g: any,
    conf: InternalGraphCongifuration<TModel>,
    width: number,
    height: number,
    legendDimension: number
  ) {
    const legendPosition: 'left-right' | 'up-bottom' =
      conf.legend.position === 'right' || conf.legend.position === 'left'
        ? 'left-right'
        : 'up-bottom';
    if (conf.legend.enabled) {
      // get legend container
      const legendContainer = g.select('.legend-container');
      if (legendPosition === 'left-right') {
        // translate container
        const xOffset = conf.legend.position === 'left' ? 0 : width - legendDimension;
        legendContainer.attr('transform', `translate(${formatNumber(xOffset)}, 0)`);
        return;
      }
      // translate container
      const xOffset = (width - legendContainer.node().getBBox().width) / 2;
      const yOffset = conf.legend.position === 'top' ? 0 : height - legendDimension;
      legendContainer.attr('transform', `translate(${formatNumber(xOffset)}, ${formatNumber(yOffset)})`);
    }
  }
}

