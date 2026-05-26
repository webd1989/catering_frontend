import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialCategoriesComponent } from './material-categories.component';

describe('MaterialCategoriesComponent', () => {
  let component: MaterialCategoriesComponent;
  let fixture: ComponentFixture<MaterialCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaterialCategoriesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
