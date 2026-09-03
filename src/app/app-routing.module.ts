import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LoginComponent } from './login/login.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ProfileComponent } from './profile/profile.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { CompanyNotificationsComponent } from './company-notifications/company-notifications.component';
import { CompanyAuthenticationComponent } from './company-authentication/company-authentication.component';
import { ContactListComponent } from './contacts/contact-list/contact-list.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import {HashLocationStrategy, LocationStrategy} from "@angular/common";
import { CategoriesComponent } from './categories/categories.component';
import { SubCategoryComponent } from './sub-category/sub-category.component';
import { LeadsComponent } from './leads/leads.component';
import { ItemsComponent } from './items/items.component';
import { MenuListComponent } from './menues/menu-list/menu-list.component';
import { AddMenuComponent } from './menues/add-menu/add-menu.component';
import { EditMenuComponent } from './menues/edit-menu/edit-menu.component';
import { VendorsComponent } from './vendors/vendors.component';
import { UnitsComponent } from './units/units.component';
import { MaterialCategoriesComponent } from './material-categories/material-categories.component';
import { RawMaterialComponent } from './raw-material/raw-material.component';
import { MenuItemDetailsComponent } from './menu-item-details/menu-item-details.component';
import { CreateAiMenuComponent } from './menues/create-ai-menu/create-ai-menu.component';
import { BookingListComponent } from './bookings/booking-list/booking-list.component';
import { CreateBookingComponent } from './bookings/create-booking/create-booking.component';
import { EventTypesComponent } from './event-types/event-types.component';
import { PurchaseListComponent } from './purchase/purchase-list/purchase-list.component';
import { AddPurchaseComponent } from './purchase/add-purchase/add-purchase.component';
import { EditPurchaseComponent } from './purchase/edit-purchase/edit-purchase.component';
import { EquipmentCategoriesComponent } from './equipment-categories/equipment-categories.component';
import { EquipmentsComponent } from './equipments/equipments.component';
import { RolesComponent } from './roles/roles.component';
import { LogisticRangeComponent } from './logistic-range/logistic-range.component';
import { DemandComponent } from './demand/demand.component';

const routes: Routes = [
  {path:'',component:LoginComponent},
  {path:'forgot-password',component:ForgotPasswordComponent},
  {path:'dashboard',component:DashboardComponent},
  {path:'profile',component:ProfileComponent},
  {path:'users',component:UserListComponent},
  {path:'change-password',component:ChangePasswordComponent},
  {path:'company-settings',component:CompanySettingsComponent},
  {path:'company-notifications',component:CompanyNotificationsComponent},
  {path:'company-authentication',component:CompanyAuthenticationComponent},
  {path:'contacts',component:ContactListComponent},
  {path:'categories',component:CategoriesComponent},
  {path:'sub-categories',component:SubCategoryComponent},
  {path:'leads',component:LeadsComponent},
  {path:'items',component:ItemsComponent},
  {path:'menu-list',component:MenuListComponent},
  {path:'add-menu',component:AddMenuComponent},
  {path:'edit-menu/:id',component:EditMenuComponent},
  {path:'vendors',component:VendorsComponent},
  {path:'units',component:UnitsComponent},
  {path:'material-categories',component:MaterialCategoriesComponent},
  {path:'raw-material',component:RawMaterialComponent},
  {path:'menu-item-details/:id',component:MenuItemDetailsComponent},
  {path:'create-menu',component:CreateAiMenuComponent},
  {path:'booking-list',component:BookingListComponent},
  {path:'create-booking',component:CreateBookingComponent},
  {path:'event-types',component:EventTypesComponent},
  {path:'purchase-list',component:PurchaseListComponent},
  {path:'add-purchase',component:AddPurchaseComponent},
  {path:'edit-purchase/:id',component:EditPurchaseComponent},
  {path:'equipment-categories',component:EquipmentCategoriesComponent},
  {path:'equipments',component:EquipmentsComponent},
  {path:'roles',component:RolesComponent},
  {path:'logistic-range',component:LogisticRangeComponent},
  {path:'demand-list',component:DemandComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' , preloadingStrategy: PreloadAllModules})],
    exports: [RouterModule],
    providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  
  })
  export class AppRoutingModule { }
