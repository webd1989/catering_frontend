import { Component, OnInit,OnDestroy } from '@angular/core';
declare var $: any;
import { ServiceService } from '../services/service.service';
import { Router,ActivatedRoute } from '@angular/router';
import {from, noop, of, Subject} from 'rxjs';
import {map, mergeAll, mergeMap, takeUntil} from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-menu-item-details',
  templateUrl: './menu-item-details.component.html',
  styleUrls: ['./menu-item-details.component.css']
})
export class MenuItemDetailsComponent implements OnInit,OnDestroy {

  destroy$ = new Subject();
  fiePath = environment.documentUrl;
  userData:any;
  profilePic:any;
  menues:any = [];
  categories:any = [];
  items:any = [];
  itemIDs:any = [];
  rowID:any = 0;
  rowData:any = [];
  ingredients:any = [];
  units:any = [];
  materials:any = [];

  constructor(
    private appService: ServiceService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) { }
  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.rowID = this.route.snapshot.params['id'];
    this.getCategory();
    
    this.getRowData();
  }
  getRowData(){
      const data = {
        token: localStorage.getItem('token'),
        id:this.rowID
      };
      this.appService.postData('item/get',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
        var r:any=res;
       this.rowData = r.user;
       this.ingredients = [];
       if(this.rowData.ingredients.length > 0){
            $.each(this.rowData.ingredients, (index: any, value: any ) => {
              this.ingredients.push({
                id:value.id,
                material_category_id: value.material_category_id,  
                raw_material_id: value.raw_material_id,
                unit: value.unit,
                qty: value.qty
              }); 
              this.materials[index] = value.materials;
            });
          }
      },error =>{});
  }
addMoreRow(){
    this.ingredients.push({
      material_category_id: '0',
      raw_material_id:'0',
      unit:'',
      qty:'',
      id:0
     });
  }
  setMaterialId(counter:number){
    this.ingredients[counter].raw_material_id = $('#material_'+counter).val();
  }
  setUnit(counter:number){
    this.ingredients[counter].unit = $('#unit_'+counter).val();
  }
  setQty(counter:number){
    this.ingredients[counter].qty = $('#qty_'+counter).val();
  }
  getRawMaterialList(counter:number){ 
    
    var category_id = $('#category_'+counter).val();
    this.ingredients[counter].material_category_id = category_id;

    const data = {
          token: localStorage.getItem('token'),
          category_id:category_id
        };
        this.appService.postData('row-material/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
          var r:any=res;
          if(r.success){
            this.materials[counter] = r.records;
          }else{
            this.toastr.error(r.message, 'Error');
          }
        },error =>{
        });
  }
  getCategory(){
    const data = {
      token: localStorage.getItem('token')
    };
    this.appService.postData('material-category/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      if(r.success){
        this.categories = r.records;
        this.getUnit();
      }else{
        this.toastr.error(r.message, 'Error');
      }
    },error =>{
    });
 }
 getUnit(){
    const data = {
      token: localStorage.getItem('token')
    };
    this.appService.postData('unit/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      if(r.success){
        this.units = r.records;
      }else{
        this.toastr.error(r.message, 'Error');
      }
    },error =>{
    });
 }
  

 removeRow(index:number){
    this.ingredients.splice(index, 1);
  }

  Update(){
    $('#profileUpdateBtn').html('Processing...');
    const data = {
      title:$('#title').val(),
      category_id:$('#category_id').val(),
      sub_category_id:$('#sub_category_id').val(),
      cooking_method:$('#cooking_method').val(),
      id:this.rowID,
      ingredients:this.ingredients
    };
    this.appService.postData('item/update',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      $('#profileUpdateBtn').html('Submit');
      if(r.success){
        this.getRowData();
        this.toastr.success(r.message, 'Success');
      }else{
        this.toastr.error(r.message, 'Error');
      }
    },error =>{
    });
  }



}

