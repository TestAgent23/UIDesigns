import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProcessConfigurationComponent } from './new-process-configuration.component';

describe('NewProcessConfigurationComponent', () => {
  let component: NewProcessConfigurationComponent;
  let fixture: ComponentFixture<NewProcessConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewProcessConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewProcessConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
