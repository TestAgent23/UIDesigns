import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessStatusTemplateComponent } from './process-status-template.component';

describe('ProcessStatusTemplateComponent', () => {
  let component: ProcessStatusTemplateComponent;
  let fixture: ComponentFixture<ProcessStatusTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessStatusTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessStatusTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
