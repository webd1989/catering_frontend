import { Component, OnInit,OnDestroy } from '@angular/core';
declare var $: any;
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import {from, noop, of, Subject} from 'rxjs';
import {map, mergeAll, mergeMap, takeUntil} from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.css']
})
export class BookingListComponent implements OnInit,OnDestroy {

  users:any;
  franchise:any;
  p: number = 1;
  total: number = 0;
  heading:any = '';
  action:any = '';
  eventTypes:any = [];
  eventTypesRows:any = [];
  payments:any = [];
  ranges:any = [];

  destroy$ = new Subject();

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
    this.getEventTypes();
    this.getLogisticRange();
  }
  getLogisticRange(){
    var data = {
      token: localStorage.getItem('token')
    }
     this.appService.postData('range/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      this.ranges = r.records;
    },error=>{
      this.toastr.error("Server Error","Error");
    });
  }
  addPaymentRow(){
    this.payments.push({
      'amount':0,
      'payment_method':'Cash',
      'payment_date':''
    });
  }
  addMore(){
    this.eventTypesRows.push({
      'event_type_id':'',
      'per_person':'',
      'no_of_guest':'',
      'event_date':'',
      'id':0
    });
  }
  removePaymentRow(i:number){
    this.payments.splice(i, 1);
  }
  setAmount(j:number){
    this.payments[j].amount = $('#amount_'+j).val();
  }
  setPaymentDate(j:number){
    this.payments[j].payment_date = $('#payment_date_'+j).val();
  }
  setPaymentMethod(j:number){
    this.payments[j].payment_method = $('#payment_method_'+j).val();
  }
  setEventType(i:number){
      this.eventTypesRows[i].event_type_id = $('#event_type_id_'+i).val();
  }
  setPerPerson(i:number){
      this.eventTypesRows[i].per_person = $('#per_person_rate_'+i).val();
  }
  setEventDate(i:number){
    this.eventTypesRows[i].event_date = $('#event_date_'+i).val();
  }
  setNoOfGuest(i:number){
      this.eventTypesRows[i].no_of_guest = $('#no_of_guest_'+i).val();
  }
  removeRow(i:number){
    this.eventTypesRows.splice(i, 1);
  }
  getEventTypes(){
    var data = {
      token: localStorage.getItem('token')
    }
     this.appService.postData('event-type/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      this.eventTypes = r.records;
    },error=>{
      this.toastr.error("Server Error","Error");
    });
  }
  Create(){
    $('#addUserBtn').html('Processing...');
    const data = {
      id:$('#r_id').val(),
      name:$('#name').val(),
      phone:$('#phone').val(),
      email:$('#email').val(),
      event_date:$('#event_date').val(),
      address:$('#address').val(),
      location:$('#location').val(),
      no_of_guest:$('#no_of_guest').val(),
      advance_amt:$('#advance_amt').val(),
      vehicle_no:$('#vehicle_no').val(),
      deleivery_time:$('#deleivery_time').val(),
      payment_mode:$('#payment_mode').val(),
      advance_date:$('#advance_date').val(),
      location_url:$('#location_url').val(),
      logistic_range:$('#logistic_range').val(),
      gst:$('#gst').val(),
      eventTypesRows:this.eventTypesRows,
      payment_info:this.payments
    };
    if(this.action == 'Add'){
      this.appService.postData('booking/create',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
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
      this.appService.postData('booking/update',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
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

  cleanForm(){
    $('#name').val('');
    $('#phone').val('');
    $('#email').val('');
    $('#event_date').val('');
    $('#address').val('');
    $('#location').val('');
    $('#no_of_guest').val('');
    $('#advance_amt').val('');
    $('#logistic_range').val('');
  }
  getList(){
    const data = {
      token: localStorage.getItem('token'),
      page: this.p
    };
    this.getListFromServer(data);
  }
  getListFromServer(form:any){
    this.appService.postData('booking/list',form).pipe(takeUntil(this.destroy$)).subscribe(res=>{
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
  setHeading(){
    this.action = 'Add';
    this.heading = 'Create Booking';
    this.cleanForm();
    this.eventTypesRows = [];
  }
  getUser(id:number){
    this.heading = 'Edit Booking';
    this.action = 'Edit';
    const data = {
      token: localStorage.getItem('token'),
      id: id
    };
    this.appService.postData('booking/get',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      if(r.success){
        $('#r_id').val(r.user.id);
        $('#name').val(r.user.name);
        $('#email').val(r.user.email);
        $('#phone').val(r.user.phone);
        $('#event_date').val(r.user.event_date);
        $('#address').val(r.user.address);
        $('#location').val(r.user.location);
        $('#no_of_guest').val(r.user.no_of_guest);
        $('#advance_amt').val(r.user.advance_amt);
        $('#vehicle_no').val(r.user.vehicle_no),
        $('#deleivery_time').val(r.user.deleivery_time),
        $('#payment_mode').val(r.user.payment_mode),
        $('#advance_date').val(r.user.advance_date),
        $('#location_url').val(r.user.location_url),
        $('#logistic_range').val(r.user.logistic_range),
        $('#gst').val(r.user.gst),
        this.payments = [];
        this.payments = r.user.payment_info;

       if (r.user.payment_info) {
        const paymentInfo = JSON.parse(r.user.payment_info);
        
        this.payments = []; // Pehle empty kar
        paymentInfo.forEach((value: any, index: number) => {
          this.payments.push({
            amount: value.amount,  
            payment_method: value.payment_method,
            payment_date: value.payment_date
          });
        });
      }
        this.eventTypesRows = [];
        if(r.user.booked_event_types.length > 0){
          $.each(r.user.booked_event_types, (index: any, value: any ) => {
            this.eventTypesRows.push({
              id:value.id,
              event_type_id: value.event_type_id,  
              per_person: value.rate,
              no_of_guest: value.no_of_guest,
              event_date:value.event_date
            });
          });
        }
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
    this.appService.putData('booking/status/update/'+userID+'/'+status,data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      this.getList();
    },error=>{
      this.toastr.error("Server Error","Error");
    });
  }
  searchData(){
    const data = {
      token: localStorage.getItem('token'),
      search_key: $("#search_key").val(),
      page: this.p
    };
    this.getListFromServer(data);
  }
  reset(){
    const data = {
      token: localStorage.getItem('token'),
      name: '',
      email: '',
      phone: '',
      zipcode: '',
      page: this.p
    };
    this.getListFromServer(data);
  }
  search(){

  }

}

