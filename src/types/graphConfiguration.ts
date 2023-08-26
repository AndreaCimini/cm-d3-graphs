import { DeepPartial } from './deepPartial';
import { GraphTypes } from './graphTypes';

// TYPES
type LabelOrientation = 'horizontal' | 'vertical' | 'oblique';
type GraphOrientation = 'vertical' | 'horizontal';
type LegendPosition = 'bottom' | 'top' | 'left' | 'right';
export type NodeShape = 'circle' | 'rect' | 'square' | 'rhombus';
type LinkShape = 'smooth' | 'straight';
type ArrowDirection = 'start' | 'end';
type ClusterPosition = 'default' | 'full-space';
type ClusterShape = 'rectangle' | 'ellipse';
export type ClusterLabelPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';
type IntervalType = 'discrete' | 'continuous';
type HandleType = 'single' | 'double';
type ShowTooltip = 'never' | 'always' | 'on-hover';
type GroupedType = 'inline' | 'stacked';

// INTERFACES
interface PaggingOrMargin {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

interface Grid {
  axisX: boolean;
  axisY: boolean;
  color: string;
}

interface Axis {
  showAxisX: boolean;
  showAxisY: boolean;
  invertAxisX: boolean;
  invertAxisY: boolean;
  labelXOrientation: LabelOrientation;
  labelYOrientation: LabelOrientation;
  tickFormatX?: (d: string) => string;
  tickFormatY?: (d: string) => string;
  lineColor: string;
  textColor: string;
}

export interface Group {
  color: string;
  label: string;
}

interface Legend {
  enabled: boolean;
  position: LegendPosition;
}

interface Nodes {
  shape: NodeShape;
  collapsedColor: string;
  expandedColor: string;
  strokeColor: string;
  strokeWidth?: string;
  circleRadius: number;
  rectangleDimensions: { width: number; height: number };
  squareDimensions: number;
  rhombusDimensions: number;
  distanceBetweenBrothers: number;
  distanceBetweenCousins: number;
  distanceBetweenParentAndChild: number;
  expandable: boolean;
  maxInitialExpandedLevel: number;
  additionalClasses?: string;
}

interface Links {
  color: string;
  arrow: boolean;
  arrowDirection: ArrowDirection;
  width: string;
}

interface Zoom {
  minZoom: number;
  maxZoom: number;
}

interface Label {
  color: string;
  padding: PaggingOrMargin;
  fontSize?: string;
}

interface Clusters {
  position: ClusterPosition;
  strokeColor: string;
  fillColor: string;
  shape: ClusterShape;
  label: {
    color: string;
    position: ClusterLabelPosition;
    fontSize: number;
    padding: PaggingOrMargin;
  };
}

interface GraphEvents {
  clickOnElement: boolean;
  rangeChanging: boolean;
  rangeChanged: boolean;
}

interface BaseGraphConfigurationInterface {
  id: string;
  margin: { top: number; bottom: number; left: number; right: number };
  overflowX: boolean;
  overflowY: boolean;
  tooltipFormat: (label: string, value: number) => string;
}

export interface HistogramGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  maxDisplayedNumber: number;
  events: Pick<GraphEvents, 'clickOnElement'>;
  orientation: GraphOrientation;
  grid: Grid;
  axis: Axis;
  groups: Array<Group>;
  groupedType: GroupedType;
  legend: Legend;
}

export interface LineGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  maxDisplayedNumber: number;
  events: Pick<GraphEvents, 'clickOnElement'>;
  orientation: GraphOrientation;
  grid: Grid;
  axis: Axis;
  groups: Array<Group>;
  hasArea: boolean;
  legend: Legend;
}

export interface PieGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  maxDisplayedNumber: number;
  events: Pick<GraphEvents, 'clickOnElement'>;
  slices: {
    colors: Array<string>;
    textColor: string;
  };
  legend: Legend;
}

export interface TreeGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  events: Pick<GraphEvents, 'clickOnElement'>;
  orientation: GraphOrientation;
  zoom: Zoom;
  nodes: Nodes;
  links: Links;
  label: Label;
}

export interface FlowChartGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  events: Pick<GraphEvents, 'clickOnElement'>;
  orientation: GraphOrientation;
  zoom: Zoom;
  nodes: Omit<Nodes, 'expandable' | 'maxInitialExpandedLevel'> & {
    icon?: string;
  };
  links: Links & {
    shape: LinkShape;
  };
  label: Label;
  clusters: Clusters;
}

export interface RangeSliderGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  events: Pick<GraphEvents, 'rangeChanging' | 'rangeChanged'>;
  orientation: GraphOrientation;
  axis: Axis;
  track: {
    color: string;
    width: number;
    insetColor: string;
    insetWidth: number;
    fillColor: string;
    fillWidth: number;
  };
  interval: {
    type: IntervalType;
    step?: number;
  };
  handle: {
    strokeColor: string;
    fillColor: string;
    type: HandleType;
    showTooltip: ShowTooltip;
  };
}

export interface BubbleChartGraphConfigurationInterface extends BaseGraphConfigurationInterface {
  events: Pick<GraphEvents, 'clickOnElement'>;
  nodes: {
    backgroundStartColor: string;
    backgroundEndColor: string;
    strokeColorOnHover: string;
    expandable: boolean;
    maxInitialExpandedLevel: number;
  };
  label: Pick<Label, 'color' | 'fontSize'>;
}

// EXPORTED TYPES
export type InternalGraphCongifuration<TModel extends GraphTypes> = TModel extends 'histogram'
  ? HistogramGraphConfigurationInterface
  : TModel extends 'pie' | 'donut'
  ? PieGraphConfigurationInterface
  : TModel extends 'line'
  ? LineGraphConfigurationInterface
  : TModel extends 'tree'
  ? TreeGraphConfigurationInterface
  : TModel extends 'flow'
  ? FlowChartGraphConfigurationInterface
  : TModel extends 'range'
  ? RangeSliderGraphConfigurationInterface
  : TModel extends 'bubble'
  ? BubbleChartGraphConfigurationInterface
  : null;

export type GraphCongifuration<TModel extends GraphTypes> = TModel extends 'histogram'
? DeepPartial<HistogramGraphConfigurationInterface>
: TModel extends 'pie' | 'donut'
? DeepPartial<PieGraphConfigurationInterface>
: TModel extends 'line'
? DeepPartial<LineGraphConfigurationInterface>
: TModel extends 'tree'
? DeepPartial<TreeGraphConfigurationInterface>
: TModel extends 'flow'
? DeepPartial<FlowChartGraphConfigurationInterface>
: TModel extends 'range'
? DeepPartial<RangeSliderGraphConfigurationInterface>
: TModel extends 'bubble'
? DeepPartial<BubbleChartGraphConfigurationInterface>
: null;
