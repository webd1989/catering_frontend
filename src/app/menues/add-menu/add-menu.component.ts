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
  UpdateProfile(){
    $('#profileUpdateBtn').html('Processing...');
    const data = {
      name:$('#name').val(),
      phone:$('#phone').val(),
      address:$('#address').val(),
      city:$('#city').val(),
      state:$('#state').val(),
      country:$('#country').val(),
      zipcode:$('#zipcode').val(),
    };
    this.appService.postData('profile/update',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      $('#profileUpdateBtn').html('Update');
      if(r.success){
        this.toastr.success(r.message, 'Success');
      }else{
        this.toastr.error(r.message, 'Error');
      }
    },error =>{
    });
  }
  uploadDoc(){
    $('#uploadBtn').html('Uploading...');
    var file_data = $('#document').prop('files')[0];
    var form  = new FormData();
    form.append('token',localStorage.getItem('token') as string);
    form.append('file',file_data);
      this.appService.postData('profile/pic/upload',form).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      $('#uploadBtn').html('Upload');
      if(r.success){
        $('#profile_pic').attr('src',r.file_path);
        this.toastr.success(r.message, 'Success');
      }else{
        this.toastr.error(r.message, 'Error');
      }
      });
  }
  GetProfile(){
    this.appService.getData('profile/get').pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      if(r.success){
        this.userData = r.user_date;
      }else{
        
      }
    },error =>{
      Swal.fire(
        'Error',
        'Internal server error',
        'error'
      )
    });
  }

}

