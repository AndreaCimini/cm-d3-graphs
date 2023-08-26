import * as d3 from 'd3';
import { GElement } from '../../types/d3Types';

import { InternalGraphCongifuration } from '../../types/graphConfiguration';
import {
  addBottomAxis,
  addLeftAxis,
  createScaleBandAxis,
  createScaleLinearAxis,
  scaleAxes,
  updateBottomAxisDomain,
  updateLeftAxisDomain,
} from '../axes';

describe('Test axes utility functions', () => {
  
  function testAxisAttributes(axisClass: string, strokeColor: string, fillColor: string) {
    const axis = document.querySelector(axisClass);
    expect(axis).not.toBeNull();
    const path = axis?.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe(strokeColor);
    const line = axis?.querySelector('line');
    expect(line?.getAttribute('stroke')).toBe(strokeColor);
    const text = axis?.querySelector('text');
    expect(text?.getAttribute('fill')).toBe(fillColor);
  }

  beforeEach(() => {
    document.body.innerHTML = `<div>
      <svg>
        <g id="mocked-g"></g>
      </svg>
    '</div>`;
  });

  it('test createScaleBandAxis', () => {
    // create band axis
    const scaleBandAxis = createScaleBandAxis([0, 10], 0.5, [0, 10, 100]);
    // check that axis is created with properties set during creation phase 
    expect(scaleBandAxis.range()).toStrictEqual([0, 10]);
    expect(scaleBandAxis.domain()).toStrictEqual([0, 10, 100]);
    expect(scaleBandAxis.paddingInner()).toStrictEqual(0.5);
  });

  it('test createScaleLinearAxis', () => {
    // create linear axis
    const scaleLinearAxis = createScaleLinearAxis([0, 10], [0, 100]);
    // check that axis is created with properties set during creation phase 
    expect(scaleLinearAxis.range()).toStrictEqual([0, 10]);
    expect(scaleLinearAxis.domain()).toStrictEqual([0, 100]);
  });

  it('test addBottomAxis', () => {
    // select container
    const g: GElement = d3.select('#mocked-g');
    // create band axis
    const scaleBandAxis = createScaleBandAxis([0, 10], 0.5, [0, 10, 100]);
    // add axis to html
    addBottomAxis(
      { axis: { lineColor: 'red', textColor: 'white' } } as InternalGraphCongifuration<'histogram'>,
      g,
      scaleBandAxis
    );
    // check that axis is added to html with attributes set during adding phase
    testAxisAttributes('.bottom-axis', 'red', 'white');
  });

  it('test addLeftAxis', () => {
    // select container
    const g: GElement = d3.select('#mocked-g');
    // create linear axis
    const scaleLinearAxis = createScaleLinearAxis([0, 10], [0, 10, 100]);
    // add axis to html
    addLeftAxis(
      {
        axis: { lineColor: 'blue', textColor: 'green' },
      } as InternalGraphCongifuration<'histogram'>,
      g,
      scaleLinearAxis
    );
    // check that axis is added to html with attributes set during adding phase
    testAxisAttributes('.left-axis', 'blue', 'green');
  });

  describe('test scaleAxis', () => {
    it('showAxisX and showAxisY', () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // create and add axes to the dom
      const bottomScale = createScaleBandAxis([0, 10], 0.5, [0, 10, 100]);
      const leftScale = createScaleLinearAxis([0, 10], [0, 10, 100]);
      const bottomAxis = addBottomAxis(
        { axis: { lineColor: 'red', textColor: 'white' } } as InternalGraphCongifuration<'histogram'>,
        g,
        bottomScale
      );
      const leftAxis = addLeftAxis(
        {
          axis: { lineColor: 'blue', textColor: 'green' },
        } as InternalGraphCongifuration<'histogram'>,
        g,
        leftScale
      );
      // scale axes
      scaleAxes(
        {
          axis: { showAxisX: true, showAxisY: true },
        } as InternalGraphCongifuration<'histogram'>,
        g,
        100,
        100,
        { bottomScale, leftScale, leftAxis, bottomAxis }
      );
      // do checks
      const leftAxisHtml = g.select('.left-axis');
      const bottomAxisHtml = g.select('.bottom-axis');
      const axisBottomHeight = (bottomAxisHtml.node() as Element).getBoundingClientRect().height;
      const axisLeftWidth = (leftAxisHtml.node() as Element).getBoundingClientRect().width;
      expect(bottomScale.range()).toStrictEqual([axisLeftWidth, 100]);
      expect(leftScale.range()).toStrictEqual([0, 100 - axisBottomHeight]);
      expect((bottomAxisHtml.node() as Element).getAttribute('transform')).toBe(`translate(0, ${100 - axisBottomHeight})`);
      expect((leftAxisHtml.node() as Element).getAttribute('transform')).toBe(`translate(${axisLeftWidth}, 0)`);
    });
  
    it('showAxisX', () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // create and add axes to the dom
      const bottomScale = createScaleBandAxis([0, 10], 0.5, [0, 10, 100]);
      const leftScale = createScaleLinearAxis([0, 10], [0, 10, 100]);
      const bottomAxis = addBottomAxis(
        { axis: { lineColor: 'red', textColor: 'white' } } as InternalGraphCongifuration<'histogram'>,
        g,
        bottomScale
      );
      // scale axes
      scaleAxes(
        {
          axis: { showAxisX: true, showAxisY: false },
        } as InternalGraphCongifuration<'histogram'>,
        g,
        100,
        100,
        { bottomScale, leftScale, leftAxis: undefined, bottomAxis }
      );
      // do checks
      const bottomAxisHtml = g.select('.bottom-axis');
      const leftAxisHtml = g.select('.left-axis');
      const axisBottomHeight = (bottomAxisHtml.node() as Element).getBoundingClientRect().height;
      expect(leftScale.range()).toStrictEqual([0, 100 - axisBottomHeight]);
      expect(bottomScale.range()).toStrictEqual([0, 10]);
      expect((bottomAxisHtml.node() as Element).getAttribute('transform')).toBe(`translate(0, ${100 - axisBottomHeight})`);
      expect((leftAxisHtml.node() as Element)).toBeNull();
    });
  
    it('showAxisY', () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // create and add axes to the dom
      const bottomScale = createScaleBandAxis([0, 10], 0.5, [0, 10, 100]);
      const leftScale = createScaleLinearAxis([0, 10], [0, 10, 100]);
      const leftAxis = addLeftAxis(
        {
          axis: { lineColor: 'blue', textColor: 'green' },
        } as InternalGraphCongifuration<'histogram'>,
        g,
        leftScale
      );
      // scale axes
      scaleAxes(
        {
          axis: { showAxisX: false, showAxisY: true },
        } as InternalGraphCongifuration<'histogram'>,
        g,
        100,
        100,
        { bottomScale, leftScale, leftAxis }
      );
      // do checks
      const bottomAxisHtml = g.select('.bottom-axis');
      const leftAxisHtml = g.select('.left-axis');
      const axisLeftWidth = (leftAxisHtml.node() as Element).getBoundingClientRect().width;
      expect(bottomScale.range()).toStrictEqual([axisLeftWidth, 100]);
      expect(leftScale.range()).toStrictEqual([0, 10]);
      expect((leftAxisHtml.node() as Element).getAttribute('transform')).toBe(`translate(${axisLeftWidth}, 0)`);
      expect((bottomAxisHtml.node() as Element)).toBeNull();
    });
  });

  describe('test updateLeftAxisDomain', () => {
    
    it('without leftAxis', () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // create linear axis
      const scaleLeftAxis = createScaleLinearAxis([0, 10], [0, 10, 100]);
      // update axis domain
      updateLeftAxisDomain(
        g,
        [0, 10, 100, 1000, 10000],
        scaleLeftAxis
        );
      // check that axis domain is updated
      expect(scaleLeftAxis.domain()).toStrictEqual([0, 10, 100, 1000, 10000]);
    });

    it('with leftAxis', () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // create linear axis
      const scaleLeftAxis = createScaleLinearAxis([0, 10], [0, 10, 100]);
      // add axis to the dom
      const leftAxis = addLeftAxis({
        axis: { lineColor: 'blue', textColor: 'green' },
      } as InternalGraphCongifuration<'histogram'>, g, scaleLeftAxis);
      // update axis domain
      updateLeftAxisDomain(
        g,
        [0, 10, 100, 1000, 10000],
        scaleLeftAxis,
        leftAxis
        );
      // check that axis domain is updated
      expect(scaleLeftAxis.domain()).toStrictEqual([0, 10, 100, 1000, 10000]);
    });
  });

  describe('test updateBottomAxisDomain', () => {
    
    it('without bottomAxis', () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // create bottom axis
      const scaleBottomAxis = createScaleBandAxis([0, 10], 0.5, [0, 10, 100]);
      // add axis to the dom
      updateBottomAxisDomain(
        g,
        [0, 10, 100, 1000, 10000],
        scaleBottomAxis
        );
      // check that axis domain is updated
      expect(scaleBottomAxis.domain()).toStrictEqual([0, 10, 100, 1000, 10000]);
    });

    it('with bottomAxis', () => {
      // select container
      const g: GElement = d3.select('#mocked-g');
      // create bottom axis
      const scaleBottomAxis = createScaleBandAxis([0, 10], 0.5, [0, 10, 100]);
      // add axis to the dom
      const bottomAxis = addBottomAxis(
        { axis: { lineColor: 'red', textColor: 'white' } } as InternalGraphCongifuration<'histogram'>,
        g,
        scaleBottomAxis
      );
      updateBottomAxisDomain(
        g,
        [0, 10, 100, 1000, 10000],
        scaleBottomAxis,
        bottomAxis
        );
      // check that axis domain is updated
      expect(scaleBottomAxis.domain()).toStrictEqual([0, 10, 100, 1000, 10000]);
    });
  });
});
