import {Component, OnInit} from '@angular/core';
import {JsonEditorOptions} from 'ang-jsoneditor';

import {HistogramConfs} from './mocks/histogram-confs';
import {HistogramData} from './mocks/histogram-data';
import {TreeConfs} from './mocks/tree-confs';
import {TreeData} from './mocks/tree-data';
import {PieConfs} from './mocks/pie-confs';
import {PieData} from './mocks/pie-data';
import {DonutConfs} from './mocks/donut-confs';
import {DonutData} from './mocks/donut-data';
import {LineConfs} from './mocks/line-confs';
import {LineData} from './mocks/line-data';
import {FlowChartConfs} from './mocks/flow-chart-confs';
import {FlowChartData} from './mocks/flow-chart-data';
import {RangeSliderConfs} from './mocks/range-slider-confs';
import {RangeSliderData} from './mocks/range-slider-data';
import {BubbleChartConfs} from './mocks/bubble-chart-confs';
import {BubbleChartData} from './mocks/bubble-chart-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  editorOptions: JsonEditorOptions = new JsonEditorOptions();
  editorConfigurationJson = {};

  graphTypes = [
    {label: 'Histogram', value: 'histogram'},
    {label: 'Pie', value: 'pie'},
    {label: 'Donut', value: 'donut'},
    {label: 'Line chart', value: 'line'},
    {label: 'Range slider', value: 'range-slider'},
    {label: 'Tree', value: 'tree'},
    {label: 'Flow chart', value: 'flow-chart'},
    {label: 'Bubble chart', value: 'bubble-chart'}
  ];
  graphSelected = 'pie';

  graphsConfigurations = {
    histogram: HistogramConfs,
    pie: PieConfs,
    donut: DonutConfs,
    line: LineConfs,
    tree: TreeConfs,
    'flow-chart': FlowChartConfs,
    'range-slider': RangeSliderConfs,
    'bubble-chart': BubbleChartConfs
  };

  graphsData = {
    histogram: HistogramData,
    pie: PieData,
    donut: DonutData,
    line: LineData,
    tree: TreeData,
    'flow-chart': FlowChartData,
    'range-slider': RangeSliderData,
    'bubble-chart': BubbleChartData
  };

  constructor() {
  }

  ngOnInit(): void {
    this.editorOptions.enableSort = false;
    this.editorOptions.enableTransform = false;
    this.editorOptions.mode = 'code';
    this.editorOptions.onError = undefined;
    this.editorOptions.onChange = () => {
    };

    this.adjustJson(this.graphsConfigurations[this.graphSelected], this.editorConfigurationJson);
  }

  private adjustJson(inputJson: any, outputJson: any) {
    for (const key of Object.keys(inputJson)) {
      if (typeof inputJson[key] === 'function') {
        outputJson[key] = '/Function(' + inputJson[key].toString() + ')/';
      } else if (typeof inputJson[key] === 'object') {
        outputJson[key] = {};
        this.adjustJson(inputJson[key], outputJson[key]);
      } else {
        outputJson[key] = inputJson[key];
      }
    }
  }

  private parseJson(inputJson: any, outputJson: any) {
    for (const key of Object.keys(inputJson)) {
      if (typeof inputJson[key] === 'string' && inputJson[key].startsWith('/Function(') && inputJson[key].endsWith(')/')) {
        outputJson[key] = inputJson[key].substring(10, inputJson[key].length - 2);
        // tslint:disable-next-line:no-eval
        outputJson[key] = eval('(' + outputJson[key] + ')');
      } else if (typeof inputJson[key] === 'object') {
        outputJson[key] = {};
        this.parseJson(inputJson[key], outputJson[key]);
      } else {
        outputJson[key] = inputJson[key];
      }
    }
  }

  onSelectGraphType($event: string) {
    this.graphSelected = $event;
    this.editorConfigurationJson = {};
    this.adjustJson(this.graphsConfigurations[this.graphSelected],  this.editorConfigurationJson);
  }

  confirmConfChanges(configEditor) {
    this.editorConfigurationJson = configEditor.get();
    this.graphsConfigurations[this.graphSelected] = {};
    this.parseJson(this.editorConfigurationJson, this.graphsConfigurations[this.graphSelected]);
    // reset reference to update view
    this.graphsConfigurations[this.graphSelected] = {...this.graphsConfigurations[this.graphSelected]}
  }

  confirmDataChanges(dataEditor) {
    this.graphsData[this.graphSelected] = dataEditor.get();
  }
}
