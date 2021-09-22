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

import {TreeGraphConfigurationInterface} from '../../interfaces/graph-configuration.interface';
import {D3UtilityService} from '../../services/d3-utility.service';
import {TreeGraphDataInterface} from '../../interfaces/graph-data.interface';
import {BaseNodesCharts} from '../../core/base-nodes-chart';

@Component({
  selector: 'cm-tree-chart',
  templateUrl: './tree-chart.component.html',
  styleUrls: ['./tree-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeChartComponent extends BaseNodesCharts implements OnInit, OnChanges, OnDestroy {

  @ViewChild('treeChart', {static: true}) treeChart: ElementRef;

  @Input() graphData: TreeGraphDataInterface[];
  @Input() graphConfigs: TreeGraphConfigurationInterface;

  @Output() clickOnNode: EventEmitter<TreeGraphDataInterface> = new EventEmitter<TreeGraphDataInterface>();

  private animationDuration = 750;
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
    if (this.graphConfigs && this.graphData) {
      // init variables
      this.initVariables();
      // get container dimension
      const graphContainer = this.treeChart.nativeElement;
      const width = graphContainer.clientWidth;
      const height = graphContainer.clientHeight;

      // create graph
      if (this.graphDataArranged.length > 0) {
        this.createGraph(width, height);
      }

      // init listeners
      this.initListeners(this.treeChart, this.graphConfigs);
    }
  }

  private initVariables() {
    // arrange configuration
    this.graphConfigs = this.d3UtilityService.arrangeConfigurations(this.graphConfigs) as TreeGraphConfigurationInterface;
    // arrange data
    this.graphDataArranged = this.d3UtilityService.arrangeData(this.graphConfigs, this.graphData) as TreeGraphDataInterface[];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.graphConfigs && !changes.graphConfigs.firstChange) || (changes.graphData && !changes.graphData.firstChange)) {
      // init variables
      this.initVariables();
      if (this.graphDataArranged && this.graphDataArranged.length > 0) {
        const g = d3.select(this.treeChart.nativeElement).select('#main-g');
        // create tree
        this.createTree(g);
        if (this.graphConfigs.zoom) {
          // add zoom
          this.zoomListener = this.addZoom(g, this.treeChart, this.graphConfigs);
        } else {
          // scale to fit container
          this.fitGraph(this.treeChart, this.graphConfigs, 0);
        }
      } else {
        // empty graph container
        d3.select(this.treeChart.nativeElement).select('#main-g').selectAll('*').remove();
      }
    }
  }

  private calcNodeMaxSize(data: TreeGraphDataInterface, currentMaxSize: { width: number, height: number }):
    { width: number, height: number } {
    let nodeHeight;
    let nodeWidth;
    const labelPadding = Math.max(this.graphConfigs.label.padding.left + this.graphConfigs.label.padding.right,
      this.graphConfigs.label.padding.top + this.graphConfigs.label.padding.bottom);
    if (data.node.shape === 'circle') {
      // no label correction because it is outside the node
      nodeHeight = data.node.circleRadius * 2;
      nodeWidth = data.node.circleRadius * 2;
    } else if (data.node.shape === 'rect') {
      // label correction
      nodeHeight = data.node.rectangleDimensions.height +
        this.graphConfigs.label.padding.top + this.graphConfigs.label.padding.bottom;
      nodeWidth = data.node.rectangleDimensions.width +
        this.graphConfigs.label.padding.left + this.graphConfigs.label.padding.right;
    } else if (data.node.shape === 'square') {
      // label correction
      nodeHeight = data.node.squareDimensions + labelPadding;
      nodeWidth = data.node.squareDimensions + labelPadding;
    } else if (data.node.shape === 'rhombus') {
      // label correction
      nodeHeight = (data.node.rhombusDimensions * Math.sqrt(2)) + labelPadding;
      nodeWidth = (data.node.rhombusDimensions * Math.sqrt(2)) + labelPadding;
    }
    let maxSize = {
      width: Math.max(currentMaxSize.width, nodeWidth),
      height: Math.max(currentMaxSize.height, nodeHeight)
    };
    if (data.children && data.children.length > 0) {
      for (const child of data.children) {
        maxSize = this.calcNodeMaxSize(child, maxSize);
      }
    }
    return maxSize;
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

  private createTree(g) {
    // compute node max size
    const nodeMaxSize = this.calcNodeMaxSize(this.graphDataArranged[0] as TreeGraphDataInterface, {width: 0, height: 0});
    // declares a tree layout and assigns the size
    let treeMap;
    if (this.graphConfigs.orientation === 'horizontal') {
      treeMap = d3.tree().nodeSize([nodeMaxSize.height, nodeMaxSize.width])
        // adjust adjacent node separation
        // The nodes are positioned so that the spacing between the two nodes is equal to the number returned by the function multiplied
        // by the width of the bounding box specified in nodeSize. Note: the computed width is the spacing between the node
        // positions and not the spacing between the node bounding boxes.
        .separation((a, b) => {
          const brotherDistance = (nodeMaxSize.height + this.graphConfigs.nodes.distanceBetweenBrothers);
          const cousinDistance = (nodeMaxSize.height + this.graphConfigs.nodes.distanceBetweenCousins);
          return a.parent === b.parent ? (brotherDistance / nodeMaxSize.height) : (cousinDistance / nodeMaxSize.height);
        });
    } else {
      treeMap = d3.tree().nodeSize([nodeMaxSize.width, nodeMaxSize.height])
        // adjust adjacent node separation
        // The nodes are positioned so that the spacing between the two nodes is equal to the number returned by the function multiplied
        // by the width of the bounding box specified in nodeSize. Note: the computed width is the spacing between the node
        // positions and not the spacing between the node bounding boxes.
        .separation((a, b) => {
          const brotherDistance = (nodeMaxSize.width + this.graphConfigs.nodes.distanceBetweenBrothers);
          const cousinDistance = (nodeMaxSize.width + this.graphConfigs.nodes.distanceBetweenCousins);
          return a.parent === b.parent ? (brotherDistance / nodeMaxSize.width) : (cousinDistance / nodeMaxSize.width);
        });
    }
    // Assigns parent, children, height, depth
    const root = d3.hierarchy(this.graphDataArranged[0], d => (d as TreeGraphDataInterface).children);
    // set root position
    if (this.graphConfigs.orientation === 'horizontal') {
      root['x0'] = 0; // tslint:disable-line
      root['y0'] = this.graphHeight / 2; // tslint:disable-line
    } else {
      root['x0'] = this.graphWidth / 2; // tslint:disable-line
      root['y0'] = 0; // tslint:disable-line
    }
    // Collapse after the nth level
    if (this.graphConfigs.nodes.expandable && this.graphConfigs.nodes.maxInitialExpandedLevel) {
      this.toggleNodeCollapsedStatus(root);
    }
    // Assigns the x and y position for the nodes
    const treeData = treeMap(root);
    // compute nodes
    this.manageTreeNodes(treeData, root, treeMap, g, nodeMaxSize);
    // compute links
    this.manageTreeLinks(treeData, g);
  }

  private computeNodePosition(nodesData, nodeMaxSize: { width: number, height: number }) {
    nodesData.forEach(d => {
      // using node size, by default all nodes are positioned near without space
      d.y = d.depth * (this.graphConfigs.nodes.distanceBetweenParentAndChild +
        (this.graphConfigs.orientation === 'vertical' ? nodeMaxSize.height : nodeMaxSize.width));
    });
  }

  private translateNodeToPosition(node) {
    // ok for circle shape
    let xPosition = node.x;
    let yPosition = node.y;
    // for others shape
    if ((node.data as TreeGraphDataInterface).node.shape === 'rect' || (node.data as TreeGraphDataInterface).node.shape === 'square') {
      xPosition -= this.graphConfigs.orientation === 'vertical' ? node.width / 2 : node.height / 2;
      yPosition -= this.graphConfigs.orientation === 'vertical' ? node.height / 2 : node.width / 2;
    } else if ((node.data as TreeGraphDataInterface).node.shape === 'rhombus') {
      xPosition -= this.graphConfigs.orientation === 'vertical' ? 0 : node.height / 2;
      yPosition -= this.graphConfigs.orientation === 'vertical' ? node.height / 2 : 0;
    }
    if (this.graphConfigs.orientation === 'vertical') {
      return 'translate(' + xPosition + ',' + yPosition + ')';
    }
    return 'translate(' + yPosition + ',' + xPosition + ')';
  }

  private onClickNode(root, d, treeMap, g, nodeMaxSize: { width: number, height: number }) {
    if (this.graphConfigs.nodes.expandable && (d.children || d._children)) {
      if (d.children) { // collapse node
        d._children = d.children;
        d.children = null;
      } else { // expand node
        d.children = d._children;
        d._children = null;
      }
      this.updateTree(root, d, treeMap, g, nodeMaxSize);
    } else if (this.graphConfigs.events.clickOnElement) {
      // send event
      this.clickOnNode.emit(d.data);
    }
  }

  private manageTreeNodes(treeData, root, treeMap, g, nodeMaxSize: { width: number, height: number }) {
    // remove old nodes
    g.selectAll('.node').remove();
    const nodesData = treeData.descendants();
    // add nodes
    const nodesAdded = this.addNodes(g, nodesData, this.graphConfigs);
    // compute nodes position
    this.computeNodePosition(nodesData, nodeMaxSize);
    // translate nodes
    nodesAdded.nodesEnter
      .attr('transform', d => this.translateNodeToPosition(d));

    // center text element
    this.centerNodeText(nodesAdded.nodesEnter, this.graphConfigs);

    // add click event
    nodesAdded.nodesEnter
      .style('cursor', d => {
        if ((this.graphConfigs.nodes.expandable && (d.children || d._children)) || this.graphConfigs.events.clickOnElement) {
          return 'pointer';
        }
        return '';
      })
      .on('click', (e, d) => this.onClickNode(root, d, treeMap, g, nodeMaxSize));
  }

  private diagonal(s, d) {
    // calc source links anchor
    const sourceLinkAnchorX = s.x;
    const sourceLinkAnchorY = s.y + (this.graphConfigs.orientation === 'vertical' ? s.height / 2 : s.width / 2);
    // calc destination links anchor
    const destinationLinkAnchorX = d.x;
    const destinationLinkAnchorY = d.y - (this.graphConfigs.orientation === 'vertical' ? d.height / 2 : d.width / 2);

    if (this.graphConfigs.orientation === 'vertical') {
      return `M ${sourceLinkAnchorX} ${sourceLinkAnchorY},
                  ${sourceLinkAnchorX} ${sourceLinkAnchorY + 2 * this.markerBoxHeight}
                C ${sourceLinkAnchorX} ${(2 * sourceLinkAnchorY + destinationLinkAnchorY) / 3},
                  ${destinationLinkAnchorX} ${(2 * sourceLinkAnchorY + destinationLinkAnchorY) / 3},
                  ${destinationLinkAnchorX} ${destinationLinkAnchorY - 2 * this.markerBoxHeight},
                L ${destinationLinkAnchorX} ${destinationLinkAnchorY}`;
    }

    return `M ${sourceLinkAnchorY} ${sourceLinkAnchorX},
                ${sourceLinkAnchorY + 2 * this.markerBoxHeight} ${sourceLinkAnchorX}
              C ${destinationLinkAnchorY} ${(2 * sourceLinkAnchorX + destinationLinkAnchorX) / 3},
                ${sourceLinkAnchorY} ${(2 * sourceLinkAnchorX + destinationLinkAnchorX) / 3},
                ${destinationLinkAnchorY - 2 * this.markerBoxHeight} ${destinationLinkAnchorX},
              L ${destinationLinkAnchorY} ${destinationLinkAnchorX}`;
  }

  private manageTreeLinks(treeData, g) {
    // remove old links and definitions
    g.selectAll('.link').remove();
    const linksData = treeData.descendants().slice(1);
    // add links
    const linksAdded = this.addLinks(g, linksData, this.graphConfigs, this.markerBoxHeight, this.markerBoxWidth, this.refX, this.refY,
      this.arrowPoints);

    // Creates a curved (diagonal) path from parent to the child nodes
    linksAdded.linksEnter
      .attr('d', d => this.diagonal(d.parent, d));
  }

  private updateNodes(treeData, g, nodeMaxSize: { width: number, height: number }, source, treeMap, root) {
    // get new nodes data
    const nodesData = treeData.descendants();
    // add new nodes
    const newNodesAdded = this.addNodes(g, nodesData, this.graphConfigs);
    // compute nodes position
    this.computeNodePosition(nodesData, nodeMaxSize);
    // translate nodes
    newNodesAdded.nodesEnter
      .attr('transform', () => this.translateNodeToPosition(source))
      .style('opacity', 0);
    // update nodes (merge new node with existing ones)
    const nodesUpdate = newNodesAdded.nodesEnter.merge(newNodesAdded.nodes);
    // translate new nodes to their position
    nodesUpdate.transition()
      .duration(this.animationDuration)
      .attr('transform', d => this.translateNodeToPosition(d))
      .style('opacity', 1);
    // Update the node attributes and style
    nodesUpdate.select('.node-shape')
      .style('opacity', 1)
      .style('fill', d => (d._children ?
        (d.data as TreeGraphDataInterface).node.collapsedColor :
        (d.data as TreeGraphDataInterface).node.expandedColor));
    // center text element
    this.centerNodeText(nodesUpdate, this.graphConfigs);
    // add click event
    nodesUpdate
      .style('cursor', d => {
        if ((this.graphConfigs.nodes.expandable && (d.children || d._children)) || this.graphConfigs.events.clickOnElement) {
          return 'pointer';
        }
        return '';
      })
      .on('click', (e, d) => this.onClickNode(root, d, treeMap, g, nodeMaxSize));
    // Remove any exiting nodes (this is called when a node is collapsed)
    newNodesAdded.nodes.exit().transition()
      .duration(this.animationDuration)
      .attr('transform', () => this.translateNodeToPosition(source))
      .style('opacity', 0)
      .remove();
  }

  private updateLinks(treeData, g) {
    // get new links data
    const linksData = treeData.descendants().slice(1);
    // add new links
    const newLinksAdded = this.addLinks(g, linksData, this.graphConfigs, this.markerBoxHeight, this.markerBoxWidth, this.refX, this.refY,
      this.arrowPoints);
    // Creates a curved (diagonal) path from parent to parent (the repetition is not an error)
    newLinksAdded.linksEnter
      .attr('d', d => this.diagonal(d.parent, d.parent))
      .style('opacity', 0);
    // update links (merge new links with existing ones)
    const linksUpdate = newLinksAdded.linksEnter.merge(newLinksAdded.links);
    // translate links to their position
    linksUpdate.transition()
      .duration(this.animationDuration)
      .attr('d', d => this.diagonal(d.parent, d))
      .style('opacity', 1);
    // Remove any exiting links (this is called when a node is collapsed)
    newLinksAdded.links.exit().transition()
      .duration(this.animationDuration)
      .attr('d', d => this.diagonal(d.parent, d.parent))
      .style('opacity', 0)
      .remove();
  }

  private updateTree(root, source, treeMap, g, nodeMaxSize: { width: number, height: number }) {
    // recalculate the x and y position for the nodes
    const treeData = treeMap(root);
    // update nodes
    this.updateNodes(treeData, g, nodeMaxSize, source, treeMap, root);
    // update links
    this.updateLinks(treeData, g);
    // fit graph
    const newBounds = (g.node() as SVGSVGElement).getBBox();
    const currentNodes = treeData.descendants();
    let minX = currentNodes[0].x;
    let minY = currentNodes[0].y;
    let maxX = currentNodes[0].x;
    let maxY = currentNodes[0].y;
    // calc min and max positions
    for (const node of currentNodes) {
      minX = this.graphConfigs.orientation === 'vertical' ? Math.min(minX, node.x - node.width / 2) :
        Math.min(minX, node.x - node.height / 2);
      minY = this.graphConfigs.orientation === 'vertical' ? Math.min(minY, node.y - node.height / 2) :
        Math.min(minY, node.y - node.width / 2);
      maxX = this.graphConfigs.orientation === 'vertical' ? Math.max(maxX, node.x + node.width / 2) :
        Math.max(maxX, node.x + node.height / 2);
      maxY = this.graphConfigs.orientation === 'vertical' ? Math.max(maxY, node.y + node.height / 2) :
        Math.max(maxY, node.y + node.width / 2);
    }
    newBounds.x = this.graphConfigs.orientation === 'vertical' ? minX : minY;
    newBounds.y = this.graphConfigs.orientation === 'vertical' ? minY : minX;
    newBounds.width = this.graphConfigs.orientation === 'vertical' ? (maxX - minX) : (maxY - minY);
    newBounds.height = this.graphConfigs.orientation === 'vertical' ? (maxY - minY) : (maxX - minX);
    if (this.graphConfigs.zoom) {
      // set zoom to initial state
      this.initZoomToCurrentPosition(this.treeChart, this.graphConfigs, this.zoomListener, this.animationDuration, newBounds);
    } else {
      // refit graph with animation
      this.fitGraph(this.treeChart, this.graphConfigs, this.animationDuration, newBounds);
    }
  }

  private createGraph(width, height) {
    const svg = d3.select(this.treeChart.nativeElement).select('#chart-container')
      .append('svg:svg') // create the SVG element inside the container
      .attr('width', width) // set the width
      .attr('height', height); // set the height

    this.graphWidth = width - (this.graphConfigs.margin.left + this.graphConfigs.margin.right);
    this.graphHeight = height - (this.graphConfigs.margin.top + this.graphConfigs.margin.bottom);

    const g = svg
      .append('svg:g') // make a group to hold tree chart
      .attr('id', 'main-g');

    // create tree
    this.createTree(g);
    // add zoom
    if (this.graphConfigs.zoom) {
      this.zoomListener = this.addZoom(g, this.treeChart, this.graphConfigs);
    } else {
      // scale to fit container
      this.fitGraph(this.treeChart, this.graphConfigs, 0);
    }
  }

  ngOnDestroy(): void {
    // remove listeners
    this.removeListeners();
  }

}
