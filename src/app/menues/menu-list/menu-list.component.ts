import { Component, OnInit,OnDestroy } from '@angular/core';
declare var $: any;
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import {from, noop, of, Subject} from 'rxjs';
import {map, mergeAll, mergeMap, takeUntil} from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { DatepickerOptions } from 'ng2-datepicker';
import { getYear } from 'date-fns';
import locale from 'date-fns/locale/en-US';

@Component({
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.css']
})
export class MenuListComponent implements OnInit,OnDestroy {

  users:any;
  p: number = 1;
  total: number = 0;
  heading:any = '';
  action:any = '';
  selectedRow:any = [];
  sub_categories:any = [];
  categories:any = [];
  quotationData:any;
  public SiteUrl = environment.documentUrl;

  destroy$ = new Subject();

  bill_date:any;
  options: DatepickerOptions = {
    minYear: getYear(new Date()) - 30, // minimum available and selectable year
    maxYear: getYear(new Date()) + 30, // maximum available and selectable year
    placeholder: '', // placeholder in case date model is null | undefined, example: 'Please pick a date'
    format: 'Y-M-dd', // date format to display in input
    formatTitle: 'LLLL yyyy',
    formatDays: 'EEEEE',
    firstCalendarDay: 0, // 0 - Sunday, 1 - Monday
    locale: locale, // date-fns locale
    position: 'bottom',
    inputClass: 'deal-close-datepicker', // custom input CSS class to be applied
    calendarClass: 'datepicker-default', // custom datepicker calendar CSS class to be applied
    scrollBarColor: '#dfe3e9', // in case you customize you theme, here you define scroll bar color
  };

  constructor(
    private appService: ServiceService,
    private router: Router,
    private toastr: ToastrService
  ) { }
  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.getList();
    this.getCategories();
  }
 
  setHeading(){
    this.action = 'Add';
    this.heading = 'Create Menu Item';
    this.sub_categories=[];
    this.cleanForm();
  }
  cleanForm(){
    $('#r_id').val('');
    $('#description').val('');
    $('#title').val('');
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
  getSubCategory(type:string){
    if(type == 'Form'){
        var category_id = $('#category_id').val();
    }else{
        var category_id = $('#search_category_id').val();
    }
    
      const data = {
        token: localStorage.getItem('token'),
        category_id:category_id
      };
      this.appService.postData('subcategory/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
        var r:any=res;
        if(r.success){
          this.sub_categories = r.records;
        }else{
          
        }
      },error =>{
       
      });
  }
  Create(){
      $('#addUserBtn').html('Processing...');
      const data = {
        id:$('#r_id').val(),
        description:$('#description').val(),
        title:$('#title').val(),
        category_id:$('#category_id').val(),
        sub_category_id:$('#sub_category_id').val()
      };
      if(this.action == 'Add'){
        this.appService.postData('item/create',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
          var r:any=res;
          $('#addUserBtn').html('Save');
          if(r.success){
            this.getList();
            this.cleanForm();
            this.toastr.success(r.message, 'Success');
            $('#closeBtn').trigger('click');
          }else{
            this.toastr.error(r.message, 'Error');
          }
        },error =>{
        });
      }
      if(this.action == 'Edit'){
        this.appService.postData('item/update',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
          var r:any=res;
          $('#addUserBtn').html('Save');
          if(r.success){
            this.getList();
           this.cleanForm();
            this.toastr.success(r.message, 'Success');
            $('#closeBtn').trigger('click');
          }else{
            this.toastr.error(r.message, 'Error');
          }
        },error =>{
        });
      }
      
    }

  getList(){
    const data = {
      token: localStorage.getItem('token'),
      title_search: $("#title_search").val(),
      status_search: $("#status_search").val(),
      category_id: $("#search_category_id").val(),
      sub_category_id: $("#search_sub_category_id").val(),
      page: this.p
    };
    this.getListFromServer(data);
  }
  getListFromServer(form:any){
    this.appService.postData('item/list',form).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      this.users = r.users.data;
      this.total = r.users.total;
    },error=>{
      this.toastr.error("Server Error","Error");
    });
  }
  /**
   * Write code on Method
   *
   * @return response()
   */
   pageChangeEvent(event: number){
    this.p = event;
    this.getList();
  }
  
 
  Delete(userID:string){
    Swal.fire({
      title: 'Are you sure?',
      text: 'This process is irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
      }).then((result) => {
      if (result.value) {
        this.updateStatus(userID,'3');
        Swal.fire(
          'Removed!',
          'Record removed successfully.',
          'success'
        )
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(
          'Cancelled',
          'Record still in our database.',
          'error'
        )
      }
      })
  }
  updateStatus(userID:string,status:string){
    const data = {};
    this.appService.putData('item/status/update/'+userID+'/'+status,data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      this.getList();
    },error=>{
      this.toastr.error("Server Error","Error");
    });
  }
  getQuotation(id:number){
      this.heading = 'Edit Menu Item';
      this.action = 'Edit';
      const data = {
        token: localStorage.getItem('token'),
        id: id
      };
      this.appService.postData('item/get',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
        var r:any=res;
        if(r.success){
          this.quotationData = r.user;
          this.sub_categories = r.user.sub_categories;
          $('#r_id').val(r.user.id);
          $('#title').val(r.user.title);
          $('#description').val(r.user.description);
        }else{
          
        }
      },error =>{
       
      });
  }
  searchData(){
    const data = {
      token: localStorage.getItem('token'),
      title_search: $("#title_search").val(),
      status_search: $("#status_search").val(),
      category_id: $("#search_category_id").val(),
      sub_category_id: $("#search_sub_category_id").val(),
      page: this.p
    };
    this.getListFromServer(data);
  }
  reset(){
    $("#title_search").val('');
    $("#status_search").val('');
    $("#search_category_id").val('');
    $("#search_sub_category_id").val('');
    const data = {
      token: localStorage.getItem('token'),
      search_key: '',
      status_search:'',
      category_id:'',
      sub_category_id:'',
      page: 1
    };
    this.getListFromServer(data);
  }
  search(){

  }

}

