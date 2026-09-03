import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogisticRangeComponent } from './logistic-range.component';

describe('LogisticRangeComponent', () => {
  let component: LogisticRangeComponent;
  let fixture: ComponentFixture<LogisticRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogisticRangeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogisticRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
