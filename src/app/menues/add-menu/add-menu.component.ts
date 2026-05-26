import { Component, OnInit,OnDestroy } from '@angular/core';
declare var $: any;
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import {from, noop, of, Subject} from 'rxjs';
import {map, mergeAll, mergeMap, takeUntil} from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-menu',
  templateUrl: './add-menu.component.html',
  styleUrls: ['./add-menu.component.css']
})
export class AddMenuComponent implements OnInit,OnDestroy {

  destroy$ = new Subject();
  fiePath = environment.documentUrl;
  userData:any;
  profilePic:any;
  menues:any = [];
  categories:any = [];
  items:any = [];
  itemIDs:any = [];

  constructor(
    private appService: ServiceService,
    private router: Router,
    private toastr: ToastrService
  ) { }
  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.getCategories();
    this.addMoreRow();
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
    const data = {
        token: localStorage.getItem('token'),
        category_id:$('#category_id_'+counter).val()
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
  Create(){
    $('#profileUpdateBtn').html('Processing...');
    const data = {
      title:$('#title').val(),
      menu_item:this.menues
    };
    this.appService.postData('menu/create',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      $('#profileUpdateBtn').html('Submit');
      if(r.success){
        this.toastr.success(r.message, 'Success');
      }else{
        this.toastr.error(r.message, 'Error');
      }
    },error =>{
    });
  }


}

