import { InternalGraphCongifuration } from '../../types/graphConfiguration';
import { ContainerUtility } from '../container';

describe('Test container utility functions', () => {
  const conf = {
    id: 'mocked-id',
    margin: {
      right: 10,
      left: 13,
      top: 25,
      bottom: 0,
    },
    maxDisplayedNumber: 10,
    orientation: 'vertical',
    legend: {
      enabled: false,
      position: 'right',
    },
  } as InternalGraphCongifuration<'histogram'>;

  const height = 100;
  const width = 124;
  const scrollDimension = 40;
  const legendDimension = 20;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `<div id="test-div"></div>`;
    element = document.getElementById('test-div')!;
    Object.defineProperty(element, 'clientWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(element, 'clientHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  });

  it('test createContainer', () => {
    // get element
    const containerUtility = new ContainerUtility<'histogram'>(element, conf);
    // create svg and g container
    containerUtility.createContainer();
    // check that svg is created and has right attributes
    const svg = document.querySelector('#mocked-id');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe(width.toString());
    expect(svg?.getAttribute('height')).toBe(height.toString());
    // check that g is created and has right attributes
    const g = document.querySelector('#main-g');
    expect(g).not.toBeNull();
    expect(g?.getAttribute('transform')).toBe(`translate(${conf.margin.left}, ${conf.margin.top})`);
  });

  describe('test calcGraphDimensions', () => {
    it('no scroll and no legend', () => {
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      containerUtility.calcGraphDimensions(scrollDimension, 4, legendDimension);
      expect(containerUtility.getGraphWidth()).toBe(width - conf.margin.left - conf.margin.right);
      expect(containerUtility.getGraphHeight()).toBe(height - conf.margin.top - conf.margin.bottom);
    });

    it('scroll and no legend - vertical', () => {
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      containerUtility.calcGraphDimensions(scrollDimension, 12, legendDimension);
      expect(containerUtility.getGraphWidth()).toBe(width - conf.margin.left - conf.margin.right);
      expect(containerUtility.getGraphHeight()).toBe(
        height - conf.margin.top - conf.margin.bottom - scrollDimension
      );
    });

    it('scroll and no legend - horizontal', () => {
      conf.orientation = 'horizontal';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      containerUtility.calcGraphDimensions(scrollDimension, 12, legendDimension);
      expect(containerUtility.getGraphWidth()).toBe(
        width - conf.margin.left - conf.margin.right - scrollDimension
      );
      expect(containerUtility.getGraphHeight()).toBe(height - conf.margin.top - conf.margin.bottom);
    });

    it('scroll and legend right - vertical', () => {
      conf.orientation = 'vertical';
      conf.legend.enabled = true;
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      containerUtility.calcGraphDimensions(scrollDimension, 12, legendDimension);
      expect(containerUtility.getGraphWidth()).toBe(
        width - conf.margin.left - conf.margin.right - legendDimension
      );
      expect(containerUtility.getGraphHeight()).toBe(
        height - conf.margin.top - conf.margin.bottom - scrollDimension
      );
    });

    it('scroll and legend left - vertical', () => {
      conf.orientation = 'vertical';
      conf.legend.enabled = true;
      conf.legend.position = 'left';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      containerUtility.calcGraphDimensions(scrollDimension, 12, legendDimension);
      expect(containerUtility.getGraphWidth()).toBe(
        width - conf.margin.left - conf.margin.right - legendDimension
      );
      expect(containerUtility.getGraphHeight()).toBe(
        height - conf.margin.top - conf.margin.bottom - scrollDimension
      );
    });

    it('scroll and legend top - horizontal', () => {
      conf.orientation = 'horizontal';
      conf.legend.enabled = true;
      conf.legend.position = 'top';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      containerUtility.calcGraphDimensions(scrollDimension, 12, legendDimension);
      expect(containerUtility.getGraphWidth()).toBe(
        width - conf.margin.left - conf.margin.right - scrollDimension
      );
      expect(containerUtility.getGraphHeight()).toBe(
        height - conf.margin.top - conf.margin.bottom - legendDimension
      );
    });

    it('scroll and legend bottom - vertical', () => {
      conf.orientation = 'horizontal';
      conf.legend.enabled = true;
      conf.legend.position = 'bottom';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      containerUtility.calcGraphDimensions(scrollDimension, 12, legendDimension);
      expect(containerUtility.getGraphWidth()).toBe(
        width - conf.margin.left - conf.margin.right - scrollDimension
      );
      expect(containerUtility.getGraphHeight()).toBe(
        height - conf.margin.top - conf.margin.bottom - legendDimension
      );
    });
  });

  describe('test createGraphContainer', () => {
    it('legend top', () => {
      conf.legend.position = 'top';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      // create graph container and check position
      containerUtility.createGraphContainer(legendDimension);
      const graphContainer = document.querySelector('.graph-container');
      expect(graphContainer).not.toBeNull();
      expect(graphContainer?.getAttribute('transform')).toBe(`translate(0, ${legendDimension})`);
    });

    it('legend bottom', () => {
      conf.legend.position = 'bottom';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      // create graph container and check position
      containerUtility.createGraphContainer(legendDimension);
      const graphContainer = document.querySelector('.graph-container');
      expect(graphContainer).not.toBeNull();
      expect(graphContainer?.getAttribute('transform')).toBe(`translate(0, 0)`);
    });

    it('legend right', () => {
      conf.legend.position = 'right';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      // create graph container and check position
      containerUtility.createGraphContainer(legendDimension);
      const graphContainer = document.querySelector('.graph-container');
      expect(graphContainer).not.toBeNull();
      expect(graphContainer?.getAttribute('transform')).toBe(`translate(0, 0)`);
    });

    it('legend left', () => {
      conf.legend.position = 'left';
      const containerUtility = new ContainerUtility<'histogram'>(element, conf);
      // create svg and g container
      containerUtility.createContainer();
      // create graph container and check position
      containerUtility.createGraphContainer(legendDimension);
      const graphContainer = document.querySelector('.graph-container');
      expect(graphContainer).not.toBeNull();
      expect(graphContainer?.getAttribute('transform')).toBe(`translate(${legendDimension}, 0)`);
    });
  });

  it('test updateContainer', () => {
    const containerUtility = new ContainerUtility<'histogram'>(element, conf);
    // create svg and g container
    containerUtility.createContainer();
    // simulate resize
    Object.defineProperty(element, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 150,
    });
    Object.defineProperty(element, 'clientHeight', {
      writable: true,
      configurable: true,
      value: 150,
    });
    // update svg dimensions and check that it is updated correctly
    containerUtility.updateContainer();
    const svg = document.querySelector('#mocked-id');
    expect(svg?.getAttribute('width')).toBe('150');
    expect(svg?.getAttribute('height')).toBe('150');
  });
});
