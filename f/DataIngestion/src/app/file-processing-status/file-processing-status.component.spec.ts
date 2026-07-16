import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileProcessingStatusComponent } from './file-processing-status.component';

describe('FileProcessingStatusComponent', () => {
  let component: FileProcessingStatusComponent;
  let fixture: ComponentFixture<FileProcessingStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileProcessingStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileProcessingStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
