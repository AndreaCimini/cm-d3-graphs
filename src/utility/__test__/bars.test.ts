import * as d3 from 'd3';

import { InternalGraphData } from '../../types/graphData';
import { InternalGraphCongifuration } from '../../types/graphConfiguration';
import { GElement, Scale } from '../../types/d3Types';
import {
  computeBarsData,
  createBars,
  createBarsGroup,
  updateBarsOnResize,
  updateBarsOnScroll,
} from '../bars';
import { createScaleBandAxis, createScaleLinearAxis } from '../axes';
import { formatNumber } from '../common';

describe('Test bars utility functions', () => {
  let conf = {} as InternalGraphCongifuration<'histogram'>;

  const data = [
    { id: '0', values: [-12, 34, -56], label: 'Label1' },
    { id: '1', values: [23, -5, 67], label: 'Label2' },
    { id: '2', values: [1, 7, 4], label: 'Label3' },
    { id: '3', values: [67, 31, -12], label: 'Label4' },
    { id: '4', values: [-43, -43, 9], label: 'Label5' },
    { id: '5', values: [-12, 15, -56], label: 'Label6' },
    { id: '6', values: [67, -5, 67], label: 'Label7' },
    { id: '7', values: [1, 7, 4], label: 'Label8' },
    { id: '8', values: [67, 81, -54], label: 'Label9' },
    { id: '9', values: [-4, -32, 9], label: 'Label10' },
  ] as Array<InternalGraphData<'histogram'>>;

  let scaleBand: Scale;
  let scaleLinear: Scale;
  let groupedScale: Scale;

  function testBarsData() {
    // compute bars data
    const barsData = computeBarsData(conf, data);
    // check that the data is parsed correctly
    expect(barsData).toHaveLength(data.length);
    barsData.forEach((d, i) => {
      expect(d.values).toHaveLength(data[i].values.length);
      d.values.forEach((v, j) => {
        expect(v.index).toStrictEqual(j);
        expect(v.label).toStrictEqual(data[i].label);
        expect(v.value).toStrictEqual(data[i].values[j]);
        // inline check
        if (conf.groupedType === 'inline') {
          expect(v.offsetX).toStrictEqual(0);
          expect(v.offsetY).toStrictEqual(0);
          return;
        }
        // stacked check
        if (v.value < 0) {
          expect(v.offsetX).toBeLessThanOrEqual(0);
          expect(v.offsetY).toBeLessThanOrEqual(0);
          return;
        }
        expect(v.offsetX).toBeGreaterThanOrEqual(0);
        expect(v.offsetY).toBeGreaterThanOrEqual(0);
      });
    });
  }

  function testCreateBarsGroup() {
    // select container
    const g: GElement = d3.select('#mocked-g');
    // compute bars data
    const barsData = computeBarsData(conf, data);
    // create bars group
    const subBars = createBarsGroup(
      g,
      'mocked-group',
      conf,
      barsData,
      {
        bottomScale: conf.orientation === 'vertical' ? scaleBand : scaleLinear,
        leftScale: conf.orientation === 'vertical' ? scaleLinear : scaleBand,
      },
      'mocked-sub-bar'
    );
    // check bars group size and attributes
    const barsGroup = d3.selectAll('.mocked-group');
    expect(barsGroup.size()).toStrictEqual(barsData.length);
    barsGroup.each(function (_: any, index: number) {
      const element = this as Element;
      const id = element.getAttribute('id');
      const transform = element.getAttribute('transform');
      expect(id).toStrictEqual(barsData[index].id);
      const scale = scaleBand as d3.ScaleBand<string | number>;
      if (conf.orientation === 'vertical') {
        expect(transform).toStrictEqual(
          `translate(${formatNumber(scale(barsData[index].label) as number)},0)`
        );
      } else {
        expect(transform).toStrictEqual(
          `translate(0,${formatNumber(scale(barsData[index].label) as number)})`
        );
      }
    });
    // check sub bars size and attributes
    expect(subBars.size()).toStrictEqual(3 * barsData.length);
    subBars.each(function (d: any, j: number) {
      const element = this as Element;
      const id = element.getAttribute('id');
      const fill = element.getAttribute('fill');
      expect(id).toStrictEqual(d.id);
      expect(fill).toStrictEqual(conf.groups[j].color);
    });
  }

  async function testBarsCreation(dataIndex?: number) {
    const g: GElement = d3.select('#mocked-g');
    createBars(
      g,
      {
        bottomScale: conf.orientation === 'vertical' ? scaleBand : scaleLinear,
        leftScale: conf.orientation === 'vertical' ? scaleLinear : scaleBand,
        groupedScale,
      },
      conf,
      dataIndex !== undefined ? data.slice(dataIndex, dataIndex + 5) : data,
      'mocked-group',
      'mocked-sub-bar',
      2000
    );
    const barsGroup = d3.selectAll('.group-bars');
    barsGroup.each(function () {
      const element = this as Element;
      const subBars = d3.select(element).selectAll('.main-bars');
      subBars.each(function (d: any) {
        const element = this as Element;
        const x = parseFloat(element.getAttribute('x')!);
        const y = parseFloat(element.getAttribute('y')!);
        const width = parseFloat(element.getAttribute('width')!);
        const height = parseFloat(element.getAttribute('height')!);
        if (conf.orientation === 'vertical') {
          expect(x).toStrictEqual(formatNumber(groupedScale(d.index) as number));
          expect(y).toStrictEqual(formatNumber(scaleLinear(d.offsetY) as number));
          expect(width).toStrictEqual(
            formatNumber((groupedScale as d3.ScaleBand<number | string>).bandwidth())
          );
          expect(height).toStrictEqual(0);
        } else {
          expect(x).toStrictEqual(formatNumber(scaleLinear(d.offsetX) as number));
          expect(y).toStrictEqual(formatNumber(groupedScale(d.index) as number));
          expect(width).toStrictEqual(0);
          expect(height).toStrictEqual(
            formatNumber((groupedScale as d3.ScaleBand<number | string>).bandwidth())
          );
        }
      });
    });
    // await dom changes
    await new Promise((r) => setTimeout(r, 3000));
  }

  function testSubBarsCreationVertical() {
    // select bars
    const subBars = d3.selectAll('.main-bars');
    // test bars attributes
    subBars.each(function (d: any) {
      const element = this as Element;
      const x = parseFloat(element.getAttribute('x')!);
      const y = parseFloat(element.getAttribute('y')!);
      const width = parseFloat(element.getAttribute('width')!);
      const height = parseFloat(element.getAttribute('height')!);
      expect(x).toStrictEqual(formatNumber(groupedScale(d.index) as number));
      if (conf.axis.invertAxisY) {
        expect(y).toStrictEqual(
          formatNumber(
            d.value >= 0
              ? scaleLinear(d.offsetY)!
              : scaleLinear((d.offsetY as number) + (d.value as number))!
          )
        );
      } else {
        expect(y).toStrictEqual(
          formatNumber(
            d.value >= 0
              ? scaleLinear((d.offsetY as number) + (d.value as number))!
              : scaleLinear(d.offsetY)!
          )
        );
      }
      expect(width).toStrictEqual(
        formatNumber((groupedScale as d3.ScaleBand<number | string>).bandwidth())
      );
      expect(height).toStrictEqual(
        formatNumber(
          Math.abs(
            (scaleLinear as d3.ScaleLinear<number, number>)(0) -
              (scaleLinear as d3.ScaleLinear<number, number>)(d.value)
          )
        )
      );
    });
  }

  function testSubBarsCreationHorizontal() {
    // select bars
    const subBars = d3.selectAll('.main-bars');
    // test bars attributes
    subBars.each(function (d: any) {
      const element = this as Element;
      const x = parseFloat(element.getAttribute('x')!);
      const y = parseFloat(element.getAttribute('y')!);
      const width = parseFloat(element.getAttribute('width')!);
      const height = parseFloat(element.getAttribute('height')!);
      expect(y).toStrictEqual(formatNumber(groupedScale(d.index) as number));
      if (conf.axis.invertAxisX) {
        expect(x).toStrictEqual(
          formatNumber(
            d.value >= 0
              ? scaleLinear((d.offsetX as number) + (d.value as number))!
              : scaleLinear(d.offsetX)!
          )
        );
      } else {
        expect(x).toStrictEqual(
          formatNumber(
            d.value >= 0
              ? scaleLinear(d.offsetX)!
              : scaleLinear((d.offsetX as number) + (d.value as number))!
          )
        );
      }
      expect(width).toStrictEqual(
        formatNumber(
          Math.abs(
            (scaleLinear as d3.ScaleLinear<number, number>)(0) -
              (scaleLinear as d3.ScaleLinear<number, number>)(d.value)
          )
        )
      );
      expect(height).toStrictEqual(
        formatNumber((groupedScale as d3.ScaleBand<number | string>).bandwidth())
      );
    });
  }

  beforeEach(() => {
    conf = {
      groupedType: 'inline',
      orientation: 'vertical',
      groups: [{ color: 'red' }, { color: 'blue' }, { color: 'green' }],
      events: {},
      axis: {
        invertAxisX: false,
        invertAxisY: false,
      },
    } as InternalGraphCongifuration<'histogram'>;

    document.body.innerHTML = `<div>
      <svg>
        <g id="mocked-g"></g>
      </svg>
    '</div>`;

    scaleBand = createScaleBandAxis(
      [0, 100],
      0.5,
      data.map((d) => d.label)
    );
    scaleLinear = createScaleLinearAxis([-100, 100], [-56, 81]);
    groupedScale = createScaleBandAxis([0, scaleBand.bandwidth()], 0.05, d3.range(3));
  });

  describe('test computeBarsData', () => {
    it('inline', () => {
      testBarsData();
    });

    it('stacked', () => {
      conf.groupedType = 'stacked';
      testBarsData();
    });
  });

  describe('test createBarsGroup', () => {
    it('vertical', () => {
      testCreateBarsGroup();
    });

    it('horizontal', () => {
      conf.orientation = 'horizontal';
      testCreateBarsGroup();
    });
  });

  describe('test createBars', () => {
    it('vertical', async () => {
      await testBarsCreation();
      testSubBarsCreationVertical();
    });

    it('vertical - invertAxisY', async () => {
      conf.axis.invertAxisY = true;
      await testBarsCreation();
      testSubBarsCreationVertical();
    });

    it('horizontal', async () => {
      conf.orientation = 'horizontal';
      await testBarsCreation();
      testSubBarsCreationHorizontal();
    });

    it('horizontal - invertAxisX', async () => {
      conf.orientation = 'horizontal';
      conf.axis.invertAxisX = true;
      await testBarsCreation();
      testSubBarsCreationHorizontal();
    });
  });

  describe('test updateBarsOnScroll', () => {
    it('vertical', async () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation with a subset of the data
      await testBarsCreation(0);
      // test sub bars attributes
      testSubBarsCreationVertical();
      // update bars
      updateBarsOnScroll(g, conf, data.slice(4, 9), {
        bottomAxisScale: scaleBand,
        leftAxisScale: scaleLinear,
        groupedAxisScale: groupedScale,
      });
      // retest sub bars attributes
      testSubBarsCreationVertical();
    });

    it('vertical - invertAxisY', async () => {
      conf.axis.invertAxisY = true;
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation with a subset of the data
      await testBarsCreation(0);
      // test sub bars attributes
      testSubBarsCreationVertical();
      // update bars
      updateBarsOnScroll(g, conf, data.slice(5, 10), {
        bottomAxisScale: scaleBand,
        leftAxisScale: scaleLinear,
        groupedAxisScale: groupedScale,
      });
      // retest sub bars attributes
      testSubBarsCreationVertical();
    });

    it('horizontal', async () => {
      conf.orientation = 'horizontal';
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation with a subset of the data
      await testBarsCreation(0);
      // test sub bars attributes
      testSubBarsCreationHorizontal();
      // update bars
      updateBarsOnScroll(g, conf, data.slice(4, 9), {
        bottomAxisScale: scaleLinear,
        leftAxisScale: scaleBand,
        groupedAxisScale: groupedScale,
      });
      // retest sub bars attributes
      testSubBarsCreationHorizontal();
    });

    it('horizontal - invertAxisX', async () => {
      conf.orientation = 'horizontal';
      conf.axis.invertAxisX = true;
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation with a subset of the data
      await testBarsCreation(0);
      // test sub bars attributes
      testSubBarsCreationHorizontal();
      // update bars
      updateBarsOnScroll(g, conf, data.slice(5, 10), {
        bottomAxisScale: scaleLinear,
        leftAxisScale: scaleBand,
        groupedAxisScale: groupedScale,
      });
      // retest sub bars attributes
      testSubBarsCreationHorizontal();
    });
  });

  describe('test updateBarsOnResize', () => {
    it('vertical', async () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation
      await testBarsCreation();
      // test sub bars attributes
      testSubBarsCreationVertical();
      // update axis
      scaleBand.range([0, 200]);
      scaleLinear.range([-200, 200]);
      // update bars
      updateBarsOnResize(
        g,
        conf,
        {
          bottomAxisScale: scaleBand,
          leftAxisScale: scaleLinear,
          groupedAxisScale: groupedScale,
        },
        'mocked-group',
        'mocked-sub-bar'
      );
      // retest sub bars attributes
      testSubBarsCreationVertical();
    });

    it('vertical - invertAxisY', async () => {
      conf.axis.invertAxisY = true;
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation
      await testBarsCreation();
      // test sub bars attributes
      testSubBarsCreationVertical();
      // update axis
      scaleBand.range([0, 200]);
      scaleLinear.range([-200, 200]);
      // update bars
      updateBarsOnResize(
        g,
        conf,
        {
          bottomAxisScale: scaleBand,
          leftAxisScale: scaleLinear,
          groupedAxisScale: groupedScale,
        },
        'mocked-group',
        'mocked-sub-bar'
      );
      // retest sub bars attributes
      testSubBarsCreationVertical();
    });

    it('horizontal', async () => {
      conf.orientation = 'horizontal';
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation
      await testBarsCreation();
      // test sub bars attributes
      testSubBarsCreationHorizontal();
      // update axis
      scaleBand.range([0, 200]);
      scaleLinear.range([-200, 200]);
      // update bars
      updateBarsOnResize(
        g,
        conf,
        {
          bottomAxisScale: scaleLinear,
          leftAxisScale: scaleBand,
          groupedAxisScale: groupedScale,
        },
        'mocked-group',
        'mocked-sub-bar'
      );
      // retest sub bars attributes
      testSubBarsCreationHorizontal();
    });

    it('horizontal - invertAxisX', async () => {
      conf.orientation = 'horizontal';
      conf.axis.invertAxisX = true;
      // select container
      const g: GElement = d3.select('#mocked-g');
      // test bars creation
      await testBarsCreation();
      // test sub bars attributes
      testSubBarsCreationHorizontal();
      // update axis
      scaleBand.range([0, 200]);
      scaleLinear.range([-200, 200]);
      // update bars
      updateBarsOnResize(
        g,
        conf,
        {
          bottomAxisScale: scaleLinear,
          leftAxisScale: scaleBand,
          groupedAxisScale: groupedScale,
        },
        'mocked-group',
        'mocked-sub-bar'
      );
      // retest sub bars attributes
      testSubBarsCreationHorizontal();
    });
  });
});
