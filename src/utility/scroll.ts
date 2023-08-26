import * as d3 from 'd3';

import { GElement, Scale } from '../types/d3Types';
import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { InternalGraphData } from '../types/graphData';
import { BarsUtility } from './bars';
import { evalThreeConditions, evalTwoConditions } from './common';

function initDrag<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  data: Array<InternalGraphData<TModel>>,
  scrollContainer: GElement,
  width: number,
  height: number,
  scrollCbk: (dataIndex: number) => void
): d3.DragBehavior<SVGRectElement, unknown, unknown> {
  const displayed = d3
    .scaleQuantize()
    .domain(conf.orientation === 'vertical' ? [0, width] : [0, height])
    .range(d3.range(data.length).concat(data.length));

  return d3
    .drag<SVGRectElement, unknown>()
    .on('drag', (event: DragEvent & { dx: number; dy: number }) => {
      const rect = scrollContainer.select('.mover');
      const position = parseInt(
        evalTwoConditions(conf.orientation, 'vertical', rect.attr('x'), rect.attr('y')),
        10
      );
      const newPosition = Math.floor(
        position + evalTwoConditions(conf.orientation, 'vertical', event.dx, event.dy)
      );
      const length = parseInt(
        evalTwoConditions(conf.orientation, 'vertical', rect.attr('width'), rect.attr('height')),
        10
      );

      // if we move outside the scrollbar
      if (
        newPosition < 0 ||
        newPosition + length > evalTwoConditions(conf.orientation, 'vertical', width, height)
      ) {
        return;
      }
      // update position
      rect.attr(evalTwoConditions(conf.orientation, 'vertical', 'x', 'y'), newPosition);
      const f = displayed(position);
      const nf = displayed(newPosition);
      if (f === nf) {
        return;
      }

      // update graph
      let dataIndex: number;
      if (conf.orientation === 'vertical') {
        dataIndex = conf.axis.invertAxisX ? data.length - (nf + conf.maxDisplayedNumber) : nf;
        scrollCbk(dataIndex);
        return;
      }

      dataIndex = conf.axis.invertAxisY ? nf : data.length - (nf + conf.maxDisplayedNumber);
      scrollCbk(dataIndex);
    });
}

function createScrollCursor<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  data: Array<InternalGraphData<TModel>>,
  scrollContainer: GElement,
  scrollDimension: number,
  width: number,
  height: number,
  scrollCbk: (dataIndex: number) => void
) {
  // create scroll cursor
  scrollContainer
    .append('rect')
    .attr('class', 'mover')
    .attr('fill', 'lightSteelBlue')
    .attr('fill-opacity', 0.7)
    .attr(
      'x',
      evalThreeConditions(
        conf.orientation,
        'vertical',
        conf.axis.invertAxisX,
        width - (width * conf.maxDisplayedNumber) / data.length,
        0,
        0
      )
    )
    .attr(
      'y',
      evalThreeConditions(
        conf.orientation,
        'horizontal',
        conf.axis.invertAxisY,
        0,
        height - (height * conf.maxDisplayedNumber) / data.length,
        0
      )
    )
    .attr(
      'height',
      evalTwoConditions(
        conf.orientation,
        'vertical',
        scrollDimension,
        (height * conf.maxDisplayedNumber) / data.length
      )
    )
    .attr(
      'width',
      evalTwoConditions(
        conf.orientation,
        'vertical',
        (width * conf.maxDisplayedNumber) / data.length,
        scrollDimension
      )
    )
    .attr('cursor', conf.orientation === 'vertical' ? 'ew-resize' : 'ns-resize')
    .call(initDrag(conf, data, scrollContainer, width, height, scrollCbk));
}

export function createScroll<TModel extends 'histogram'>(
  g: GElement,
  conf: InternalGraphCongifuration<TModel>,
  data: Array<InternalGraphData<TModel>>,
  dimensionData: {
    scrollDimension: number;
    scrollPadding: number;
    width: number;
    height: number;
  },
  scrollCbk: (dataIndex: number) => void,
  createScrollAxes: () => {
    bottomAxisScale: Scale;
    leftAxisScale: Scale;
    groupedAxisScale: Scale;
  }
) {
  const hasScroll = data.length > conf.maxDisplayedNumber;
  const { width, height, scrollDimension, scrollPadding } = dimensionData;
  if (hasScroll) {
    // create scroll container
    const scrollContainer = g.append('g').attr('class', 'scroll-container');
    // translate container
    scrollContainer.attr(
      'transform',
      conf.orientation === 'vertical'
        ? `translate(0, ${height + scrollPadding})`
        : `translate(${width + scrollPadding}, 0)`
    );
    // create scroll axes
    const {
      bottomAxisScale: scrollBottomAxisScale,
      leftAxisScale: scrollLeftAxisScale,
      groupedAxisScale: scrollGroupedAxisScale,
    } = createScrollAxes();
    // add bars
    createBars(
      scrollContainer,
      {
        leftScale: scrollLeftAxisScale,
        bottomScale: scrollBottomAxisScale,
        groupedScale: scrollGroupedAxisScale,
      },
      conf,
      data,
      'sub-group-bars',
      'sub-bars',
      0
    );
    // create scroll cursor
    createScrollCursor(conf, data, scrollContainer, scrollDimension, width, height, scrollCbk);
  }
}

function updateScrollAxes<TModel extends 'histogram'>() {}

export function updateScrollOnResize<TModel extends 'histogram'>(
  g: GElement,
  conf: InternalGraphCongifuration<TModel>,
  dimensionData: {
    scrollPadding: number;
    width: number;
    height: number;
  },
  axesData: {
    bottomAxisScale: Scale;
    leftAxisScale: Scale;
    groupedAxisScale: Scale;
  }
) {
  const scrollContainer: GElement = g.select('.scroll-container');
  const { bottomAxisScale, leftAxisScale, groupedAxisScale } = axesData;
  const { width, height, scrollPadding } = dimensionData;
  if (scrollContainer.node()) {
    // translate container
    scrollContainer.attr(
      'transform',
      conf.orientation === 'vertical'
        ? `translate(0, ${height + scrollPadding})`
        : `translate(${width + scrollPadding}, 0)`
    );
    // update axes
    updateScrollAxes();
    // update bars
    updateBarsOnResize(scrollContainer, conf, axesData, 'sub-group-bars', 'sub-bars');
  }
}
