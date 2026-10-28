import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemEquipmentComponent } from './item-equipment.component';

describe('ItemEquipmentComponent', () => {
  let component: ItemEquipmentComponent;
  let fixture: ComponentFixture<ItemEquipmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemEquipmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemEquipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
