import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuMaterialComponent } from './menu-material.component';

describe('MenuMaterialComponent', () => {
  let component: MenuMaterialComponent;
  let fixture: ComponentFixture<MenuMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenuMaterialComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
