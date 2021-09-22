import {BaseCharts} from './base-charts';
import {NodeGraphInterface} from '../interfaces/graph-configuration.interface';
import {FlowChartGraphDataInterface, TreeGraphDataInterface} from '../interfaces/graph-data.interface';
import * as d3 from 'd3';

export abstract class BaseNodesCharts extends BaseCharts {

  protected addNodes(g, nodesData, graphConfigs: NodeGraphInterface) {
    // select all nodes
    const nodes = g.selectAll('.node')
      // the second parameter is a function that is used (here) to filter nodes
      // the result of selection compares the nodes previously added with new ones throughout the returned value of that function
      .data(nodesData, d => d.data.id);

    // Append g for each node
    const nodesEnter = nodes.enter().append('g')
      .attr('id', d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).id)
      .attr('class', 'node');

    // Add shape for the nodes
    const nodesShape = nodesEnter
      .append(d => {
        let shape = '';
        if ((d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rect' ||
          (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'square'  ||
          (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rhombus') {
          shape = 'rect';
        } else if (((d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'circle')) {
          shape = 'circle';
        }
        return document.createElementNS(d3.namespaces.svg, shape);
      })
      .attr('class', 'node-shape')
      .style('fill', d => (d._children ?
        (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.collapsedColor :
        (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.expandedColor))
      .style('opacity', 1)
      .style('stroke', d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.strokeColor);

    // adds the text to the node
    nodesEnter.append('text')
      .attr('dy', 0)
      .attr('y', 0)
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'text-before-edge')
      .style('font-size', graphConfigs.label['font-size'])
      .attr('fill', d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.labelColor)
      .text(d => d.data.label)
      .call(elements => {
        const data = elements.data();
        // loop over elements
        elements.nodes().forEach((el, index: number) => {
          let width = 0;
          if ((data[index].data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rect') {
            width = graphConfigs.nodes.rectangleDimensions.width;
          } else if ((data[index].data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'square') {
            width = graphConfigs.nodes.squareDimensions;
          } else if ((data[index].data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rhombus') {
            width = graphConfigs.nodes.rhombusDimensions * Math.sqrt(2);
          } else if ((data[index].data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'circle') {
            width = undefined; // for circle label has no constraint
          }
          this.wrapLongText(el, width);
        });
      });

    // adjust shape dimension due to label
    for (const nodeElement of nodesEnter.nodes()) {
      // find node data
      const nodeData = nodesData.find(n => (n.data as TreeGraphDataInterface | FlowChartGraphDataInterface).id === nodeElement.id);
      // get node element dimension
      const dimensions = nodeElement.getBBox();
      if (nodeData) {
        const labelPadding = Math.max(graphConfigs.label.padding.left + graphConfigs.label.padding.right,
          graphConfigs.label.padding.top + graphConfigs.label.padding.bottom);
        // if the node is a circle, the label is under the node and so is not necessary to do any adjustment
        // for square and rhombus shapes label padding is the same in all dimensions
        if ((nodeData.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rect') {
          nodeData.width = (dimensions.width > graphConfigs.nodes.rectangleDimensions.width ?
            dimensions.width : graphConfigs.nodes.rectangleDimensions.width) +
            graphConfigs.label.padding.left + graphConfigs.label.padding.right;
          nodeData.height = (dimensions.height > graphConfigs.nodes.rectangleDimensions.height ?
            dimensions.height : graphConfigs.nodes.rectangleDimensions.height) +
            graphConfigs.label.padding.top + graphConfigs.label.padding.bottom;
        } else if ((nodeData.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'square') {
          nodeData.width = (dimensions.width > graphConfigs.nodes.squareDimensions ?
            dimensions.width : graphConfigs.nodes.squareDimensions) + labelPadding;
          nodeData.height = (dimensions.height > graphConfigs.nodes.squareDimensions ?
            dimensions.height : graphConfigs.nodes.squareDimensions) + labelPadding;
        } else if ((nodeData.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rhombus') {
          nodeData.width = (dimensions.width > (graphConfigs.nodes.rhombusDimensions * Math.sqrt(2)) ?
            dimensions.width : (graphConfigs.nodes.rhombusDimensions * Math.sqrt(2))) + labelPadding;
          nodeData.height = (dimensions.height > (graphConfigs.nodes.rhombusDimensions * Math.sqrt(2)) ?
            dimensions.height : (graphConfigs.nodes.rhombusDimensions * Math.sqrt(2))) + labelPadding;
        } else if ((nodeData.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'circle') {
          nodeData.width = 2 * graphConfigs.nodes.circleRadius;
          nodeData.height = 2 * graphConfigs.nodes.circleRadius;
        }
      }
    }

    // set node dimensions
    // manage circle shape
    nodesShape.filter(d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'circle')
      .attr('r', graphConfigs.nodes.circleRadius);

    // adds image to the node
    nodesEnter
      .filter(d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'circle' &&
        (d.data as FlowChartGraphDataInterface).node.icon)
      .append('svg:image')
      .attr('xlink:href',  d => d.data.node.icon)
      .attr('x', - graphConfigs.nodes.circleRadius / 2)
      .attr('y', - graphConfigs.nodes.circleRadius / 2)
      .attr('height', graphConfigs.nodes.circleRadius)
      .attr('width', graphConfigs.nodes.circleRadius);

    // manage other shapes
    nodesShape.filter(d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rect' ||
      (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'square')
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('ry', 4)
      .attr('rx', 4);

    // adds image to the node
    nodesEnter
      .filter(d => ((d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rect' ||
        (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'square') &&
        (d.data as FlowChartGraphDataInterface).node.icon)
      .append('svg:image')
      .attr('xlink:href',  d => d.data.node.icon)
      .attr('x', d => d.width / 4)
      .attr('y', d => d.height / 4 - (d.data.label ? 15 : 0))
      .attr('height', d => d.width / 2)
      .attr('width', d => d.height / 2);

    // manage rhombus shape
    nodesShape.filter(d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rhombus')
      .attr('width', d => d.width / Math.sqrt(2))
      .attr('height', d => d.height / Math.sqrt(2))
      .attr('ry', 4)
      .attr('rx', 4)
      .attr('transform', 'rotate(45)');

    // adds image to the node
    nodesEnter
      .filter(d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rhombus' &&
        (d.data as FlowChartGraphDataInterface).node.icon)
      .append('svg:image')
      .attr('xlink:href',  d => d.data.node.icon)
      .attr('x', d => - d.width / 4)
      .attr('y', d => d.height / 4 - (d.data.label ? 15 : 0))
      .attr('height', d => d.width / 2)
      .attr('width', d => d.height / 2);

    return {nodes, nodesEnter};
  }

  protected centerNodeText(nodesEnter, graphConfigs: NodeGraphInterface) {
    nodesEnter
      .selectAll('text')
      .attr('transform', d => {
        // select text element
        const textEl = d3.select('#' + d.data.id + ' text').node();
        // get dimensions
        const textDimensions = (textEl as SVGSVGElement).getBBox();
        if ((d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'circle') {
          return 'translate(0,' + graphConfigs.nodes.circleRadius + ')';
        } else if ((d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rect' ||
          (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'square') {
          // calc y translate quantity (the text is below the upper edge of the rectangle and middle anchored to the left upper edge)
          const yTranslate = (d.height - textDimensions.height) / 2 + (d.data.node.icon ? d.height / 4 : 0);
          return 'translate(' + (d.width / 2) + ', ' + yTranslate + ')';
        } else if ((d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).node.shape === 'rhombus') {
          // calc y translate quantity (the text is below the upper edge of the rectangle and middle anchored to the left upper edge)
          const yTranslate = (d.height - textDimensions.height) / 2 + (d.data.node.icon ? d.height / 4 : 0);
          return 'translate(' + 0 + ', ' + yTranslate + ')';
        }
      });
  }

  protected addLinks(g, linksData, graphConfigs: NodeGraphInterface, markerBoxHeight: number, markerBoxWidth: number, refX: number,
                     refY: number, arrowPoints: number[][]) {
    const links = g.selectAll('path.link')
      .data(linksData, d => d.data.id);

    // remove old definitions
    g.select('defs').remove();
    // define arrow marker
    if (graphConfigs.links.arrow) {
      g.append('svg:defs').selectAll('marker')
        .data(linksData)
        .enter()
        .append('svg:marker')
        .attr('id', d => 'marker_' + (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).id)
        .attr('markerHeight', markerBoxHeight)
        .attr('markerWidth', markerBoxWidth)
        .attr('markerUnits', 'strokeWidth')
        .attr('orient', 'auto-start-reverse')
        .attr('refX', refX)
        .attr('refY', refY)
        .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
        .append('svg:path')
        .attr('d', d3.line<number[]>()(arrowPoints))
        .attr('fill', d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).link.color);
    }

    // append path for each link
    const linksEnter = links.enter()
      .append('path')
      .attr('id', d => 'link_' + d.data.source + '_' + d.data.target)
      .attr('class', 'link')
      .style('fill', 'none')
      .style('stroke', d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).link.color)
      .style('stroke-width', d => (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).link.width);

    // add arrow
    if (graphConfigs.links.arrow) {
      if (graphConfigs.links.arrowDirection === 'end') {
        linksEnter.attr('marker-end', d => 'url(#marker_' + (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).id + ')');
      } else {
        linksEnter.attr('marker-start', d => 'url(#marker_' + (d.data as TreeGraphDataInterface | FlowChartGraphDataInterface).id + ')');
      }
    }

    return {links, linksEnter};
  }
}
