import { InternalGraphCongifuration } from '../../types/graphConfiguration';

describe('Test grid utility functions', () => {
  const conf = {
    groupedType: 'stacked',
  } as InternalGraphCongifuration<'histogram'>;

  it('createGrid', () => {
    console.log(conf);
  });
});
