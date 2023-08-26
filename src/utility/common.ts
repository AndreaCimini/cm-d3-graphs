import { InternalGraphCongifuration } from '../types/graphConfiguration';
import { InternalGraphData } from '../types/graphData';

type MergeObj<TModel> = TModel extends object
  ? {
      [propertyName in keyof TModel]?: TModel[propertyName];
    }
  : null;

type MergeArray<TModel> = TModel extends Array<infer TElem> ? Array<TElem> : null;

function mergeArray<TModel1 extends TModel2, TModel2>(
  obj1: MergeArray<TModel1>,
  obj2: MergeArray<TModel2>
) {
  if (!obj2 || !obj1) {
    return;
  }
  obj2.forEach((el: any, index: number) => {
    if (Array.isArray(obj2[index])) {
      if (!obj1[index]) {
        obj1[index] = [];
      }
      merge(obj1[index], obj2[index]);
    } else if (typeof obj2[index] === 'object') {
      if (!obj1[index]) {
        obj1[index] = {};
      }
      merge(obj1[index], obj2[index]);
    } else if (!obj1[index]) {
      obj1.push(el);
    } else {
      obj1[index] = el;
    }
  });
}

function mergeObj<TModel1 extends TModel2, TModel2>(
  obj1: MergeObj<TModel1>,
  obj2: MergeObj<TModel2>
) {
  if (!obj2 || !obj1) {
    return;
  }
  for (const [key, value] of Object.entries(obj2)) {
    if (Array.isArray(value)) {
      if (!obj1[key as keyof TModel2]) {
        obj1[key as keyof TModel2] = [] as TModel1[keyof TModel2];
      }
      merge(obj1[key as keyof TModel2], obj2[key as keyof TModel2]);
      continue;
    }
    if (typeof value === 'object') {
      if (!obj1[key as keyof TModel2]) {
        obj1[key as keyof TModel2] = {} as TModel1[keyof TModel2];
      }
      merge(obj1[key as keyof TModel2], obj2[key as keyof TModel2]);
      continue;
    }
    obj1[key as keyof TModel2] = value as TModel1[keyof TModel2];
  }
}

export function merge<TModel1 extends TModel2, TModel2>(obj1: TModel1, obj2: TModel2) {
  if (Array.isArray(obj2)) {
    mergeArray(obj1 as MergeArray<TModel1>, obj2 as MergeArray<TModel2>);
  } else if (typeof obj2 === 'object') {
    mergeObj(obj1 as MergeObj<TModel1>, obj2 as MergeObj<TModel2>);
  }
  return obj1;
}

export function evalTwoConditions<TComparison, TReturn>(
  leftComparisonItem: TComparison,
  rightComparisonItem: TComparison,
  firstReturn: TReturn,
  secondReturn: TReturn
): TReturn {
  if (leftComparisonItem === rightComparisonItem) {
    return firstReturn;
  }

  return secondReturn;
}

export function evalThreeConditions<TComparison, TReturn>(
  leftComparisonItem: TComparison,
  rightComparisonItem: TComparison,
  nestedComparisonItem: any,
  firstReturn: TReturn,
  secondReturn: TReturn,
  thirdReturn: TReturn
): TReturn {
  if (leftComparisonItem === rightComparisonItem) {
    if (nestedComparisonItem) {
      return firstReturn;
    }
    return secondReturn;
  }

  return thirdReturn;
}

export function formatNumber(numberToFormat: number): number {
  return Math.ceil(numberToFormat * 100) / 100;
}

export function calcNumOfSeries<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  data: Array<InternalGraphData<TModel>>
): number {
  if (conf.groupedType === 'inline') {
    return data.reduce(
      (max: number, elem: InternalGraphData<TModel>) => Math.max(max, elem.values.length),
      0
    );
  }
  return 0;
}

export function calcMinAndMaxValues<TModel extends 'histogram'>(
  conf: InternalGraphCongifuration<TModel>,
  data: Array<InternalGraphData<TModel>>
) {
  // get values
  const graphValues = data
    .map((d) => d.values)
    .reduce((arr: Array<number>, elem: Array<number>) => {
      if (conf.groupedType === 'inline') {
        return arr.concat(elem);
      }
      const sums = elem.reduce(
        (a: Array<number>, b: number) => {
          // first element is for positive sum
          if (b >= 0) {
            a[0] += b;
          } else {
            // second element is for negative sum
            a[1] += b;
          }
          return a;
        },
        [0, 0]
      );
      return arr.concat(sums);
    }, []);
  // calc min and max value
  const min = Math.min(0, ...graphValues);
  const max = Math.max(...graphValues);
  return { min, max };
}

// TODO: scrivere test
export const reg = new FinalizationRegistry((id: string) => {
  console.log(`Test #${id} has been garbage collected`);
});
