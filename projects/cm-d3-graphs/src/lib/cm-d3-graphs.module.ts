import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HistogramChartComponent} from './components/histogram-chart/histogram-chart.component';
import {PieChartComponent} from './components/pie-chart/pie-chart.component';
import {LineChartComponent} from './components/line-chart/line-chart.component';
import {RangeSliderChartComponent} from './components/range-slider-chart/range-slider-chart.component';
import {TreeChartComponent} from './components/tree-chart/tree-chart.component';
import {FlowChartComponent} from './components/flow-chart/flow-chart.component';
import { BubbleChartComponent } from './components/bubble-chart/bubble-chart.component';

@NgModule({
  declarations: [
    HistogramChartComponent,
    PieChartComponent,
    LineChartComponent,
    RangeSliderChartComponent,
    TreeChartComponent,
    FlowChartComponent,
    BubbleChartComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    HistogramChartComponent,
    PieChartComponent,
    LineChartComponent,
    RangeSliderChartComponent,
    TreeChartComponent,
    FlowChartComponent,
    BubbleChartComponent
  ]
})
export class CmD3GraphsModule {
}
