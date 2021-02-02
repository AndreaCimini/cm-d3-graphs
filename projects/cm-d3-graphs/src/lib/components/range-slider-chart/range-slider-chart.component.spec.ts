import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RangeSliderChartComponent } from './range-slider-chart.component';

describe('RangeSliderChartComponent', () => {
  let component: RangeSliderChartComponent;
  let fixture: ComponentFixture<RangeSliderChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RangeSliderChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RangeSliderChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
