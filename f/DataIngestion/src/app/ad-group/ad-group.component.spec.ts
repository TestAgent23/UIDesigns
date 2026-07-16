import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdGroupComponent } from './ad-group.component';

describe('AdGroupComponent', () => {
  let component: AdGroupComponent;
  let fixture: ComponentFixture<AdGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
