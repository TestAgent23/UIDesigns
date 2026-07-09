import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiUploadsComponent } from './di-uploads.component';

describe('DiUploadsComponent', () => {
  let component: DiUploadsComponent;
  let fixture: ComponentFixture<DiUploadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiUploadsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiUploadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
