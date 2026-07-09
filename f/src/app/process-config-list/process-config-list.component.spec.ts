import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessConfigListComponent } from './process-config-list.component';

describe('ProcessConfigListComponent', () => {
  let component: ProcessConfigListComponent;
  let fixture: ComponentFixture<ProcessConfigListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessConfigListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessConfigListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

 
});
