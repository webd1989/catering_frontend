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
  selector: 'app-edit-menu',
  templateUrl: './edit-menu.component.html',
  styleUrls: ['./edit-menu.component.css']
})
export class EditMenuComponent implements OnInit,OnDestroy {

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
    this.getCategories();
    this.getRowData();
  }
  ExistMenu(arraySet:any,id:number){
if (arraySet.includes(id)) {
    true;
}
  }
  getRowData(){
      const data = {
        token: localStorage.getItem('token'),
        id:this.rowID
      };
      this.appService.postData('menu/get',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
        var r:any=res;
       this.rowData = r.record;
       if(r.record.menu_item != ''){
            this.menues = JSON.parse(r.record.menu_item);
            if(this.menues.length > 0){
            $.each(this.menues, (index: any, value: any ) => {
              this.itemIDs[index] = value.menu_items;
              this.getItemList(value.category_id,index,this.itemIDs[index]);
              /* this.menues.push({
                id:value.id,
                advance_amt: value.amount,  
                advance_amt_type: value.type,
                advance_amt_desc: value.description,
                advance_amt_date: value.payment_date
              }); */
            });
          }
        }else{
          this.menues = [];
        } 

      },error =>{
       
      });
  }
  selectItem(event: any, id: number, counter: number) {

  if (!this.itemIDs[counter]) {
    this.itemIDs[counter] = [];
  }

  if (event.target.checked) {

    // duplicate avoid
    if (!this.itemIDs[counter].includes(id)) {
      this.itemIDs[counter].push(id);
    }

  } else {

    let index = this.itemIDs[counter].findIndex((x: number) => x === id);

    if (index !== -1) {
      this.itemIDs[counter].splice(index, 1);
    }
  }

  this.menues[counter].menu_items = this.itemIDs[counter];
}
 removeRow(index:number){
    this.menues.splice(index, 1);
  }
  setCateId(counter:number){
    this.menues[counter].category_id = $('#category_id_'+counter).val();
    this.menues[counter].menu_items = [];
    this.itemIDs[counter] = [];
    this.getItemList($('#category_id_'+counter).val(),counter,[]);
  }
  getItemList(catid:number,counter:number,selected:any){
    const data = {
      token: localStorage.getItem('token'),
      category_id:catid,
      selected:selected
    };
    this.appService.postData('item/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      if(r.success){
        this.items[counter] = r.records;
      }else{

      }
    },error =>{

    });
  }
  getCategories(){
      const data = {
        token: localStorage.getItem('token'),
      };
      this.appService.postData('category/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
        var r:any=res;
        if(r.success){
          this.categories = r.records;
        }else{
          
        }
      },error =>{
       
      });
  }
  addMoreRow(){
    this.menues.push({ 
      category_id: '',
      menu_items:''
     });
  }
  Update(){
    $('#profileUpdateBtn').html('Processing...');
    const data = {
      title:$('#title').val(),
      menu_item:this.menues,
      id:this.rowID
    };
    this.appService.postData('menu/update',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
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

