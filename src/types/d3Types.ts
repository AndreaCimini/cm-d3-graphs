export type GElement = d3.Selection<SVGGElement, unknown, HTMLElement, undefined>;
export type Scale = d3.ScaleLinear<number, number> | d3.ScaleBand<string | number>;
export type Axis = d3.Axis<d3.AxisDomain>;