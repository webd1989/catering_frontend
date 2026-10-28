import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuEquipmentComponent } from './menu-equipment.component';

describe('MenuEquipmentComponent', () => {
  let component: MenuEquipmentComponent;
  let fixture: ComponentFixture<MenuEquipmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenuEquipmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuEquipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
