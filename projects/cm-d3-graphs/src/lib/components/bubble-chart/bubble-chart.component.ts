import {
  ChangeDetectionStrategy,
  Component,
  ElementRef, EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit, Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';

import {BubbleChartGraphDataInterface} from '../../interfaces/graph-data.interface';
import {BubbleChartGraphConfigurationInterface} from '../../interfaces/graph-configuration.interface';
import {BaseCharts} from '../../core/base-charts';
import {D3UtilityService} from '../../services/d3-utility.service';

@Component({
  selector: 'cm-bubble-chart',
  templateUrl: './bubble-chart.component.html',
  styleUrls: ['./bubble-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BubbleChartComponent extends BaseCharts implements OnInit, OnChanges, OnDestroy {

  @ViewChild('bubbleChart', {static: true}) bubbleChart: ElementRef;

  @Input() graphData: BubbleChartGraphDataInterface[];
  @Input() graphConfigs: BubbleChartGraphConfigurationInterface;

  @Output() clickOnNode: EventEmitter<BubbleChartGraphConfigurationInterface> = new EventEmitter<BubbleChartGraphConfigurationInterface>();

  private nodeFocused;
  private nodeFocusedPosition: [number, number, number];

  constructor(private d3UtilityService: D3UtilityService, private renderer2: Renderer2) {
    super(renderer2);
  }

  ngOnInit() {
    if (this.graphConfigs && this.graphData) {
      // init variables
      this.initVariables();
      // get container dimension
      const graphContainer = this.bubbleChart.nativeElement;
      const width = graphContainer.clientWidth;
      const height = graphContainer.clientHeight;

      // create graph
      if (this.graphDataArranged.length > 0) {
        this.createGraph(width, height);
      }

      // init listeners
      this.initListeners(this.bubbleChart, this.graphConfigs);
    }
  }

  private initVariables() {
    // arrange configuration
    this.graphConfigs = this.d3UtilityService.arrangeConfigurations(this.graphConfigs) as BubbleChartGraphConfigurationInterface;
    // arrange data
    this.graphDataArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.graphData) as BubbleChartGraphDataInterface[];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.graphConfigs && !changes.graphConfigs.firstChange) || (changes.graphData && !changes.graphData.firstChange)) {
      // init variables
      this.initVariables();
      if (this.graphDataArranged && this.graphDataArranged.length > 0) {
        const g = d3.select(this.bubbleChart.nativeElement).select('#main-g');
        // create bubble
        const root = this.createBubble(g);
        // update listener
        const svg = d3.select(this.bubbleChart.nativeElement).select('#chart-container svg')
        svg.on('click', null); // remove previous listener
        svg.on('click', e => this.onClickNode(e, g, root, root, true)); // add new listener
        // scale to fit container
        this.fitGraph(this.bubbleChart, this.graphConfigs, 0);
      } else {
        // empty graph container
        d3.select(this.bubbleChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private calcColorGradient() {
    const calcMaxDepth = (data: BubbleChartGraphDataInterface) => {
      let depth = 0;
      if (data.children) {
        for (const d of data.children) {
          const tmpDepth = calcMaxDepth(d)
          if (tmpDepth > depth) {
            depth = tmpDepth;
          }
        }
      }
      return depth + 1;
    }
    // get the max depth
    const maxDepth = calcMaxDepth(this.graphDataArranged[0] as BubbleChartGraphDataInterface);

    return d3.scaleLinear<string>()
     .domain([0, maxDepth])
     .range([this.graphConfigs.nodes.backgroundStartColor, this.graphConfigs.nodes.backgroundEndColor])
     .interpolate(d3.interpolateHcl)
  }

  private toggleNodeCollapsedStatus(node) {
    // Collapse the node and all it's children
    if (node.children) {
      if (node.depth >= this.graphConfigs.nodes.maxInitialExpandedLevel) {
        node._children = node.children;
        node._children.forEach(this.toggleNodeCollapsedStatus.bind(this));
        node.children = null;
      } else {
        node.children.forEach(this.toggleNodeCollapsedStatus.bind(this));
      }
    }
  }

  private onClickNode(event, g, root, d, enableAnimation: boolean) {
    if (event) {
      event.stopPropagation();
    }
    if (this.graphConfigs.nodes.expandable && this.nodeFocused !== d) { // zoom in/out (expandable node)
      // remove children of last clicked node
      if (this.nodeFocused.depth >= this.graphConfigs.nodes.maxInitialExpandedLevel &&
        d.depth <= this.nodeFocused.depth && this.nodeFocused.children) {
        this.nodeFocused._children = this.nodeFocused.children;
        this.nodeFocused.children = null;
      }
      if (d._children) {
        // add children
        d.children = d._children;
        d._children = null;
      }
      // update nodes
      this.updateNodes(g, root);
      // update labels
      this.updateLabels(g, root);
      this.zoom(g, d, enableAnimation);
    } else if (d.children && this.nodeFocused !== d) { // zoom in/out (not expandable node)
      // zoom on clicked node
      this.zoom(g, d, enableAnimation);
    } else if (this.graphConfigs.events.clickOnElement) {
      // send event
      this.clickOnNode.emit(d.data);
    }
  }

  private addNodes(g, nodesData, root) {
    const color = this.calcColorGradient();
    // select all nodes
    const nodes = g.selectAll('.node')
      // the second parameter is a function that is used (here) to filter nodes
      // the result of selection compares the nodes previously added with new ones throughout the returned value of that function
      .data(nodesData, d => d.data.id);

    // Append circle for each node
    const nodesEnter = nodes.enter().append('circle')
      .attr('id', d => (d.data as BubbleChartGraphDataInterface).id)
      .attr('class', 'node')
      .attr('r', d => d.r)
      // the position of the node is calculated to position it in the svg and obtain a centered graph.
      // so, to get the position of the node respect to the center of the svg, we must remove the coordinates of the center of the svg from
      // the coordinates of the node. In this way we put the nodes in the main g element and after translate it to the center of the svg.
      .attr('transform', d => `translate(${d.x - this.graphWidth / 2}, ${d.y - this.graphHeight / 2})`);

    nodesEnter
      .attr('fill', d => color(d.depth))
      .attr('pointer-events', d => !d.children && !d._children ? 'none' : null)
      .style('cursor', d => d.children || d._children ? 'pointer' : '')
      .on('click', (e, d) => {
        this.onClickNode(e, g, root, d, true);
      })
      .on('mouseover', (e, d) => {
        const node = d3.select(e.currentTarget);
        node.attr('stroke', (d.data as BubbleChartGraphDataInterface).node.strokeColorOnHover);
        node.attr('stroke-width', 1);
      })
      .on('mouseout', e => {
        const node = d3.select(e.currentTarget);
        node.attr('stroke', null);
        node.attr('stroke-width', null);
      });
    return [nodes, nodesEnter];
  }

  private addLabels(g, nodesData, root) {
    // select all labels
    const labels = g.selectAll('.label')
      // the second parameter is a function that is used (here) to filter nodes
      // the result of selection compares the nodes previously added with new ones throughout the returned value of that function
      .data(nodesData, d => d.data.id);

    // Append g for each node
    const labelsEnter = labels.enter().append('g')
      .attr('id', d => 'label_' + (d.data as BubbleChartGraphDataInterface).id)
      .attr('class', 'label')
      // the position of the node is calculated to position it in the svg and obtain a centered graph.
      // so, to get the position of the node respect to the center of the svg, we must remove the coordinates of the center of the svg from
      // the coordinates of the node. In this way we put the nodes in the main g element and after translate it to the center of the svg.
      .attr('transform', d => `translate(${d.x - this.graphWidth / 2}, ${d.y - this.graphHeight / 2})`);

    // Append text for each node
    labelsEnter
      .append('text')
      .attr('text-anchor', 'middle')
      .style('dominant-baseline', 'middle')
      .style('fill', this.graphConfigs.label.color)
      .style('fill-opacity', d => d.parent === root ? 1 : 0)
      .style('display', d => d.parent === root ? 'inline' : 'none')
      .text(d => d.data.label)
      .on('click', (e, d) => {
        this.onClickNode(e, g, root, d, true);
      });

    return [labels, labelsEnter];
  }

  private manageBubbleNodes(g, root) {
    // remove old nodes
    g.selectAll('.node').remove();
    // remove old labels
    g.selectAll('.label').remove();
    // add new nodes
    this.addNodes(g, root.descendants().slice(1), root);
    // add labels
    this.addLabels(g, root.descendants().slice(1), root);
  }

  private updateNodes(g, root) {
    // get new nodes data
    const nodesData = root.descendants().slice(1);
    // add new nodes
    const [nodes, nodesEnter] = this.addNodes(g, nodesData, root);
    // update nodes (merge new node with existing ones)
    nodesEnter.merge(nodes);
    // Remove any exiting nodes (this is called when we zoom at a level less than maxInitialExpandedLevel)
    nodes.exit()
      .remove();
  }

  private updateLabels(g, root) {
    // get new nodes data
    const nodesData = root.descendants().slice(1);
    // add new labels
    const [labels, labelsEnter] = this.addLabels(g, nodesData, root);
    // update labels (merge new labels with existing ones)
    labelsEnter.merge(labels);
    // Remove any exiting labels (this is called when we zoom at a level less than maxInitialExpandedLevel)
    labels.exit()
      .remove();
  }

  private zoomTo(position: [number, number, number], g) {
    this.nodeFocusedPosition = position;
    const parent = (g.node() as SVGElement).parentElement;
    // get parent dimensions (height, width)
    const fullWidth = parent.clientWidth;
    const fullHeight = parent.clientHeight;
    // calc scale factor -> width / diameter of the node
    const scale = Math.min(this.graphWidth, this.graphHeight) / position[2];
    // calc translate factor
    const translate = [(fullWidth / 2) - (scale * (position[0] - this.graphWidth / 2)),
      (fullHeight / 2) - (scale * (position[1] - this.graphHeight / 2))];
    // translate the g center to node position
    g.attr('transform', 'translate(' + translate[0] + ',' + translate[1] + ')scale(' + scale + ')');
    // scale label
    const labels = g.selectAll('.label');
    labels.attr('transform', d => `translate(${d.x - this.graphWidth / 2}, ${d.y - this.graphHeight / 2})scale(${1 / scale})`);
  }

  private zoom(g, d, enableAnimation: boolean) {
    // update focus
    this.nodeFocused = d;

    const transition = g.transition()
      .duration(enableAnimation ? 750 : 0)
      .tween('zoom', () => {
        const i = d3.interpolateZoom(this.nodeFocusedPosition, [this.nodeFocused.x,
          this.nodeFocused.y, this.nodeFocused.r * 2]);
        return t => this.zoomTo(i(t), g);
      });

    // animate labels
    const labels = g.selectAll('.label').selectAll('text');
    labels
      .filter((n, i, nodes) => {
        const target = d3.select(nodes[i]).node();
        return n.parent === this.nodeFocused || target.style.display === 'inline';
      })
      .transition(transition)
      .style('fill-opacity', n => n.parent === this.nodeFocused ? 1 : 0)
      .on('start', (n, i, nodes) => {
        if (n.parent === this.nodeFocused) {
          const target = d3.select(nodes[i]).node();
          target.style.display = 'inline';
        }
      })
      .on('end', (n, i, nodes) => {
        if (n.parent !== this.nodeFocused) {
          const target = d3.select(nodes[i]).node();
          target.style.display = 'none';
        }
      });
  }

  private createBubble(g) {
    // call d3 hierarchy to fill the data with extra infos
    const hierarchyData = d3.hierarchy(this.graphDataArranged[0] as BubbleChartGraphDataInterface)
      .sum(d => d.value) // for each node calc the sum of the values of its children
      .sort((a, b) => b.value - a.value); // descending ordering
    // define root node using pack layout
    const root = d3.pack()
      .size([this.graphWidth, this.graphHeight])
      .padding(3)
      (hierarchyData);
    // Collapse after the nth level
    if (this.graphConfigs.nodes.expandable && this.graphConfigs.nodes.maxInitialExpandedLevel) {
      this.toggleNodeCollapsedStatus(root);
    }
    // set initial focus (the node on witch we have the zoom set) - at initial time it is the root node
    this.nodeFocused = root;
    this.nodeFocusedPosition = [root.x, root.y, root.r * 2];
    // add nodes
    this.manageBubbleNodes(g, root);
    return root;
  }

  private createGraph(width, height, nodeToFocusId?: string) {
    const svg = d3.select(this.bubbleChart.nativeElement).select('#chart-container')
      .append('svg:svg') // create the SVG element inside the container
      .attr('width', width) // set the width
      .attr('height', height); // set the height

    this.graphWidth = width - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = height - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);

    const g = svg
      .append('svg:g') // make a group to hold bubble chart
      .attr('id', 'main-g');

    // create bubble
    const root = this.createBubble(g);

    if (!nodeToFocusId) {
      // scale to fit container
      this.fitGraph(this.bubbleChart, this.graphConfigs, 0);
    } else {
      // zoom to current node
      const nodes = g.selectAll('.node');
      const newNodeSelection = nodes.filter(n => (n as any).data.id === nodeToFocusId);
      let newNode;
      if (newNodeSelection.size() > 0) {
        newNode = newNodeSelection.datum() as d3.HierarchyCircularNode<unknown>;
      }
      if (newNode) {
        this.onClickNode(null, g, root, newNode, false);
      } else {
        // scale to fit container
        this.fitGraph(this.bubbleChart, this.graphConfigs, 0);
      }
    }
    // add zoom event on svg
    svg.on('click', () => this.onClickNode(null, g, root, root, true));
  }

  protected reloadGraph(graphContainer: ElementRef, graphConfig: BubbleChartGraphConfigurationInterface) {
    const svg = d3.select(graphContainer.nativeElement).select('svg');
    svg.on('click', null); // remove previous listener
    // empty container
    svg.remove();
    // get container dimension
    const width = graphContainer.nativeElement.clientWidth;
    const height = graphContainer.nativeElement.clientHeight;
    this.createGraph(width, height, (this.nodeFocused as any).data.id);
  }

  ngOnDestroy(): void {
    // remove listeners
    this.removeListeners();
  }

}
