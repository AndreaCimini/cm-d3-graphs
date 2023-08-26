import { DeepPartial } from './deepPartial';
import { ClusterLabelPosition, NodeShape } from './graphConfiguration';
import { GraphTypes } from './graphTypes';

// INTERFACES
interface Node {
  shape: NodeShape;
  collapsedColor: string;
  expandedColor: string;
  strokeColor: string;
  strokeWidth: string;
  labelColor: string;
  circleRadius: number;
  rectangleDimensions: { width: number; height: number };
  squareDimensions: number;
  rhombusDimensions: number;
  additionalClasses: string;
}

interface Link {
  color: string;
  width: string;
}

interface BaseGraphDataInterface {
  id: string;
  label: string;
  extraData: {
    [key: string]: any;
  };
}

export interface HistogramGraphDataInterface extends BaseGraphDataInterface {
  values: Array<number>;
}

export interface PieGraphDataInterface extends BaseGraphDataInterface {
  value: number;
  slice: {
    color: string;
  };
}

export interface LineGraphDataInterface extends BaseGraphDataInterface {
  values: Array<number>;
}

export interface RangeSliderGraphDataInterface extends BaseGraphDataInterface {
  value: number;
}

export interface TreeGraphDataInterface extends BaseGraphDataInterface {
  children: Array<TreeGraphDataInterface>;
  node: Node;
  link: Link;
}

export interface FlowChartGraphDataInterface extends BaseGraphDataInterface {
  node: Node & {
    icon: string;
  };
  link: Link;
  source: string;
  target: string;
  nodes: Array<string>;
  cluster: {
    level: number;
    strokeColor: string;
    fillColor: string;
    label: ClusterLabelPosition;
  };
}

export interface BubbleChartGraphDataInterface extends BaseGraphDataInterface {
  value: number;
  children: Array<BubbleChartGraphDataInterface>;
  node: {
    strokeColorOnHover: string;
  };
}

// EXPORTED TYPES
export type InternalGraphData<TModel extends GraphTypes> = TModel extends 'histogram'
  ? HistogramGraphDataInterface
  : TModel extends 'pie' | 'donut'
  ? PieGraphDataInterface
  : TModel extends 'line'
  ? LineGraphDataInterface
  : TModel extends 'tree'
  ? TreeGraphDataInterface
  : TModel extends 'flow'
  ? FlowChartGraphDataInterface
  : TModel extends 'range'
  ? RangeSliderGraphDataInterface
  : TModel extends 'bubble'
  ? BaseGraphDataInterface
  : null;

export type GraphData<TModel extends GraphTypes> = TModel extends 'histogram'
  ? DeepPartial<Omit<HistogramGraphDataInterface, 'label' | 'values'>> & Pick<HistogramGraphDataInterface, 'label' | 'values'>
  : TModel extends 'pie' | 'donut'
  ? DeepPartial<PieGraphDataInterface>
  : TModel extends 'line'
  ? DeepPartial<Omit<LineGraphDataInterface, 'label' | 'values'>> & Pick<LineGraphDataInterface, 'label' | 'values'>
  : TModel extends 'tree'
  ? DeepPartial<TreeGraphDataInterface>
  : TModel extends 'flow'
  ? DeepPartial<FlowChartGraphDataInterface>
  : TModel extends 'range'
  ? DeepPartial<RangeSliderGraphDataInterface>
  : TModel extends 'bubble'
  ? DeepPartial<BaseGraphDataInterface>
  : null;
