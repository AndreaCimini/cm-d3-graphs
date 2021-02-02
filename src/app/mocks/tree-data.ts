export const TreeData = [
  {
    label: 'Top Level with a very very long text',
    node: {
      shape: 'square'
    },
    children: [
      {
        label: 'Level 2: A',
        children: [
          {
            label: 'Son of A with a very very long text' ,
            children: [
              {
                label: 'Son of son of A'
              },
              {
                label: 'Daughter of son of A'
              }
            ]
          },
          {
            label: 'Daughter of A',
            children: [
              {
                label: 'Son of son of A'
              },
              {
                label: 'Daughter of son of A'
              }
            ]
          }
        ]
      },
      {
        label: 'Level 2: B',
        node: {
          shape: 'rhombus'
        },
        children: [
          {
            label: 'Son of B with a very very long text'
          },
          {
            label: 'Daughter of B'
          }
        ]
      },
      {
        label: 'Level 2: B',
        children: [
          {
            label: 'Son of B',
            children: [
              {
                label: 'Daughter of A',
                children: [
                  {
                    label: 'Son of son of A'
                  },
                  {
                    label: 'Daughter of son of A'
                  }
                ]
              }
            ]
          },
          {
            label: 'Daughter of B'
          }
        ]
      }
    ]
  }
];
