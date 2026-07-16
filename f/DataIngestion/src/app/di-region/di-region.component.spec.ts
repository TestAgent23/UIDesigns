import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiRegionComponent } from './di-region.component';

describe('DiRegionComponent', () => {
  let component: DiRegionComponent;
  let fixture: ComponentFixture<DiRegionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiRegionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiRegionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
