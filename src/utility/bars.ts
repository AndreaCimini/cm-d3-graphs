import { BarDataValue, BarsData } from '../types/bars';
import { GElement, Scale } from '../types/d3Types';
import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { InternalGraphData } from '../types/graphData';
import { evalThreeConditions, evalTwoConditions, formatNumber } from './common';

export class BarsUtility {
  private conf: InternalGraphCongifuration<'histogram'>;
  private data: Array<InternalGraphData<'histogram'>>;
  private gElem: GElement;
  private bars!: d3.Selection<
    SVGRectElement,
    {
      id: string;
      index: number;
      label: string;
      value: number;
      offsetX: number;
      offsetY: number;
    },
    SVGGElement,
    BarsData
  >;

  constructor(
    conf: InternalGraphCongifuration<'histogram'>,
    data: Array<InternalGraphData<'histogram'>>,
    g: GElement
  ) {
    this.conf = conf;
    this.data = data;
    this.gElem = g;
  }

  private computeBarsData(): Array<BarsData> {
    const barsData = [];
    // loop over input data
    for (const d of this.data) {
      // copy input data, but remove values
      const newData: BarsData = { ...d, values: [] };
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
          offsetY: v >= 0 ? offsetYPositive : offsetYNegative,
        });
        // increase offset
        if (this.conf.groupedType === 'stacked') {
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

  createBarsGroup(
    groupClass: string,
    data: Array<BarsData>,
    axes: { bottomScale: Scale; leftScale: Scale },
    subBarClass: string
  ): d3.Selection<
    SVGRectElement,
    { id: string; index: number; label: string; value: number; offsetX: number; offsetY: number },
    SVGGElement,
    BarsData
  > {
    const { bottomScale, leftScale } = axes;
    // append the bar rectangles to the container element
    return (
      this.gElem
        .selectAll('.' + groupClass)
        .data(data)
        .enter()
        // for each group append an g
        .append('g')
        .attr('id', (d: BarsData) => d.id)
        .attr('class', groupClass)
        .attr('transform', (d: BarsData) => {
          const scale = (
            this.conf.orientation === 'horizontal' ? leftScale : bottomScale
          ) as d3.ScaleBand<string | number>;
          if (this.conf.orientation === 'horizontal') {
            return `translate(0,${formatNumber(scale(d.label) as number)})`;
          }
          return `translate(${formatNumber(scale(d.label) as number)},0)`;
        })
        .selectAll('.' + subBarClass)
        .data((d: BarsData) =>
          d.values.map((v: BarDataValue, i: number) => ({
            ...v,
            id: `${subBarClass}_${d.id}_ ${i}`,
          }))
        )
        .enter()
        .append('rect')
        .attr('class', subBarClass)
        .attr('id', (d: BarDataValue & { id: string }) => d.id)
        .attr('fill', (_: BarDataValue & { id: string }, i: number) => this.conf.groups[i].color)
    );
  }

  private animateBarsVertical(leftScale: Scale, duration: number, subBarClass: string) {
    (
      this.gElem.selectAll(`.${subBarClass}`) as d3.Selection<
        SVGRectElement,
        {
          id: string;
          index: number;
          label: string;
          value: number;
          offsetX: number;
          offsetY: number;
        },
        SVGGElement,
        BarsData
      >
    )
      .transition()
      .duration(duration)
      .attr('height', (d: BarDataValue) => {
        const scale = leftScale as d3.ScaleLinear<number, number>;
        return formatNumber(Math.abs(scale(0) - scale(d.value)));
      })
      .attr('y', (d: BarDataValue) => {
        if (this.conf.axis.invertAxisY) {
          return formatNumber(
            d.value >= 0
              ? (leftScale(d.offsetY) as number)
              : (leftScale(d.offsetY + d.value) as number)
          );
        }
        return formatNumber(
          d.value >= 0
            ? (leftScale(d.offsetY + d.value) as number)
            : (leftScale(d.offsetY) as number)
        );
      })
      // TODO: transition management
      .on('end', () => {
        // this.doingTransition = false;
      });
  }

  private animateBarsHorizontal(bottomScale: Scale, duration: number, subBarClass: string) {
    (
      this.gElem.selectAll(`.${subBarClass}`) as d3.Selection<
        SVGRectElement,
        {
          id: string;
          index: number;
          label: string;
          value: number;
          offsetX: number;
          offsetY: number;
        },
        SVGGElement,
        BarsData
      >
    )
      .transition()
      .duration(duration)
      .attr('width', (d: BarDataValue) =>
        formatNumber(Math.abs((bottomScale(0) as number) - (bottomScale(d.value) as number)))
      )
      .attr('x', (d: BarDataValue) => {
        if (this.conf.axis.invertAxisX) {
          return formatNumber(
            d.value >= 0
              ? (bottomScale(d.offsetX + d.value) as number)
              : (bottomScale(d.offsetX) as number)
          );
        }
        return formatNumber(
          d.value >= 0
            ? (bottomScale(d.offsetX) as number)
            : (bottomScale(d.offsetX + d.value) as number)
        );
      })
      // TODO: transition management
      .on('end', () => {
        // this.doingTransition = false;
      });
  }

  createBars(
    axes: { bottomScale: Scale; leftScale: Scale; groupedScale: Scale },
    groupClass: string,
    subBarClass: string,
    duration: number
  ) {
    const { bottomScale, leftScale, groupedScale } = axes;
    // adjust data
    const barsData = this.computeBarsData();
    // call utility function to create bars
    this.bars = this.createBarsGroup(groupClass, barsData, axes, subBarClass);
    this.bars
      .attr('x', (d: BarDataValue) =>
        this.conf.orientation === 'vertical'
          ? formatNumber(groupedScale(d.index) as number)
          : formatNumber(bottomScale(d.offsetX) as number)
      )
      .attr('y', (d: BarDataValue) =>
        this.conf.orientation === 'vertical'
          ? formatNumber(leftScale(d.offsetY) as number)
          : formatNumber(groupedScale(d.index) as number)
      )
      .attr(
        'width',
        this.conf.orientation === 'vertical'
          ? formatNumber((groupedScale as d3.ScaleBand<number | string>).bandwidth())
          : 0
      )
      .attr(
        'height',
        this.conf.orientation === 'vertical'
          ? 0
          : formatNumber((groupedScale as d3.ScaleBand<number | string>).bandwidth())
      )
      .style('cursor', this.conf.events.clickOnElement ? 'pointer' : '');
    // TODO: tooltip management
    /*
      .on('mouseenter', (e, d) => {
        // get all bar nodes
        const barNodes = g.selectAll('.mainBars').nodes();
        if (!this.doingTransition) {
          for (const node of barNodes) {
            if (node['id'] !== d.id) {
              // tslint:disable-line
              g.select(node).style('opacity', 0.3);
            }
          }
          // show tooltip
          this.showTooltip(e, g, this.graphConfigs, d);
        }
      })
      .on('mouseout', (event) => {
        // get all group nodes
        const barNodes = d3.select(this.histogramChart.nativeElement).selectAll('.mainBars').nodes();
        if (
          !this.doingTransition &&
          (!(event.toElement as HTMLElement) ||
            (event.toElement as HTMLElement).className !== 'd3-tooltip')
        ) {
          for (const node of barNodes) {
            d3.select(node).style('opacity', 1);
          }
          // hide tooltip
          this.hideTooltip(g);
        }
      })
      // TODO: click management
      .on('click', (e, d) => {
        if (!this.doingTransition && this.graphConfigs.events.clickOnElement) {
          // send event
          this.clickOnBar.emit(d);
        }
      });
      */
    // set animation
    if (this.conf.orientation === 'vertical') {
      this.animateBarsVertical(leftScale, duration, subBarClass);
      return;
    }
    this.animateBarsHorizontal(bottomScale, duration, subBarClass);
  }

  private updateBarPositionAndDimension(axisData: {
    bottomAxisScale: Scale;
    leftAxisScale: Scale;
    groupedAxisScale: Scale;
  }) {
    const { bottomAxisScale, leftAxisScale, groupedAxisScale } = axisData;
    this.bars
      .attr('x', (d: BarDataValue) =>
        evalThreeConditions(
          this.conf.orientation,
          'horizontal',
          this.conf.axis.invertAxisX,
          formatNumber(bottomAxisScale(d.value >= 0 ? d.offsetX + d.value : d.offsetX) as number),
          formatNumber(bottomAxisScale(d.value >= 0 ? d.offsetX : d.offsetX + d.value) as number),
          formatNumber(groupedAxisScale(d.index) as number)
        )
      )
      .attr('y', (d: BarDataValue) =>
        evalThreeConditions(
          this.conf.orientation,
          'vertical',
          this.conf.axis.invertAxisY,
          formatNumber(leftAxisScale(d.value >= 0 ? d.offsetY : d.value + d.offsetY) as number),
          formatNumber(leftAxisScale(d.value >= 0 ? d.value + d.offsetY : d.offsetY) as number),
          formatNumber(groupedAxisScale(d.index) as number)
        )
      )
      .attr('width', (d: BarDataValue) =>
        evalTwoConditions(
          this.conf.orientation,
          'vertical',
          formatNumber((groupedAxisScale as d3.ScaleBand<string | number>).bandwidth()),
          formatNumber(
            Math.abs((bottomAxisScale(0) as number) - (bottomAxisScale(d.value) as number))
          )
        )
      )
      .attr('height', (d: BarDataValue) =>
        evalTwoConditions(
          this.conf.orientation,
          'vertical',
          formatNumber(Math.abs((leftAxisScale(0) as number) - (leftAxisScale(d.value) as number))),
          formatNumber((groupedAxisScale as d3.ScaleBand<string | number>).bandwidth())
        )
      );
  }

  updateBarsOnScroll(axisData: {
    bottomAxisScale: Scale;
    leftAxisScale: Scale;
    groupedAxisScale: Scale;
  }) {
    // adjust data
    const barsData = this.computeBarsData();
    // update bars
    this.bars = (
      this.gElem
        .selectAll('.group-bars')
        .data(barsData)
        .attr('id', (d: BarsData) => d.id)
        .attr('transform', (d: BarsData) => {
          const scale = (
            this.conf.orientation === 'horizontal'
              ? axisData.leftAxisScale
              : axisData.bottomAxisScale
          ) as d3.ScaleBand<string | number>;
          if (this.conf.orientation === 'horizontal') {
            return `translate(0,${formatNumber(scale(d.label) as number)})`;
          }
          return `translate(${formatNumber(scale(d.label) as number)},0)`;
        })
        .selectAll('.main-bars') as d3.Selection<
        SVGRectElement,
        {
          id: string;
          index: number;
          label: string;
          value: number;
          offsetX: number;
          offsetY: number;
        },
        SVGGElement,
        BarsData
      >
    ).data((d: BarsData) =>
      d.values.map((v: BarDataValue, i: number) => ({ ...v, id: `main-bars_${d.id}_ ${i}` }))
    );
    this.updateBarPositionAndDimension(axisData);
  }

  updateBarsOnResize(
    axesData: {
      bottomAxisScale: Scale;
      leftAxisScale: Scale;
      groupedAxisScale: Scale;
    },
    groupClass: string,
    subBarClass: string
  ) {
    const { bottomAxisScale, leftAxisScale } = axesData;
    const groupBars: d3.Selection<SVGGElement, BarsData, SVGGElement, unknown> =
      this.gElem.selectAll(`.${groupClass}`);
    // update bars
    this.bars = groupBars
      .attr('transform', (d: BarsData) => {
        const scale = (
          this.conf.orientation === 'horizontal' ? leftAxisScale : bottomAxisScale
        ) as d3.ScaleBand<string | number>;
        if (this.conf.orientation === 'horizontal') {
          return `translate(0, ${formatNumber(scale(d.label) as number)})`;
        }
        return `translate(${formatNumber(scale(d.label) as number)},0)`;
      })
      .selectAll(`.${subBarClass}`);
    this.updateBarPositionAndDimension(axesData);
  }
}
