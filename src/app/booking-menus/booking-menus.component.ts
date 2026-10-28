import { Component, OnInit, OnDestroy } from '@angular/core';
declare var $: any;
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ServiceService } from '../services/service.service';

@Component({
  selector: 'app-booking-menus',
  templateUrl: './booking-menus.component.html',
  styleUrls: ['./booking-menus.component.css']
})
export class BookingMenusComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();

  bookingId: number = 0;
  booking: any = null;
  days: any[] = [];
  summary: any = { functions: 0, menus: 0, final: 0, pending: 0, total_pax: 0 };
  templates: any[] = [];
  standalone: any[] = [];
  loading: boolean = false;
  busy: boolean = false;

  // create-menu modal
  sel: any = null;                 // selected function row
  form: any = { title: '', template_id: '', link_menu_id: '' };
  mode: 'create' | 'link' = 'create';

  constructor(
    private appService: ServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnDestroy(): void { this.destroy$.complete(); }

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.params['id'] || 0);
    if (!this.bookingId) { this.router.navigate(['/booking-list']); return; }
    this.load();
  }

  load() {
    this.loading = true;
    const data = { token: localStorage.getItem('token'), booking_id: this.bookingId };
    this.appService.postData('booking/menus/get', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.loading = false;
      const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); this.router.navigate(['/booking-list']); return; }
      this.booking = r.booking; this.days = r.days; this.summary = r.summary;
      this.templates = r.templates; this.standalone = r.standalone_menus;
    }, () => { this.loading = false; this.toastr.error('Server Error', 'Error'); });
  }

  progress(): number { return this.summary.functions ? Math.round(this.summary.menus * 100 / this.summary.functions) : 0; }

  /* ---- create / link ---- */
  openCreate(fn: any) {
    this.sel = fn; this.mode = 'create';
    this.form = { title: (this.booking?.booking_title || '') + ' – ' + fn.function_name + ' (' + this.shortDate(fn.event_date) + ')', template_id: '', link_menu_id: '' };
    $('#menuCreateModal').modal('show');
  }
  openLink(fn: any) {
    this.sel = fn; this.mode = 'link';
    this.form = { title: '', template_id: '', link_menu_id: '' };
    $('#menuCreateModal').modal('show');
  }
  submitModal() {
    if (this.busy || !this.sel) { return; }
    if (this.mode === 'link' && !this.form.link_menu_id) { this.toastr.error('Select a menu to link', 'Error'); return; }
    this.busy = true;
    const url = this.mode === 'create' ? 'booking/event/menu/create' : 'booking/event/menu/link';
    const data: any = { token: localStorage.getItem('token'), booking_event_id: this.sel.booking_event_id };
    if (this.mode === 'create') { data.title = this.form.title; data.template_id = this.form.template_id || 0; }
    else { data.menu_id = this.form.link_menu_id; }
    this.appService.postData(url, data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.busy = false;
      const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      $('#menuCreateModal').modal('hide');
      this.toastr.success(r.message, 'Success');
      if (this.mode === 'create' && r.menu_id) { this.router.navigate(['/edit-menu/' + r.menu_id]); }
      else { this.load(); }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
  }

  unlink(fn: any) {
    Swal.fire({ title: 'Unlink menu?', text: 'The menu stays in Menu List as standalone.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No' })
      .then(r => {
        if (!r.value || this.busy) { return; }
        this.busy = true;
        this.appService.postData('booking/event/menu/unlink', { token: localStorage.getItem('token'), booking_event_id: fn.booking_event_id }).pipe(takeUntil(this.destroy$)).subscribe(res => {
          this.busy = false; const x: any = res;
          if (x.success) { this.toastr.success(x.message, 'Success'); this.load(); } else { this.toastr.error(x.message, 'Error'); }
        }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
      });
  }

  setStatus(fn: any, status: string) {
    if (this.busy || !fn.menu_id) { return; }
    this.busy = true;
    this.appService.postData('menu/status/change', { token: localStorage.getItem('token'), menu_id: fn.menu_id, menu_status: status }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.busy = false; const x: any = res;
      if (x.success) { this.toastr.success(x.message, 'Success'); this.load(); } else { this.toastr.error(x.message, 'Error'); }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
  }

  shortDate(d: string): string {
    if (!d) { return ''; }
    const dt = new Date(d); if (isNaN(dt.getTime())) { return d; }
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  inr(n: number): string {
    n = Math.round(Number(n) || 0); let s = String(n);
    if (s.length > 3) { const l = s.slice(-3); let r = s.slice(0, -3); r = r.replace(/\B(?=(\d{2})+(?!\d))/g, ','); s = r + ',' + l; }
    return '₹' + s;
  }
}
