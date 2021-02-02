import {BaseCharts} from './base-charts';

export abstract class BasePieCharts extends BaseCharts {

  protected legendX: string;
  protected legendY: string;

  protected manageLabelOverlap(positions) {
    const positionMinDistanceY = 20;
    const offsetDistanceY = 30;
    let orderedPosition = [];
    // loop over positions
    positions.forEach((p, i) => {
      orderedPosition.push({
        positionIndex: i,
        lastPointCords: p[2],
        penultimatePointCords: p[1],
        originPointCoords: p[0]
      });
    });
    // order positions by x (ascending order)
    orderedPosition = orderedPosition.sort((a, b) => {
      if (a.lastPointCords[0] < b.lastPointCords[0]) {
        return -1;
      }
      if (a.lastPointCords[0] > b.lastPointCords[0]) {
        return 1;
      }
      return 0;
    });
    // loop over last point position
    for (const p of orderedPosition) {
      // loop over last point position again, to compare current position with others
      for (const sP of orderedPosition) {
        // check if current position overlaps with others
        if (p.positionIndex !== sP.positionIndex &&
          Math.sign(p.lastPointCords[0]) === Math.sign(sP.lastPointCords[0])) { // exclude same element and opposite elements (along x)
          // calc gap along y
          const deltaY = p.lastPointCords[1] - sP.lastPointCords[1];
          // check if that gap is less than minimum distance
          if (Math.abs(deltaY) < positionMinDistanceY) {
            // here we use the trigonometric rule sideY = tg(alpha) * sideX where alpha is the angle respect) x axis
            const tgAlpha = Math.abs(sP.originPointCoords[1] - sP.penultimatePointCords[1]) /
              Math.abs(sP.originPointCoords[0] - sP.penultimatePointCords[0]);
            const offsetDistanceX = offsetDistanceY / tgAlpha;
            // x cord
            sP.penultimatePointCords[0] += Math.sign(sP.penultimatePointCords[0]) * offsetDistanceX;
            sP.lastPointCords[0] += Math.sign(sP.lastPointCords[0]) * offsetDistanceX;
            // if delta y is grater than 0 it means that current label is under the previous one.
            // So, at first, we need to set the y position of the current label equal to the y position of the previous one and, after,
            // increment the new position by the offset
            if (deltaY > 0) {
              // y cord
              sP.penultimatePointCords[1] = p.penultimatePointCords[1] + (Math.sign(p.penultimatePointCords[1]) * offsetDistanceY);
              sP.lastPointCords[1] = p.lastPointCords[1] + (Math.sign(p.lastPointCords[1]) * offsetDistanceY);
            } else {
              // y cord
              sP.penultimatePointCords[1] += Math.sign(sP.penultimatePointCords[1]) * offsetDistanceY;
              sP.lastPointCords[1] += Math.sign(sP.lastPointCords[1]) * offsetDistanceY;
            }
          }
        }
      }
    }
  }

  protected createLegend(g, pieData: any[]) {
    // remove old data
    g.select('.legendContainer').remove();
    if (this.legendX || this.legendY) {
      const legendPadding = 10;
      const legendElementDim = 15;
      const legendElementPadding = {top: 15, right: 10};
      // get g dimensions and positions before we append legend
      const gBox = g.node().getBBox();
      // create legend container
      const legendContainer = g
        .append('g')
        .attr('class', 'legendContainer');
      // add rect and text for each group
      const legendElements = legendContainer
        .selectAll('g')
        .data(pieData)
        .enter()
        .append('g')
      legendElements
        .append('rect')
        .attr('width', legendElementDim)
        .attr('height', legendElementDim)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', d => d.data.slice.color)
      legendElements
        .append('text')
        .attr('x', legendElementDim + legendElementPadding.right)
        .style('dominant-baseline', 'text-before-edge')
        .text(d => d.data.label);
      if (this.legendX === 'right' || this.legendX === 'left') {
        // translate elements
        this.calcVerticalLegendPosition(legendElements, legendElementPadding, this.legendX);
        // calc legend dimension
        const legendDimension = legendContainer.node().getBBox().width + 2 * legendPadding;
        // translate container
        const xOffset = this.legendX === 'left' ? gBox.x - legendDimension : gBox.x + gBox.width;
        legendContainer
          .attr('transform', 'translate(' + xOffset + ',' + gBox.y + ')');
      } else if (this.legendY === 'bottom' || this.legendY === 'top') {
        // translate elements
        this.calcHorizontalLegendPosition(legendElements, legendElementPadding, this.legendY, legendElementDim);
        // calc legend dimension
        const legendDimension = legendContainer.node().getBBox().height + 2 * legendPadding;
        // translate container
        const xOffset = gBox.x - (legendContainer.node().getBBox().width - gBox.width) / 2;
        const yOffset = this.legendY === 'top' ? gBox.y - legendDimension : gBox.y + gBox.height;
        legendContainer
          .attr('transform', 'translate(' + xOffset + ',' + yOffset + ')');
      }
    }
  }
}
