import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ServiceService } from '../../services/service.service';
import { environment } from 'src/environments/environment';

export interface QuotationRow {
  id: number;
  event_date: string;
  event_type_id: string;      // '' = custom particular
  particular: string;         // used when event_type_id is '' (custom text)
  pax: number | null;
  rate: number | null;
  is_lumpsum: boolean;
  amount: number;
}

@Component({
  selector: 'app-quotation-form',
  templateUrl: './quotation-form.component.html',
  styleUrls: ['./quotation-form.component.css']
})
export class QuotationFormComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  public SiteUrl = environment.documentUrl;

  rowID: number = 0;              // > 0 = edit mode
  heading: string = 'Create Quotation';
  saving: boolean = false;

  eventTypes: any[] = [];
  customers: any[] = [];

  // ---- header fields ----
  form: any = {
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    event_title: '',
    venue: '',
    city: 'Jaipur',
    quotation_date: this.today(),
    gst_type: 'extra',        // 'extra' | 'percent'
    gst_percent: 18,
    notes: 'Rates are per pax (per person) unless marked as lump sum.\nGST will be charged extra over the above amount, as applicable.'
  };

  rows: QuotationRow[] = [];

  // ---- live totals ----
  subtotal: number = 0;
  gstAmount: number = 0;
  grandTotal: number = 0;
  totalPax: number = 0;

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
    this.rowID = Number(this.route.snapshot.params['id'] || 0);
    this.getEventTypes();
    this.getCustomers();
    if (this.rowID > 0) {
      this.heading = 'Edit Quotation';
      this.loadQuotation();
    } else {
      this.addRow();
      this.addRow();
      this.addRow();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Masters                                                            */
  /* ------------------------------------------------------------------ */

  getEventTypes() {
    const data = { token: localStorage.getItem('token') };
    this.appService.postData('event-type/list/all', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      const r: any = res;
      if (r.success) { this.eventTypes = r.records; }
    }, () => { this.toastr.error('Could not load event types', 'Error'); });
  }

  getCustomers() {
    const data = { token: localStorage.getItem('token'), type: 'Customer' };
    this.appService.postData('customer/list/all', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      const r: any = res;
      if (r.success) { this.customers = r.users; }
    }, () => { });
  }

  /** Pick an existing customer → autofill name/phone/email/city. */
  onCustomerChange() {
    const c = this.customers.find((x: any) => String(x.id) === String(this.form.customer_id));
    if (c) {
      this.form.customer_name  = c.name || c.company || '';
      this.form.customer_phone = c.phone || '';
      this.form.customer_email = c.email || '';
      if (c.city) { this.form.city = c.city; }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Edit mode load                                                     */
  /* ------------------------------------------------------------------ */

  loadQuotation() {
    const data = { token: localStorage.getItem('token'), id: this.rowID };
    this.appService.postData('quotation/get', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); this.router.navigate(['/quotation-list']); return; }
      const q = r.record;
      this.form = {
        customer_id: q.customer_id || '',
        customer_name: q.customer_name || '',
        customer_phone: q.customer_phone || '',
        customer_email: q.customer_email || '',
        event_title: q.event_title || '',
        venue: q.venue || '',
        city: q.city || '',
        quotation_date: q.quotation_date || this.today(),
        gst_type: q.gst_type || 'extra',
        gst_percent: Number(q.gst_percent) > 0 ? Number(q.gst_percent) : 18,
        notes: q.notes || ''
      };
      this.rows = (q.items || []).map((it: any) => ({
        id: it.id,
        event_date: it.event_date,
        event_type_id: it.event_type_id ? String(it.event_type_id) : '',
        particular: it.event_type_id ? '' : (it.particular || ''),
        pax: Number(it.pax) || null,
        rate: it.is_lumpsum == 1 ? null : (Number(it.rate) || null),
        is_lumpsum: it.is_lumpsum == 1,
        amount: Number(it.amount) || 0
      }));
      if (this.rows.length === 0) { this.addRow(); }
      this.recalc();
    }, () => { this.toastr.error('Server Error', 'Error'); });
  }

  /* ------------------------------------------------------------------ */
  /*  Rows                                                               */
  /* ------------------------------------------------------------------ */

  /** New row copies the date of the previous row (multi-function same day is the common case). */
  addRow() {
    const prev = this.rows.length ? this.rows[this.rows.length - 1] : null;
    this.rows.push({
      id: 0,
      event_date: prev ? prev.event_date : '',
      event_type_id: '',
      particular: '',
      pax: prev ? prev.pax : null,
      rate: null,
      is_lumpsum: false,
      amount: 0
    });
    this.focusLastRow();
  }

  /** Scroll the newly added row into view and focus its date (handy on phones). */
  private focusLastRow() {
    setTimeout(() => {
      const rows = document.querySelectorAll('table.qf-table tbody tr');
      const last = rows[rows.length - 1] as HTMLElement | undefined;
      if (!last) { return; }
      last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const el = last.querySelector('select, input:not([type=date])') as HTMLElement | null;
      if (el && window.innerWidth >= 768) { el.focus(); }
    }, 50);
  }

  /** New row for the NEXT day (date + 1) — fast entry for multi-day weddings. */
  addNextDay() {
    const prev = this.rows.length ? this.rows[this.rows.length - 1] : null;
    let d = '';
    if (prev && prev.event_date) {
      const dt = new Date(prev.event_date);
      dt.setDate(dt.getDate() + 1);
      d = this.iso(dt);
    }
    this.rows.push({ id: 0, event_date: d, event_type_id: '', particular: '', pax: prev ? prev.pax : null, rate: null, is_lumpsum: false, amount: 0 });
    this.focusLastRow();
  }

  duplicateRow(i: number) {
    const r = this.rows[i];
    this.rows.splice(i + 1, 0, { ...r, id: 0 });
    this.recalc();
  }

  removeRow(i: number) {
    this.rows.splice(i, 1);
    if (this.rows.length === 0) { this.addRow(); }
    this.recalc();
  }

  toggleLumpsum(i: number) {
    const r = this.rows[i];
    if (r.is_lumpsum) {
      r.rate = null;          // amount typed directly
    } else {
      r.amount = 0;           // back to pax × rate
    }
    this.recalc();
  }

  /** Auto-fill rate from the last row that used the same event type (e.g. Lunch @2500 again). */
  onEventTypeChange(i: number) {
    const r = this.rows[i];
    if (!r.event_type_id || r.rate) { return; }
    for (let k = this.rows.length - 1; k >= 0; k--) {
      if (k !== i && this.rows[k].event_type_id === r.event_type_id && this.rows[k].rate) {
        r.rate = this.rows[k].rate;
        break;
      }
    }
    this.recalc();
  }

  recalc() {
    let sub = 0, pax = 0;
    for (const r of this.rows) {
      if (!r.is_lumpsum) {
        r.amount = Math.round((Number(r.pax) || 0) * (Number(r.rate) || 0) * 100) / 100;
      } else {
        r.amount = Number(r.amount) || 0;
      }
      sub += r.amount;
      pax += Number(r.pax) || 0;
    }
    this.subtotal = sub;
    this.totalPax = pax;
    this.gstAmount = this.form.gst_type === 'percent' ? Math.round(sub * (Number(this.form.gst_percent) || 0)) / 100 : 0;
    this.grandTotal = sub + this.gstAmount;
  }

  /* ------------------------------------------------------------------ */
  /*  Save                                                               */
  /* ------------------------------------------------------------------ */

  validate(): string | null {
    if (!this.form.customer_name.trim()) { return 'Please enter customer name.'; }
    if (!/^\d{10,12}$/.test(String(this.form.customer_phone).trim())) { return 'Phone must be 10–12 digits.'; }
    if (!this.form.quotation_date) { return 'Please select quotation date.'; }
    const valid = this.rows.filter(r => r.event_date && (r.event_type_id || r.particular.trim()) && r.amount > 0);
    if (valid.length === 0) { return 'Add at least one line with date, particular and amount.'; }
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      const touched = r.event_date || r.event_type_id || r.particular || r.pax || r.rate || r.amount;
      if (touched && !(r.event_date && (r.event_type_id || r.particular.trim()) && r.amount > 0)) {
        return 'Row ' + (i + 1) + ' is incomplete (needs date, particular and pax × rate or lump-sum amount).';
      }
    }
    return null;
  }

  save(andPdf: boolean = false) {
    if (this.saving) { return; }          // guard against double click
    this.recalc();
    const err = this.validate();
    if (err) { this.toastr.error(err, 'Error'); return; }

    const data: any = {
      token: localStorage.getItem('token'),
      id: this.rowID,
      ...this.form,
      items: this.rows.map(r => ({
        id: r.id,
        event_date: r.event_date,
        event_type_id: r.event_type_id ? Number(r.event_type_id) : 0,
        particular: r.particular,
        pax: Number(r.pax) || 0,
        rate: Number(r.rate) || 0,
        is_lumpsum: r.is_lumpsum ? 1 : 0,
        amount: r.amount
      }))
    };

    const url = this.rowID > 0 ? 'quotation/update' : 'quotation/create';
    this.saving = true;
    this.appService.postData(url, data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.saving = false;
      const r: any = res;
      if (r.success) {
        this.toastr.success(r.message, 'Success');
        const id = r.id || this.rowID;
        if (andPdf) {
          this.router.navigate(['/quotation-list'], { queryParams: { pdf: id } });
        } else {
          this.router.navigate(['/quotation-list']);
        }
      } else {
        this.toastr.error(r.message, 'Error');
      }
    }, () => { this.saving = false; this.toastr.error('Server Error', 'Error'); });
  }

  cancel() {
    Swal.fire({
      title: 'Discard changes?',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No'
    }).then(res => { if (res.value) { this.router.navigate(['/quotation-list']); } });
  }

  /* ------------------------------------------------------------------ */
  /*  Utils                                                              */
  /* ------------------------------------------------------------------ */

  today(): string { return this.iso(new Date()); }

  iso(d: Date): string {
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const dd = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + m + '-' + dd;
  }

  /** Indian number format: 11025000 → 1,10,25,000 */
  inr(n: number): string {
    n = Math.round((Number(n) || 0) * 100) / 100;
    const [whole, dec] = n.toFixed(2).split('.');
    let s = whole;
    if (s.length > 3) {
      const last3 = s.slice(-3);
      let rest = s.slice(0, -3);
      rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      s = rest + ',' + last3;
    }
    return '₹' + s + (dec !== '00' ? '.' + dec : '');
  }

  trackByIndex(i: number) { return i; }
}
