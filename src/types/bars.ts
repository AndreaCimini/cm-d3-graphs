import { InternalGraphData } from "./graphData";

export type BarDataValue = {
  index: number;
  label: string;
  value: number;
  offsetX: number;
  offsetY: number;
};

export type BarsData = Omit<InternalGraphData<'histogram'>, 'values'> & {
  values: Array<BarDataValue>;
};
