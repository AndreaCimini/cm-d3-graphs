import { Histogram } from '../graphs/histogram';
import { histogramConf, histogramData } from '../__mock__/histogram';
import './style.css';

const container: HTMLElement | any = document.getElementById('app');
const histogram = new Histogram();
histogram.build(container, histogramConf, histogramData);
