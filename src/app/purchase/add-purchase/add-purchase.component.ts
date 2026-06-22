import { Component, OnInit,OnDestroy } from '@angular/core';
declare var $: any;
import { ServiceService } from '../../services/service.service';
import { Router,ActivatedRoute } from '@angular/router';
import {from, noop, of, Subject} from 'rxjs';
import {map, mergeAll, mergeMap, takeUntil} from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-add-purchase',
  templateUrl: './add-purchase.component.html',
  styleUrls: ['./add-purchase.component.css']
})
export class AddPurchaseComponent implements OnInit,OnDestroy {

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
  vendors:any = [];

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
    this.getCategory();
    
    this.getRowData();
    this.getVendors();
  }
  getVendors(){
    const data = {
      token: localStorage.getItem('token'),
      type:'Vendor'
    };
    this.appService.postData('customer/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      if(r.success){
        this.vendors = r.users;
      }else{
        this.toastr.error(r.message, 'Error');
      }
    },error =>{
    });
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
      material_category_id: 0,
      raw_material_id:0,
      unit:'',
      qty:0,
      rate:0,
      total:0
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
    this.updatePrice(counter);
  }
  setRate(counter:number){
    this.ingredients[counter].rate = $('#rate_'+counter).val();
    this.updatePrice(counter);
  }
  updatePrice(counter:number){
    var qty = this.ingredients[counter].qty;
    var rate = this.ingredients[counter].rate;
    if(qty > 0 && rate > 0){
       this.ingredients[counter].total = parseInt(qty)*parseInt(rate);
       $('#total_'+counter).val(this.ingredients[counter].total);
    }
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
      supplier_id:$('#supplier_id').val(),
      purchase_date:$('#purchase_date').val(),
      subtotal:$('#subtotal').val(),
      gst_amount:$('#gst_amount').val(),
      total_amount:$('#total_amount').val(),
      remarks:$('#remarks').val(),
      invoice_no:$('#invoice_no').val(),
      items:this.ingredients
    };
    this.appService.postData('purchase/create',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      $('#profileUpdateBtn').html('Submit');
      if(r.success){
        this.toastr.success(r.message, 'Success');
        this.router.navigateByUrl('/purchase-list');
      }else{
        this.toastr.error(r.message, 'Error');
      }
    },error =>{
    });
  }



}

