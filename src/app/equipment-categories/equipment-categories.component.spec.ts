import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentCategoriesComponent } from './equipment-categories.component';

describe('EquipmentCategoriesComponent', () => {
  let component: EquipmentCategoriesComponent;
  let fixture: ComponentFixture<EquipmentCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EquipmentCategoriesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EquipmentCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
