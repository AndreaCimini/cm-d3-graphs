export const FlowChartData = {
  nodes: [
    {
      id: 'a',
      label: 'Node1',
      node: {
        shape: 'square'
      }
    },
    {
      id: 'b',
      label: 'Node2'
    },
    {
      id: 'c',
      label: 'Node3'
    },
    {
      id: 'd',
      label: 'Node4 with a very very long text'
    },
    {
      id: 'e',
      label: 'Node5'
    },
    {
      id: 'f',
      label: 'Node6'
    },
    {
      id: 'g',
      label: 'Node7'
    },
    {
      id: 'h',
      label: 'Node8'
    },
    {
      id: 'i',
      label: 'Node9'
    },
    {
      id: 'l',
      label: 'Node10'
    },
    {
      id: 'm',
      label: 'Node11'
    },
    {
      id: 'n',
      label: 'Node12'
    },
    {
      id: 'o',
      label: 'Node13',
      node: {
        shape: 'rhombus'
      }
    },
    {
      id: 'p',
      label: 'Node14'
    },
    {
      id: 'q',
      label: 'Node15'
    }
  ],
  edges: [
    {
      source: 'a',
      target: 'b'
    },
    {
      source: 'a',
      target: 'c'
    },
    {
      source: 'c',
      target: 'd'
    },
    {
      source: 'c',
      target: 'e'
    },
    {
      source: 'b',
      target: 'f'
    },
    {
      source: 'b',
      target: 'g'
    },
    {
      source: 'g',
      target: 'h'
    },
    {
      source: 'g',
      target: 'i'
    },
    {
      source: 'e',
      target: 'l'
    },
    {
      source: 'l',
      target: 'm'
    },
    {
      source: 'l',
      target: 'n'
    },
    {
      source: 'i',
      target: 'o'
    },
    {
      source: 'o',
      target: 'l'
    },
    {
      source: 'f',
      target: 'h'
    },
    {
      source: 'c',
      target: 'p'
    },
  ],
  clusters: [
    {
      label: 'Fase 1',
      nodes: ['a', 'b', 'c', 'f', 'g', 'h', 'i'],
      cluster: {
        level: 0,
        label: {
          position: 'bottom-right'
        }
      }
    },
    {
      label: 'Fase 2',
      nodes: ['d', 'o', 'q'],
      cluster: {
        level: 2,
        label: {
          position: 'bottom-left'
        }
      }
    },
    {
      label: 'Fase 3',
      nodes: ['e', 'p'],
      cluster: {
        level: 1
      }
    },
    {
      label: 'Fase 4',
      nodes: ['l', 'm', 'n'],
      cluster: {
        level: 3
      }
    }
  ]
};
