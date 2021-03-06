interface BaseGraphDataInterface {
  id?: string;
  label: string;
  extraData?: {
    [key: string]: any;
  };
}

export interface HistogramGraphDataInterface extends BaseGraphDataInterface {
  values?: number[];
}

export interface PieGraphDataInterface extends BaseGraphDataInterface {
  value?: number;
  slice?: {
    color?: string;
  };
}

export interface LineGraphDataInterface extends BaseGraphDataInterface {
  values?: number[];
}

export interface RangeSliderGraphDataInterface extends BaseGraphDataInterface {
  value?: number;
}

export interface TreeGraphDataInterface extends BaseGraphDataInterface {
  children?: TreeGraphDataInterface[];
  node?: {
    shape?: 'circle' | 'rect' | 'square' | 'rhombus';
    collapsedColor?: string;
    expandedColor?: string;
    strokeColor?: string;
    labelColor?: string;
  };
  link?: {
    color?: string;
  };
}

export interface FlowChartGraphDataInterface extends BaseGraphDataInterface {
  node?: {
    shape?: 'circle' | 'rect' | 'square' | 'rhombus';
    collapsedColor?: string;
    expandedColor?: string;
    strokeColor?: string;
    labelColor?: string;
  };
  link?: {
    color?: string;
  };
  source?: string;
  target?: string;
  nodes?: string[];
  cluster?: {
    level?: number;
    strokeColor?: string;
    fillColor?: string;
    label?: {
      color?: string;
      position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    };
  };
}

export interface BubbleChartGraphDataInterface extends BaseGraphDataInterface {
  value?: number;
  children?: BubbleChartGraphDataInterface[];
  node?: {
    strokeColorOnHover?: string;
  };
}

export type NodesGraphDataInterface = TreeGraphDataInterface | FlowChartGraphDataInterface | BubbleChartGraphDataInterface;

export type AxisGraphDataInterface = HistogramGraphDataInterface | LineGraphDataInterface | RangeSliderGraphDataInterface;

export type GraphDataInterface = AxisGraphDataInterface | PieGraphDataInterface | NodesGraphDataInterface;
