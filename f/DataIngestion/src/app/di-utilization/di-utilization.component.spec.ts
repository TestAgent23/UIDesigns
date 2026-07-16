import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiUtilizationComponent } from './di-utilization.component';

describe('DiUtilizationComponent', () => {
  let component: DiUtilizationComponent;
  let fixture: ComponentFixture<DiUtilizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiUtilizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiUtilizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
