import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileStatusChartComponent } from './file-status-chart.component';

describe('FileStatusChartComponent', () => {
  let component: FileStatusChartComponent;
  let fixture: ComponentFixture<FileStatusChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileStatusChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileStatusChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
