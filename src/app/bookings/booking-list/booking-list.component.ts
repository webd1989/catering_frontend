import { Component, OnInit,OnDestroy } from '@angular/core';
declare var $: any;
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import {from, noop, of, Subject} from 'rxjs';
import {map, mergeAll, mergeMap, takeUntil} from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  eventRows:any = [];
  payments:any = [];
  ranges:any = [];
  pdfUrl = '';
  safePdfUrl: SafeResourceUrl | null = null;
  

  destroy$ = new Subject();

  public SiteUrl = environment.documentUrl;

  constructor(
    private appService: ServiceService,
    private router: Router,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
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
  addMore2(){
    this.eventRows.push({
      'event_date':'',
      'event_attributes':[]
    });
  }
  addMoreEventItems(counter:number){
    if (!this.eventRows[counter].event_attributes) {
      this.eventRows[counter].event_attributes = [];
    }
    this.eventRows[counter].event_attributes.push({
      event_type_id: '',
      per_person: '',
      no_of_guest: '',
      venue: '',
      sub_venue: '',
      event_time: '',
      id: 0
    });
  }
  setEventDate(i:number){
    this.eventRows[i].event_date = $('#event_date_'+i).val();
  }
  removeRow(i:number){
    this.eventRows.splice(i, 1);
  }
  setEventType(i:number,j:number){
    this.eventRows[i].event_attributes[j].event_type_id = $('#event_type_id_'+i+'_'+j).val();
  }
  setPerPerson(i:number,j:number){
    this.eventRows[i].event_attributes[j].per_person = $('#per_person_rate_'+i+'_'+j).val();
  }
  setEventTime(i:number,j:number){
    this.eventRows[i].event_attributes[j].event_time = $('#event_time_'+i+'_'+j).val();
  }
  setVenue(i:number,j:number){
    this.eventRows[i].event_attributes[j].venue = $('#venue_'+i+'_'+j).val();
  }
  setSubVenue(i:number,j:number){
    this.eventRows[i].event_attributes[j].sub_venue = $('#sub_venue_'+i+'_'+j).val();
  }
  setNoOfGuest(i:number,j:number){
      this.eventRows[i].event_attributes[j].no_of_guest = $('#no_of_guest_'+i+'_'+j).val();
  }
  removeInnerRow(i:number,j:number){
    this.eventRows[i].event_attributes.splice(j, 1);
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
      booking_title:$('#booking_title').val(),
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
      booking_status:$('#booking_status').val(),
      gst:$('#gst').val(),
      eventTypesRows:this.eventRows,
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
    $('#booking_title').val('');
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
      search_key: $("#search_key").val(),
      booking_status: $("#f_booking_status").val(),
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
 
  downloadPdf() { 
    if (!this.pdfUrl) { 
      this.toastr.error('PDF available nahi hai', 'Error'); 
      return; 
    } 
    const link = document.createElement('a'); 
    link.href = this.pdfUrl; 
    link.download = 'booking-pad.pdf'; 
    // Kuch mobile browsers ke liye 
    link.target = '_blank'; 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link); 
  }
  generatePdf(id:number){
    const data = {
      token: localStorage.getItem('token'),
      id: id
    };
    this.appService.postData('generate/booking/pdf',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;
      this.pdfUrl = this.SiteUrl+'storage/pdf/'+r.file_name;

      // Angular trusted PDF URL 
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl( this.pdfUrl + '#toolbar=0' );
      //$('#previewIfram').attr( 'src', this.pdfUrl + '#toolbar=0' );
      
      //window.open(this.SiteUrl+'storage/pdf/'+r.file_name,'_blank');
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
        $('#booking_title').val(r.user.booking_title);
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
        $('#booking_status').val(r.user.booking_status),
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
        this.eventRows = [];
        

        $.each(r.user.booked_event_types, (index: any, value: any) => {

          let eventAttributes: any[] = [];
        
          $.each(value, (i: any, event: any) => {
        
            eventAttributes.push({
              id: event.id,
              event_type_id: event.event_type_id,
              per_person: event.rate,
              no_of_guest: event.no_of_guest,
              venue: event.venue,
              sub_venue: event.sub_venue,
              event_time: event.event_time
            });
        
          });
        
          this.eventRows.push({
            event_date: index,
            event_attributes: eventAttributes
          });
        
        });
          /* if (!this.eventRows[counter].event_attributes) {
            this.eventRows[counter].event_attributes = [];
          }
          this.eventRows[counter].event_attributes.push({
            event_type_id: '',
            per_person: '',
            no_of_guest: '',
            venue: '',
            sub_venue: '',
            event_time: '',
            id: 0
          }); */
        /* this.eventRows.push({
          'event_date':'',
          'event_attributes':[]
        }); */
        /* this.eventTypesRows.push({
          id:value.id,
          event_type_id: value.event_type_id,  
          per_person: value.rate,
          no_of_guest: value.no_of_guest,
          event_date:value.event_date,
          venue:value.venue,
          sub_venue:value.sub_venue,
          event_time:value.event_time
        }); */
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
      booking_status: $("#f_booking_status").val(),
      page: this.p
    };
    this.getListFromServer(data);
  }
  reset(){
    const data = {
      token: localStorage.getItem('token'),
      search_key: '',
      booking_status: ''
    };
    this.getListFromServer(data);
  }
  search(){

  }

}

