import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAiMenuComponent } from './create-ai-menu.component';

describe('CreateAiMenuComponent', () => {
  let component: CreateAiMenuComponent;
  let fixture: ComponentFixture<CreateAiMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateAiMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAiMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
