import { InternalGraphCongifuration } from '../../types/graphConfiguration';
import { InternalGraphData } from '../../types/graphData';
import {
  calcMinAndMaxValues,
  calcNumOfSeries,
  evalThreeConditions,
  evalTwoConditions,
  formatNumber,
  merge,
} from '../common';

type Details = {
  address?: {
    cap: string;
    address: string;
    city: string;
  };
  hobbies: Array<string>;
  houses: Array<{
    address: string;
    firstHouse: boolean;
  }>;
};

type Person = Details & {
  name: string;
  surname: string;
};

describe('Test common utility functions', () => {
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

  it('merge', () => {
    // define sample objects
    const person: Person = {
      name: 'Mario',
      surname: 'Rossi',
      hobbies: ['dancing', 'running'],
      houses: [
        {
          address: 'Address Old House',
          firstHouse: true,
        },
      ],
    };
    const address: Details = {
      address: {
        cap: '00123',
        address: 'address',
        city: 'city',
      },
      hobbies: ['painting'],
      houses: [
        {
          address: 'Address House1',
          firstHouse: true,
        },
        {
          address: 'Address House2',
          firstHouse: false,
        },
      ],
    };
    // merge objects
    const result = merge(person, address);
    // check the merging result
    expect(result).toStrictEqual({
      name: 'Mario',
      surname: 'Rossi',
      address: {
        cap: '00123',
        address: 'address',
        city: 'city',
      },
      hobbies: ['painting', 'running'],
      houses: [
        {
          address: 'Address House1',
          firstHouse: true,
        },
        {
          address: 'Address House2',
          firstHouse: false,
        },
      ],
    });
  });

  it('evalTwoConditions', () => {
    let result = evalTwoConditions(true, true, 'fake-first-return', 'fake-second-return');
    expect(result).toStrictEqual('fake-first-return');
    result = evalTwoConditions(true, false, 'fake-first-return', 'fake-second-return');
    expect(result).toStrictEqual('fake-second-return');
  });

  it('evalThreeConditions', () => {
    let result = evalThreeConditions(
      true,
      true,
      false,
      'fake-first-return',
      'fake-second-return',
      'fake-third-return'
    );
    expect(result).toStrictEqual('fake-second-return');
    result = evalThreeConditions(
      true,
      false,
      false,
      'fake-first-return',
      'fake-second-return',
      'fake-third-return'
    );
    expect(result).toStrictEqual('fake-third-return');
    result = evalThreeConditions(
      true,
      true,
      true,
      'fake-first-return',
      'fake-second-return',
      'fake-third-return'
    );
    expect(result).toStrictEqual('fake-first-return');
  });

  it('formatNumber', () => {
    const result = formatNumber(123.45678923);
    expect(result).toStrictEqual(123.46);
  });

  describe('calcNumOfSeries', () => {
    it('inline', () => {
      const conf = {
        groupedType: 'inline',
      } as InternalGraphCongifuration<'histogram'>;
      const result = calcNumOfSeries(conf, data);
      expect(result).toStrictEqual(3);
    });

    it('not inline', () => {
      const conf = {
        groupedType: 'stacked',
      } as InternalGraphCongifuration<'histogram'>;
      const result = calcNumOfSeries(conf, data);
      expect(result).toStrictEqual(0);
    });
  });

  describe('calcMinAndMaxValues', () => {
    it('inline', () => {
      const conf = {
        groupedType: 'inline',
      } as InternalGraphCongifuration<'histogram'>;
      const result = calcMinAndMaxValues(conf, data);
      expect(result).toStrictEqual({ min: -56, max: 81 });
    });

    it('not inline', () => {
      const conf = {
        groupedType: 'stacked',
      } as InternalGraphCongifuration<'histogram'>;
      const result = calcMinAndMaxValues(conf, data);
      expect(result).toStrictEqual({ min: -86, max: 148 });
    });
  });
});
