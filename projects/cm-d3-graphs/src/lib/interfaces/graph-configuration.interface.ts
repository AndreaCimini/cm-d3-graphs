// INTERFACES

interface BaseGraphConfigurationInterface {
  id: string;
  margin?: { top?: number; bottom?: number; left?: number; right?: number; };
  overflowX?: boolean;
  overflowY?: boolean;
  tooltipFormat?: (label: string, value: number) => string;
}

export interface HistogramGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  type: 'histogram';
  maxDisplayedNumber?: number;
  events?: {
    clickOnElement?: boolean;
  };
  orientation?: 'vertical' | 'horizontal';
  grid?: {
    axisX?: boolean;
    axisY?: boolean;
    color?: string;
  };
  axis?: {
    showAxisX?: boolean;
    showAxisY?: boolean;
    invertAxisX?: boolean;
    invertAxisY?: boolean;
    labelXOrientation?: 'horizontal' | 'vertical' | 'oblique';
    labelYOrientation?: 'horizontal' | 'vertical' | 'oblique';
    tickFormatX?: (d: string) => string;
    tickFormatY?: (d: string) => string;
    lineColor?: string;
    textColor?: string;
  };
  groups?: {
    color?: string,
    label?: string
  }[];
  groupedType?: 'inline' | 'stacked';
  legend?: {
    enabled?: boolean;
    position?: 'bottom' | 'top' | 'left' | 'right';
  };
}

export interface LineGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  type: 'line';
  maxDisplayedNumber?: number;
  events?: {
    clickOnElement?: boolean;
  };
  orientation?: 'vertical' | 'horizontal';
  grid?: {
    axisX?: boolean;
    axisY?: boolean;
    color?: string;
  };
  axis?: {
    showAxisX?: boolean;
    showAxisY?: boolean;
    invertAxisX?: boolean;
    invertAxisY?: boolean;
    labelXOrientation?: 'horizontal' | 'vertical' | 'oblique';
    labelYOrientation?: 'horizontal' | 'vertical' | 'oblique';
    tickFormatX?: (d: string) => string;
    tickFormatY?: (d: string) => string;
    lineColor?: string;
    textColor?: string;
  };
  groups?: {
    color?: string,
    label?: string
  }[];
  hasArea?: boolean;
  legend?: {
    enabled?: boolean;
    position?: 'bottom' | 'top' | 'left' | 'right';
  };
}

export interface PieGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  type: 'pie' | 'donut';
  maxDisplayedNumber?: number;
  events?: {
    clickOnElement?: boolean;
  };
  slices?: {
    colors?: string[],
    textColor?: string
  };
  legend?: {
    enabled?: boolean;
    position?: 'bottom' | 'top' | 'left' | 'right';
  };
}

export interface TreeGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  type: 'tree';
  events?: {
    clickOnElement?: boolean;
  };
  orientation?: 'vertical' | 'horizontal';
  zoom?: {
    minZoom: number;
    maxZoom: number;
  };
  nodes?: {
    shape?: 'circle' | 'rect' | 'square' | 'rhombus';
    collapsedColor?: string;
    expandedColor?: string;
    strokeColor?: string;
    circleRadius?: number;
    rectangleDimensions?: { width: number, height: number },
    squareDimensions?: number;
    rhombusDimensions?: number;
    distanceBetweenBrothers?: number;
    distanceBetweenCousins?: number;
    distanceBetweenParentAndChild?: number;
    expandable?: boolean;
    maxInitialExpandedLevel?: number;
  };
  links?: {
    color?: string;
    arrow?: boolean;
    arrowDirection?: 'start' | 'end';
    width?: string;
  };
  label?: {
    color?: string;
    padding?: {top?: number, left?: number, right?: number, bottom?: number};
    'font-size'?: string;
  };
}

export interface FlowChartGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  type: 'flow-chart';
  events?: {
    clickOnElement?: boolean;
  };
  orientation?: 'vertical' | 'horizontal';
  zoom?: {
    minZoom: number;
    maxZoom: number;
  };
  nodes?: {
    shape?: 'circle' | 'rect' | 'square' | 'rhombus';
    collapsedColor?: string;
    expandedColor?: string;
    strokeColor?: string;
    circleRadius?: number;
    rectangleDimensions?: { width: number, height: number },
    squareDimensions?: number;
    rhombusDimensions?: number;
    distanceBetweenBrothers?: number;
    distanceBetweenCousins?: number;
    distanceBetweenParentAndChild?: number;
    expandable?: boolean;
    maxInitialExpandedLevel?: number;
    icon?: string;
  };
  links?: {
    color?: string;
    arrow?: boolean;
    arrowDirection?: 'start' | 'end';
    shape?: 'smooth' | 'straight';
    width?: string;
  };
  label?: {
    color?: string;
    padding?: {top?: number, left?: number, right?: number, bottom?: number};
    'font-size'?: string;
  };
  clusters?: {
    position?: 'default' | 'full-space';
    strokeColor?: string;
    fillColor?: string;
    shape?: 'rectangle' | 'ellipse';
    label?: {
      color?: string;
      position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
      'font-size'?: number,
      padding?: {top?: number, left?: number, right?: number, bottom?: number}
    };
  };
}

export interface RangeSliderGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  type: 'range-slider';
  events?: {
    rangeChanging?: boolean;
    rangeChanged?: boolean;
  };
  orientation?: 'vertical' | 'horizontal';
  axis?: {
    showAxisX?: boolean;
    showAxisY?: boolean;
    invertAxisX?: boolean;
    invertAxisY?: boolean;
    labelXOrientation?: 'horizontal' | 'vertical' | 'oblique';
    labelYOrientation?: 'horizontal' | 'vertical' | 'oblique';
    tickFormatX?: (d: string) => string;
    tickFormatY?: (d: string) => string;
    lineColor?: string;
    textColor?: string;
  };
  track?: {
    color?: string;
    width?: number;
    insetColor?: string;
    insetWidth?: number;
    fillColor?: string;
    fillWidth?: number;
  };
  interval?: {
    type?: 'discrete' | 'continuous';
    step?: number;
  };
  handle?: {
    strokeColor?: string;
    fillColor?: string;
    type?: 'single' | 'double';
    showTooltip?: 'never' | 'always' | 'on-hover'
  };
}

export interface BubbleChartGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  type: 'bubble-chart';
  events?: {
    clickOnElement?: boolean;
  };
  nodes?: {
    backgroundStartColor?: string;
    backgroundEndColor?: string;
    strokeColorOnHover?: string;
    expandable?: boolean;
    maxInitialExpandedLevel?: number;
  };
  label?: {
    color?: string;
    'font-size'?: string;
  };
}

// TYPES

export type NodeGraphInterface = TreeGraphConfigurationInterface | FlowChartGraphConfigurationInterface;

export type AxesGraphInterface = HistogramGraphConfigurationInterface | LineGraphConfigurationInterface |
  RangeSliderGraphConfigurationInterface;

export type GraphConfigurationInterface = AxesGraphInterface | PieGraphConfigurationInterface | NodeGraphInterface |
  BubbleChartGraphConfigurationInterface;
