import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesetListComponent } from './ruleset-list.component';

describe('RulesetListComponent', () => {
  let component: RulesetListComponent;
  let fixture: ComponentFixture<RulesetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RulesetListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RulesetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
