import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input, OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2, SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';
import * as dagre from 'dagre';

import {D3UtilityService} from '../../services/d3-utility.service';
import {FlowChartGraphConfigurationInterface} from '../../interfaces/graph-configuration.interface';
import {FlowChartGraphDataInterface} from '../../interfaces/graph-data.interface';
import {BaseNodesCharts} from '../../core/base-nodes-chart';

@Component({
  selector: 'cm-flow-chart',
  templateUrl: './flow-chart.component.html',
  styleUrls: ['./flow-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowChartComponent extends BaseNodesCharts implements OnInit, OnChanges, OnDestroy {

  @ViewChild('flowChart', {static: true}) flowChart: ElementRef;

  @Input() nodes: FlowChartGraphDataInterface[];
  @Input() edges: FlowChartGraphDataInterface[];
  @Input() clusters: FlowChartGraphDataInterface[];
  @Input() graphConfigs: FlowChartGraphConfigurationInterface;

  @Output() clickOnNode: EventEmitter<FlowChartGraphDataInterface> = new EventEmitter<FlowChartGraphDataInterface>();

  private nodesArranged: FlowChartGraphDataInterface[];
  private edgesArranged: FlowChartGraphDataInterface[];
  private clustersArranged: FlowChartGraphDataInterface[];
  private zoomListener;
  // Define the arrowhead marker variables
  private markerBoxWidth = 10;
  private markerBoxHeight = 10;
  private refX = this.markerBoxWidth;
  private refY = this.markerBoxHeight / 2;
  private arrowPoints = [[0, 0], [0, this.markerBoxWidth], [this.markerBoxHeight, this.markerBoxWidth / 2]];

  constructor(private d3UtilityService: D3UtilityService, private renderer2: Renderer2) {
    super(renderer2);
  }

  ngOnInit(): void {
    if (this.graphConfigs && this.nodes && this.edges) {
      // init variables
      this.initVariables();
      // get container dimension
      const graphContainer = this.flowChart.nativeElement;
      const width = graphContainer.clientWidth;
      const height = graphContainer.clientHeight;

      // create graph
      if (this.graphDataArranged.length > 0) {
        this.createGraph(width, height);
      }

      // init listeners
      this.initListeners(this.flowChart, this.graphConfigs);
    }
  }

  private initVariables() {
    // arrange configuration
    this.graphConfigs = this.d3UtilityService.arrangeConfigurations(this.graphConfigs) as FlowChartGraphConfigurationInterface;
    // arrange data
    this.nodesArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.nodes) as FlowChartGraphDataInterface[];
    this.edgesArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.edges) as FlowChartGraphDataInterface[];
    // concat data to manage some base features
    this.graphDataArranged = this.nodesArranged.concat(this.edgesArranged);
    if (this.clusters && this.clusters.length > 0) {
      this.clustersArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.clusters) as FlowChartGraphDataInterface[];
    } else {
      this.clustersArranged = undefined;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.graphConfigs && !changes.graphConfigs.firstChange) || (changes.nodes && !changes.nodes.firstChange) ||
      (changes.edges && !changes.edges.firstChange) || (changes.clusters && !changes.clusters.firstChange)) {
      // init variables
      this.initVariables();
      if (this.graphDataArranged && this.graphDataArranged.length > 0) {
        const g = d3.select(this.flowChart.nativeElement).select('#main-g');
        // create tree
        this.createFlowChart(g);
        if (this.graphConfigs.zoom) {
          // add zoom
          this.zoomListener = this.addZoom(g, this.flowChart, this.graphConfigs);
        } else {
          // scale to fit container
          this.fitGraph(this.flowChart, this.graphConfigs, 0);
        }
      } else {
        // empty graph container
        d3.select(this.flowChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private fullSpaceClusterAdjustment() {
    // order cluster by level
    const clusterByLevel= this.clustersArranged.sort((a: FlowChartGraphDataInterface, b: FlowChartGraphDataInterface) => {
      if (a.cluster.level < b.cluster.level) {
        return -1;
      }
      if (a.cluster.level > b.cluster.level) {
        return 1;
      }
      return 0;
    });
    const nodes = this.nodesArranged.concat(clusterByLevel);
    // calc min and max x/y (vertical/horizontal orientation)
    let minCord = this.graphConfigs.orientation === 'vertical' ? (nodes[0]['x'] - nodes[0]['width'] / 2) : // tslint:disable-line
      (nodes[0]['y'] - nodes[0]['height'] / 2); // tslint:disable-line
    let maxCord = this.graphConfigs.orientation === 'vertical' ? (nodes[0]['x'] + nodes[0]['width'] / 2) : // tslint:disable-line
      (nodes[0]['y'] + nodes[0]['height'] / 2); // tslint:disable-line
    for (const node of nodes) {
      const currentMinCord = this.graphConfigs.orientation === 'vertical' ? (node['x'] - node['width'] / 2) : // tslint:disable-line
        (node['y'] - node['height'] / 2); // tslint:disable-line
      const currentMaxCord = this.graphConfigs.orientation === 'vertical' ? (node['x'] + node['width'] / 2) : // tslint:disable-line
        (node['y'] + node['height'] / 2); // tslint:disable-line
      minCord = Math.min(minCord, currentMinCord);
      maxCord = Math.max(maxCord, currentMaxCord);
    }
    // update cluster dimension
    for (const cluster of clusterByLevel) {
      // check if there are clusters that intersect with current one
      const intersectClusters = clusterByLevel.filter(c => {
        let intersectBool;
        if (this.graphConfigs.orientation === 'vertical') {
          const topSide =  c['y'] - c['height'] / 2; // tslint:disable-line
          const bottomSide =  c['y'] + c['height'] / 2; // tslint:disable-line
          const currentTopSide =  cluster['y'] - cluster['height'] / 2; // tslint:disable-line
          const currentBottomSide =  cluster['y'] + cluster['height'] / 2; // tslint:disable-line
          intersectBool = (topSide >= currentTopSide && topSide <= currentBottomSide) || // tslint:disable-line
            (bottomSide >= currentTopSide && bottomSide <= currentBottomSide); // tslint:disable-line
        } else {
          const leftSide =  c['x'] - c['width'] / 2; // tslint:disable-line
          const rightSide =  c['x'] + c['width'] / 2; // tslint:disable-line
          const currentLeftSide =  cluster['x'] - cluster['width'] / 2; // tslint:disable-line
          const currentRightSide =  cluster['x'] + cluster['width'] / 2; // tslint:disable-line
          intersectBool = (leftSide >= currentLeftSide && leftSide <= currentRightSide) || // tslint:disable-line
            (rightSide >= currentLeftSide && rightSide <= currentRightSide); // tslint:disable-line
        }
        return c.id !== cluster.id && intersectBool;
      });
      if (this.graphConfigs.orientation === 'vertical') {
        cluster['x'] = (minCord + maxCord) / 2; // tslint:disable-line
        cluster['width'] = maxCord - minCord; // tslint:disable-line
      } else {
        cluster['y'] = (minCord + maxCord) / 2; // tslint:disable-line
        cluster['height'] = maxCord - minCord; // tslint:disable-line
      }
      if (intersectClusters && intersectClusters.length > 0) {
        // move all the nodes, that follow the current cluster, of one level
        for (const node of this.nodesArranged) {
          if (this.graphConfigs.orientation === 'vertical' && node['y'] >= cluster['y'] && cluster.nodes.indexOf(node.id) === -1) { // tslint:disable-line
            node['y'] += cluster['height'] + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
          } else if (this.graphConfigs.orientation === 'horizontal' && node['x'] >= cluster['x'] && cluster.nodes.indexOf(node.id) === -1) { // tslint:disable-line
            node['x'] += cluster['width'] + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
          }
        }
        // move all following clusters
        for (const oCluster of clusterByLevel) {
          if (this.graphConfigs.orientation === 'vertical' && oCluster['y'] >= cluster['y'] && oCluster.id !== cluster.id) { // tslint:disable-line
            oCluster['y'] += cluster['height'] + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
          } else if (this.graphConfigs.orientation === 'horizontal' && oCluster['x'] >= cluster['x'] && oCluster.id !== cluster.id) { // tslint:disable-line
            oCluster['x'] += cluster['width'] + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
          }
        }
        // move all following links
        for (const edge of this.edgesArranged) {
          if (this.graphConfigs.orientation === 'vertical' &&
            // exclude all path that end in current cluster
            cluster.nodes.indexOf(edge.target) === -1) {
            edge['points'].forEach((point, index: number) => { // tslint:disable-line
              if (point.y >= cluster['y'] - cluster['height'] / 2 && cluster.nodes.indexOf(edge.source) === -1 || // tslint:disable-line
                // leave start point untouched if it comes from a node in current cluster
                (cluster.nodes.indexOf(edge.source) !== -1 && index !== 0)) {
                point.y += cluster['height'] + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
              }
            });
          } else if (this.graphConfigs.orientation === 'horizontal' &&
            // exclude all path that end in current cluster
            cluster.nodes.indexOf(edge.target) === -1) {
            edge['points'].forEach((point, index: number) => { // tslint:disable-line
              if (point.x >= cluster['x'] - cluster['width'] / 2 && cluster.nodes.indexOf(edge.source) === -1 || // tslint:disable-line
                // leave start point untouched if it comes from a node in current cluster
                (cluster.nodes.indexOf(edge.source) !== -1 && index !== 0)) {
                point.x += cluster['width'] + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
              }
            });
          }
        }
      }
    }
  }

  private createDagreGraph() {
    // Create a new directed graph
    const graph = new dagre.graphlib.Graph({compound: true}).setGraph({});
    // Set an object for the graph label
    graph.setGraph({
      rankdir: this.graphConfigs.orientation === 'vertical' ? 'TB' : 'LR', // graph orientation
      nodesep: this.graphConfigs.nodes.distanceBetweenBrothers, // horizontal separation between nodes
      ranksep: this.graphConfigs.nodes.distanceBetweenParentAndChild // vertical separation between nodes
    });
    // Default to assigning a new object as a label for each new edge.
    graph.setDefaultEdgeLabel(() => ({}));
    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    for (const d of this.nodesArranged) {
      let nodeHeight;
      let nodeWidth;
      const labelPadding = Math.max(this.graphConfigs.label.padding.left + this.graphConfigs.label.padding.right,
        this.graphConfigs.label.padding.top + this.graphConfigs.label.padding.bottom);
      if (d.node.shape === 'circle') {
        // no label correction because it is outside the node
        nodeHeight = this.graphConfigs.nodes.circleRadius * 2;
        nodeWidth = this.graphConfigs.nodes.circleRadius * 2;
      } else if (d.node.shape === 'rect') {
        // label correction
        nodeHeight = this.graphConfigs.nodes.rectangleDimensions.height +
          this.graphConfigs.label.padding.top + this.graphConfigs.label.padding.bottom;
        nodeWidth = this.graphConfigs.nodes.rectangleDimensions.width +
          this.graphConfigs.label.padding.left + this.graphConfigs.label.padding.right;
      } else if (d.node.shape === 'square') {
        // label correction
        nodeHeight = this.graphConfigs.nodes.squareDimensions + labelPadding;
        nodeWidth = this.graphConfigs.nodes.squareDimensions + labelPadding;
      } else if (d.node.shape === 'rhombus') {
        // label correction
        nodeHeight = (this.graphConfigs.nodes.rhombusDimensions * Math.sqrt(2)) + labelPadding;
        nodeWidth = (this.graphConfigs.nodes.rhombusDimensions * Math.sqrt(2)) + labelPadding;
      }
      graph.setNode(d.id, {label: d.label, width: nodeWidth, height: nodeHeight});
    }
    // Add edges to the graph.
    for (const edge of this.edgesArranged) {
      graph.setEdge(edge.source, edge.target);
    }
    // add clusters
    if (this.clustersArranged) {
      const clusters = this.clustersArranged;
      // loop over clusters
      for (const cluster of clusters) {
        graph.setNode(cluster.id, {label: cluster.label, clusterLabelPos: 'bottom'});
        // set the parents to define which nodes belong to which cluster
        // check nested cluster (some children of current cluster are the same of another cluster)
        const nestedClusters = this.clustersArranged.filter(c => {
          const commonNodes = c.nodes.filter(n => cluster.nodes.indexOf(n) > -1);
          // take cluster only if all of the nodes of that cluster are contained in current cluster
          return c.id !== cluster.id && commonNodes.length === c.nodes.length;
        });
        for (const node of cluster.nodes) {
          // check if node is in a nested cluster
          let nestedClusterIndex = -1;
          if (nestedClusters && nestedClusters.length > 0) {
            nestedClusterIndex = nestedClusters.findIndex(c => c.nodes.indexOf(node) > -1);
          }
          if (nestedClusterIndex > -1) {
            graph.setParent(nestedClusters[nestedClusterIndex].id, cluster.id);
          } else {
            graph.setParent(node, cluster.id);
          }
        }
      }
    }
    // create layout
    dagre.layout(graph);
    // enrich nodes and links with position
    this.nodesArranged = this.nodesArranged.map(n => ({
      ...n, x: graph.node(n.id).x, y: graph.node(n.id).y, width: graph.node(n.id).width,
      height: graph.node(n.id).height
    }));
    this.edgesArranged = this.edgesArranged.map(e => ({...e, points: graph.edge({v: e.source, w: e.target}).points}));
    // enrich clusters with position and dimension
    if (this.clustersArranged) {
      this.clustersArranged = this.clustersArranged.map(c => ({
        ...c, x: graph.node(c.id).x, y: graph.node(c.id).y,
        width: graph.node(c.id).width, height: graph.node(c.id).height
      }));
    }
    // adjust node position if cluster position is full space
    if (this.graphConfigs.clusters.position === 'full-space' && this.clustersArranged) {
      this.fullSpaceClusterAdjustment();
    }
  }

  private manageNodes(g) {
    // remove old nodes
    g.selectAll('.node').remove();
    const nodesData = this.nodesArranged.map(n => ({data: n}));
    // add nodes
    const nodesAdded = this.addNodes(g, nodesData, this.graphConfigs);
    // translate nodes
    nodesAdded.nodesEnter
      .attr('transform', d => {
        // ok for circle shape
        let xPosition = d.data.x;
        let yPosition = d.data.y;
        // for others shape
        if ((d.data as FlowChartGraphDataInterface).node.shape === 'rect' ||
          (d.data as FlowChartGraphDataInterface).node.shape === 'square') {
          xPosition -= d.width / 2;
          yPosition -= d.height / 2;
        } else if ((d.data as FlowChartGraphDataInterface).node.shape === 'rhombus') {
          yPosition -= d.height / 2;
        }
        return 'translate(' + xPosition + ',' + yPosition + ')';
      });
    // center text element
    this.centerNodeText(nodesAdded.nodesEnter, this.graphConfigs);
    // add click event
    nodesAdded.nodesEnter
      .style('cursor', () => this.graphConfigs.events.clickOnElement ? 'pointer' : '')
      .on('click', (e, d) => this.graphConfigs.events.clickOnElement ? this.clickOnNode.emit(d.data) : null);
  }

  private diagonal(d) {
    let path = 'M';
    for (const point of d.data.points) {
      path += point.x + ' ' + point.y + ',';
    }
    return path;
  }

  private manageLinks(g) {
    // remove old links
    g.selectAll('.link').remove();
    const linksData = this.edgesArranged.map(e => ({data: e}));
    // add links
    const linksAdded = this.addLinks(g, linksData, this.graphConfigs, this.markerBoxHeight, this.markerBoxWidth, this.refX, this.refY,
      this.arrowPoints);

    // Creates a curved (diagonal) path from parent to the child nodes
    linksAdded.linksEnter
      .attr('d', d => this.diagonal(d));
  }

  private addClusters(g) {
    // remove old clusters
    g.selectAll('.cluster').remove();
    // add cluster
    const cluster = g.selectAll('.cluster')
      .data(this.clustersArranged)
      .enter()
      .insert('g', '.node')
      .attr('id', d => d.id)
      .attr('class', 'cluster')
      .attr('transform', d => 'translate(' + (d.x - d.width / 2) + ',' + (d.y - d.height / 2) + ')');
    // append rect
    cluster
      .append('rect')
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('fill', d => d.cluster.fillColor)
      .style('stroke', d => d.cluster.strokeColor);
    // append text
    cluster
      .append('text')
      .style('dominant-baseline', d => {
        if (d.cluster.label.position === 'center' || d.cluster.label.position === 'left' || d.cluster.label.position === 'right') {
          return 'middle';
        } else if (d.cluster.label.position === 'bottom' || d.cluster.label.position === 'bottom-left' ||
          d.cluster.label.position === 'bottom-right') {
          return 'text-after-edge';
        } else if (d.cluster.label.position === 'top' || d.cluster.label.position === 'top-left' ||
          d.cluster.label.position === 'top-right') {
          return 'text-before-edge';
        }
      })
      .style('text-anchor', d => {
        if (d.cluster.label.position === 'center' || d.cluster.label.position === 'top' || d.cluster.label.position === 'bottom') {
          return 'middle';
        } else if (d.cluster.label.position === 'left' || d.cluster.label.position === 'top-left' ||
          d.cluster.label.position === 'bottom-left') {
          return 'start';
        } else if (d.cluster.label.position === 'right' || d.cluster.label.position === 'top-right' ||
          d.cluster.label.position === 'bottom-right') {
          return 'end';
        }
      })
      .style('font-size', this.graphConfigs.clusters.label['font-size'])
      .attr('x', d => {
        if (d.cluster.label.position === 'center' || d.cluster.label.position === 'top' || d.cluster.label.position === 'bottom') {
          return d.width / 2;
        } else if (d.cluster.label.position === 'left' || d.cluster.label.position === 'top-left' ||
          d.cluster.label.position === 'bottom-left') {
          return this.graphConfigs.clusters.label.padding.left;
        } else if (d.cluster.label.position === 'right' || d.cluster.label.position === 'top-right' ||
          d.cluster.label.position === 'bottom-right') {
          return d.width - this.graphConfigs.clusters.label.padding.right;
        }
      })
      .attr('y', d => {
        if (d.cluster.label.position === 'center' || d.cluster.label.position === 'left' || d.cluster.label.position === 'right') {
          return d.height / 2;
        } else if (d.cluster.label.position === 'bottom' || d.cluster.label.position === 'bottom-left' ||
          d.cluster.label.position === 'bottom-right') {
          return d.height - this.graphConfigs.clusters.label.padding.bottom;
        } else if (d.cluster.label.position === 'top' || d.cluster.label.position === 'top-left' ||
          d.cluster.label.position === 'top-right') {
          return this.graphConfigs.clusters.label.padding.top;
        }
      })
      .attr('fill', d => d.cluster.label.color)
      .text(d => d.label);
  }

  private createFlowChart(g) {
    // create dagre graph
    this.createDagreGraph();
    // compute nodes
    this.manageNodes(g);
    // compute links
    this.manageLinks(g);
    // add clusters
    if (this.clustersArranged) {
      this.addClusters(g);
    } else {
      // remove old clusters
      g.selectAll('.cluster').remove();
    }
    // add zoom
    if (this.graphConfigs.zoom) {
      this.zoomListener = this.addZoom(g, this.flowChart, this.graphConfigs);
    } else {
      // scale to fit container
      this.fitGraph(this.flowChart, this.graphConfigs, 0);
    }
  }

  private createGraph(width: number, height: number) {
    const svg = d3.select(this.flowChart.nativeElement).select('#chart-container')
      .append('svg:svg') // create the SVG element inside the container
      .attr('width', width) // set the width
      .attr('height', height); // set the height

    this.graphWidth = width - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = height - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);

    const g = svg
      .append('svg:g') // make a group to hold tree chart
      .attr('id', 'main-g');

    // create tree
    this.createFlowChart(g);
  }

  ngOnDestroy(): void {
    // remove listeners
    this.removeListeners();
  }

}
