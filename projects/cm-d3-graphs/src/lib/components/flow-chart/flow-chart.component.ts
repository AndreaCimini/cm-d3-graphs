import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
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
        if (changes.nodes && changes.nodes.previousValue.length === 0 && changes.edges && changes.edges.previousValue.length === 0 &&
          changes.clusters && changes.clusters.previousValue.length === 0) {
          // get container dimension
          const graphContainer = this.flowChart.nativeElement;
          const width = graphContainer.clientWidth;
          const height = graphContainer.clientHeight;
          // create graph
          this.createGraph(width, height);
        } else {
          const g = d3.select(this.flowChart.nativeElement).select('#main-g');
          // create tree
          this.createFlowChart(g);
        }
        /*
        if (this.graphConfigs.zoom) {
          // add zoom
          this.zoomListener = this.addZoom(g, this.flowChart, this.graphConfigs);
        } else {
          // scale to fit container
          this.fitGraph(this.flowChart, this.graphConfigs, 0);
        }*/
      } else {
        // empty graph container
        d3.select(this.flowChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private fullSpaceClusterAdjustment() {
    // order cluster by level
    const clusterByLevel = this.clustersArranged.sort((a: FlowChartGraphDataInterface, b: FlowChartGraphDataInterface) => {
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
    // returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
    const intersects = (q1, q2, p1, p2): boolean => {
      return (q1 >= p1 && q1 <= p2) || (q2 >= p1 && q1 <= p2) || (p1 >= q1 && p1 <= q2);
    };
    let previousCluster = null;
    let positionBeforeUpdate = null;
    const movedNodes = [];
    // update cluster dimension
    for (const cluster of clusterByLevel) {
      // for full space cluster, adjust dimensions and position
      if (this.graphConfigs.orientation === 'vertical') {
        cluster['x'] = (minCord + maxCord) / 2; // tslint:disable-line
        cluster['width'] = maxCord - minCord; // tslint:disable-line
      } else {
        cluster['y'] = (minCord + maxCord) / 2; // tslint:disable-line
        cluster['height'] = maxCord - minCord; // tslint:disable-line
      }
      // move all clusters that intersect previous ones
      // the first cluster isn't moved
      if (previousCluster) {
        if (this.graphConfigs.orientation === 'vertical' &&
          (intersects(cluster['y'], cluster['y'] + cluster['height'], previousCluster['y'], previousCluster['y'] + previousCluster['height']) || // tslint:disable-line
          cluster['y'] - previousCluster['y'] - previousCluster['height'] > this.graphConfigs.nodes.distanceBetweenParentAndChild) || // tslint:disable-line
          cluster['y'] + cluster['height'] <= previousCluster['y']) { // tslint:disable-line
          positionBeforeUpdate = cluster['y']; // tslint:disable-line
          cluster['y'] = previousCluster['y'] + previousCluster['height'] / 2 + cluster['height'] / 2 + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
        } else if (this.graphConfigs.orientation === 'horizontal' &&
          (intersects(cluster['x'], cluster['x'] + cluster['width'], previousCluster['x'], previousCluster['x'] + previousCluster['width']) || // tslint:disable-line
          cluster['x'] - previousCluster['x'] - previousCluster['width'] > this.graphConfigs.nodes.distanceBetweenParentAndChild) || // tslint:disable-line
          cluster['x'] + cluster['width'] <= previousCluster['x']) { // tslint:disable-line
          positionBeforeUpdate = cluster['x']; // tslint:disable-line
          cluster['x'] = previousCluster['x'] + previousCluster['width'] / 2 + cluster['width'] / 2 + this.graphConfigs.nodes.distanceBetweenParentAndChild; // tslint:disable-line
        } else {
          positionBeforeUpdate = null;
        }
      }
      // set previous cluster equal to current one
      previousCluster = cluster;
      if (positionBeforeUpdate) {
        // if there was a movement, move all the nodes in the the current cluster
        for (const node of this.nodesArranged) {
          if (this.graphConfigs.orientation === 'vertical' && cluster.nodes.indexOf(node.id) > -1) { // tslint:disable-line
            const delta = cluster['y'] - positionBeforeUpdate; // tslint:disable-line
            node['y'] += delta; // tslint:disable-line
            if (delta !== 0) {
              movedNodes.push({id: node.id, delta});
            }
          } else if (this.graphConfigs.orientation === 'horizontal' && cluster.nodes.indexOf(node.id) > -1) { // tslint:disable-line
            const delta = cluster['x'] - positionBeforeUpdate; // tslint:disable-line
            node['x'] += delta; // tslint:disable-line
            if (delta !== 0) {
              movedNodes.push({id: node.id, delta});
            }
          }
        }
        // if there was a movement, move all the links that link nodes in the the current cluster
        for (const edge of this.edgesArranged) {
          if (this.graphConfigs.orientation === 'vertical' && cluster.nodes.indexOf(edge.target) > -1) {
            const delta = cluster['y'] - positionBeforeUpdate; // tslint:disable-line
            edge['points'].forEach((point, index) => { // tslint:disable-line
              // if current edge starts and end in current cluster, move all points
              // else check if source node has moved or not. In the second case, leave start point untouched
              if (cluster.nodes.indexOf(edge.source) > -1) {
                point.y += point.y >= positionBeforeUpdate - cluster['height'] / 2 ? delta : 0; // tslint:disable-line
              } else {
                const nodeMoved = movedNodes.find(n => n.id === edge.source);
                if (nodeMoved) {
                  point.y += nodeMoved.delta;
                } else {
                  point.y += index > 0 && point.y >= positionBeforeUpdate - cluster['height'] / 2 ? delta : 0; // tslint:disable-line
                }
              }
            });
          } else if (this.graphConfigs.orientation === 'horizontal' && cluster.nodes.indexOf(edge.target) > -1) {
            const delta = cluster['x'] - positionBeforeUpdate; // tslint:disable-line
            edge['points'].forEach((point, index) => { // tslint:disable-line
              // if current edge starts and end in current cluster, move all points
              // else check if source node has moved or not. In the second case, leave start point untouched
              if (cluster.nodes.indexOf(edge.source) > -1) {
                point.x += point.x >= positionBeforeUpdate - cluster['width'] / 2 ? delta : 0; // tslint:disable-line
              } else {
                const nodeMoved = movedNodes.find(n => n.id === edge.source);
                if (nodeMoved) {
                  point.x += nodeMoved.delta;
                } else {
                  point.x += index > 0 && point.x >= positionBeforeUpdate - cluster['width'] / 2 ? delta : 0; // tslint:disable-line
                }
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
        // in this case, we consider the square inscribed in the circle
        nodeHeight = d.node.circleRadius * 2;
        nodeWidth = d.node.circleRadius * 2;
      } else if (d.node.shape === 'rect') {
        // label correction
        nodeHeight = d.node.rectangleDimensions.height +
          this.graphConfigs.label.padding.top + this.graphConfigs.label.padding.bottom;
        nodeWidth = d.node.rectangleDimensions.width +
          this.graphConfigs.label.padding.left + this.graphConfigs.label.padding.right;
      } else if (d.node.shape === 'square') {
        // label correction
        nodeHeight = d.node.squareDimensions + labelPadding;
        nodeWidth = d.node.squareDimensions + labelPadding;
      } else if (d.node.shape === 'rhombus') {
        // label correction
        nodeHeight = (d.node.rhombusDimensions * Math.sqrt(2)) + labelPadding;
        nodeWidth = (d.node.rhombusDimensions * Math.sqrt(2)) + labelPadding;
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
    this.edgesArranged = this.edgesArranged.map(e => {
      const edge = {...e, points: graph.edge({v: e.source, w: e.target}).points};
      // fix start and/or end point if start and/or end node is a circle
      const startNode = this.nodesArranged.find(n => n.id === edge.source);
      const endNode = this.nodesArranged.find(n => n.id === edge.target);
      // only links that are not aligned with node center, need correction
      if (startNode.node.shape === 'circle' && startNode['x'] !== edge.points[0].x && startNode['y'] !== edge.points[0].y) { // tslint:disable-line
        const distanceFromPointToCenter = Math.sqrt(Math.pow(edge.points[0].x - startNode['x'], 2) + // tslint:disable-line
          Math.pow(edge.points[0].y - startNode['y'], 2)); // tslint:disable-line
        const sinOfAngleWithHorizontalLine = (edge.points[0].y - startNode['y']) / distanceFromPointToCenter; // tslint:disable-line
        const cosOfAngleWithHorizontalLine = (edge.points[0].x - startNode['x']) / distanceFromPointToCenter; // tslint:disable-line
        edge.points[0].x = startNode.node.circleRadius * cosOfAngleWithHorizontalLine + startNode['x']; // tslint:disable-line
        edge.points[0].y = startNode.node.circleRadius * sinOfAngleWithHorizontalLine + startNode['y']; // tslint:disable-line
      }
      if (endNode.node.shape === 'circle' && endNode['x'] !== edge.points[edge.points.length - 1].x && // tslint:disable-line
        endNode['y'] !== edge.points[edge.points.length - 1].y) { // tslint:disable-line
        const distanceFromPointToCenter = Math.sqrt(Math.pow(endNode['x'] - edge.points[edge.points.length - 1].x, 2) + // tslint:disable-line
          Math.pow(endNode['y'] - edge.points[edge.points.length - 1].y, 2)); // tslint:disable-line
        const sinOfAngleWithHorizontalLine = (endNode['y'] - edge.points[edge.points.length - 1].y) / distanceFromPointToCenter; // tslint:disable-line
        const cosOfAngleWithHorizontalLine = (endNode['x'] - edge.points[edge.points.length - 1].x) / distanceFromPointToCenter; // tslint:disable-line
        edge.points[edge.points.length - 1].x = endNode['x'] - endNode.node.circleRadius * cosOfAngleWithHorizontalLine; // tslint:disable-line
        edge.points[edge.points.length - 1].y = endNode['y'] - endNode.node.circleRadius * sinOfAngleWithHorizontalLine; // tslint:disable-line
      }
      return edge;
    });
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
    if (this.graphConfigs.links.shape === 'straight') {
      let path = 'M ';
      for (const point of d.data.points) {
        path += point.x + ' ' + point.y + ',';
      }
      return path;
    }
    return d3.line()
      .x(p => p['x']) // tslint:disable-line
      .y(p => p['y']) // tslint:disable-line
      .curve(d3.curveBasis)
      (d.data.points);
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
      .attr('transform', d => 'translate(' +
        (this.graphConfigs.clusters.shape === 'rectangle' ? (d.x - d.width / 2) : d.x) + ',' +
        (this.graphConfigs.clusters.shape === 'rectangle' ? (d.y - d.height / 2) : d.y) + ')');
    // append rect or ellipse
    const shape = cluster
      .append(this.graphConfigs.clusters.shape === 'rectangle' ? 'rect' : 'ellipse')
      .style('fill', d => d.cluster.fillColor)
      .style('stroke', d => d.cluster.strokeColor);

    if (this.graphConfigs.clusters.shape === 'rectangle') {
      shape
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 4)
        .attr('ry', 4);
    } else {
      shape
        .attr('rx', d => d.width / 2)
        .attr('ry', d => d.height / 2);
    }
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
          return this.graphConfigs.clusters.shape === 'rectangle' ? d.width / 2 : 0;
        } else if (d.cluster.label.position === 'left' || d.cluster.label.position === 'top-left' ||
          d.cluster.label.position === 'bottom-left') {
          return this.graphConfigs.clusters.shape === 'rectangle' ? this.graphConfigs.clusters.label.padding.left :
            (this.graphConfigs.clusters.label.padding.left - d.width / 2);
        } else if (d.cluster.label.position === 'right' || d.cluster.label.position === 'top-right' ||
          d.cluster.label.position === 'bottom-right') {
          return (this.graphConfigs.clusters.shape === 'rectangle' ? d.width : d.width / 2) -
            this.graphConfigs.clusters.label.padding.right;
        }
      })
      .attr('y', d => {
        if (d.cluster.label.position === 'center' || d.cluster.label.position === 'left' || d.cluster.label.position === 'right') {
          return this.graphConfigs.clusters.shape === 'rectangle' ? d.height / 2 : 0;
        } else if (d.cluster.label.position === 'bottom' || d.cluster.label.position === 'bottom-left' ||
          d.cluster.label.position === 'bottom-right') {
          return (this.graphConfigs.clusters.shape === 'rectangle' ? d.height : d.height / 2) -
            this.graphConfigs.clusters.label.padding.bottom;
        } else if (d.cluster.label.position === 'top' || d.cluster.label.position === 'top-left' ||
          d.cluster.label.position === 'top-right') {
          return this.graphConfigs.clusters.shape === 'rectangle' ? this.graphConfigs.clusters.label.padding.top :
            (this.graphConfigs.clusters.label.padding.top - d.height / 2);
        }
      })
      .attr('fill', d => d.cluster.label.color)
      .text(d => d.label);
  }

  private createFlowChart(g) {
    // create dagre graph
    this.createDagreGraph();
    // add clusters
    if (this.clustersArranged) {
      this.addClusters(g);
    } else {
      // remove old clusters
      g.selectAll('.cluster').remove();
    }
    // compute links
    this.manageLinks(g);
    // compute nodes
    this.manageNodes(g);
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
