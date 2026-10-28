import { Component, OnInit, OnDestroy } from '@angular/core';
declare var $: any;
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { ServiceService } from '../../services/service.service';
import { environment } from 'src/environments/environment';

/**
 * Equipment Issue / Dispatch checklist.
 *   /equipment-issue/:bookingId        → new slip from booking requirement (also lists earlier slips)
 *   /equipment-issue/view/:issueId     → work an existing slip (tick store/loaded/delivered, issue, return)
 */
@Component({
  selector: 'app-equipment-issue',
  templateUrl: './equipment-issue.component.html',
  styleUrls: ['./equipment-issue.component.css']
})
export class EquipmentIssueComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  public SiteUrl = environment.documentUrl;

  mode: 'new' | 'view' = 'new';
  bookingId: number = 0;
  issueId: number = 0;

  booking: any = null;
  functions: any[] = [];
  issue: any = null;
  lines: any[] = [];
  missing: string[] = [];
  previous: any[] = [];
  summary: any = { lines: 0, packed: 0, loaded: 0, delivered: 0, returned_lines: 0, damaged: 0 };

  form: any = { issue_date: '', issued_to: '', issued_to_phone: '', vehicle_no: '', driver_name: '', venue: '', notes: '' };

  loading: boolean = false;
  busy: boolean = false;
  search: string = '';
  onlyPending: boolean = false;
  returnMode: boolean = false;

  pdfLoading: boolean = false;
  pdfUrl: string = '';
  safePdfUrl: SafeResourceUrl | null = null;
  waLink: string = '';

  constructor(private appService: ServiceService, private route: ActivatedRoute, private router: Router, private toastr: ToastrService, private sanitizer: DomSanitizer) { }
  ngOnDestroy(): void { this.destroy$.complete(); }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['issueId']) { this.mode = 'view'; this.issueId = Number(p['issueId']); this.loadIssue(); }
      else { this.mode = 'new'; this.bookingId = Number(p['bookingId'] || 0); if (!this.bookingId) { this.router.navigate(['/booking-list']); return; } this.prepare(); }
    });
  }

  /* ---------------- load ---------------- */
  prepare() {
    this.loading = true;
    this.appService.postData('equipment-issue/prepare', { token: localStorage.getItem('token'), booking_id: this.bookingId }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.loading = false; const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      this.booking = r.booking; this.lines = r.lines; this._gKey = ''; this.missing = r.missing || []; this.previous = r.issues || []; this.functions = r.functions || [];
      this.form.issue_date = r.suggested?.issue_date || ''; this.form.venue = r.suggested?.venue || ''; this.form.vehicle_no = r.suggested?.vehicle_no || '';
    }, () => { this.loading = false; this.toastr.error('Server Error', 'Error'); });
  }

  loadIssue() {
    this.loading = true;
    this.appService.postData('equipment-issue/get', { token: localStorage.getItem('token'), issue_id: this.issueId }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.loading = false; const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); this.router.navigate(['/booking-list']); return; }
      this.issue = r.issue; this.booking = r.booking; this.lines = r.items; this._gKey = ''; this.summary = r.summary; this.functions = r.functions || [];
      this.bookingId = this.issue.booking_id;
      this.form = { issue_date: this.issue.issue_date, issued_to: this.issue.issued_to || '', issued_to_phone: this.issue.issued_to_phone || '', vehicle_no: this.issue.vehicle_no || '', driver_name: this.issue.driver_name || '', venue: this.issue.venue || '', notes: this.issue.notes || '', return_date: this.issue.return_date || '' };
      this.lines.forEach(l => { l.packed = !!Number(l.packed); l.loaded = !!Number(l.loaded); l.delivered = !!Number(l.delivered); l.qty_issued = Number(l.qty_issued); l.qty_returned = Number(l.qty_returned); l.qty_damaged = Number(l.qty_damaged); });
      this.returnMode = this.issue.issue_status === 'returned';
    }, () => { this.loading = false; this.toastr.error('Server Error', 'Error'); });
  }

  /* ---------------- helpers ---------------- */
  status(): string { return this.issue ? this.issue.issue_status : 'new'; }
  isDraft(): boolean { return this.status() === 'draft'; }
  isOut(): boolean { return this.status() === 'issued' || this.status() === 'delivered'; }
  isReturned(): boolean { return this.status() === 'returned'; }
  canEditQty(): boolean { return this.mode === 'new' || this.isDraft(); }
  canTick(): boolean { return this.mode === 'view' && !this.isReturned(); }

  visible(): any[] {
    let rows = this.lines;
    if (this.search.trim()) { const s = this.search.toLowerCase(); rows = rows.filter(l => ((l.equipment || '') + ' ' + (l.equipment_category || '')).toLowerCase().includes(s)); }
    if (this.onlyPending && this.mode === 'view') { rows = rows.filter(l => !(l.packed && l.loaded && l.delivered)); }
    return rows;
  }
  // cached: a fresh array on every change-detection pass would re-create the rows (and their ngModels) endlessly
  private _gKey: string = ''; private _groups: any[] = [];
  groups(): any[] {
    const key = this.search + '|' + this.onlyPending + '|' + this.mode + '|' + this.returnMode + '|' + this.lines.length + '|' + this.lines.filter(l => l.packed && l.loaded && l.delivered).length;
    if (key === this._gKey) { return this._groups; }
    const map: any = {}; const out: any[] = [];
    this.visible().forEach(l => { const k = l.equipment_category || 'Other'; if (!map[k]) { map[k] = { name: k, rows: [] }; out.push(map[k]); } map[k].rows.push(l); });
    this._gKey = key; this._groups = out; return out;
  }
  trackRow(_i: number, l: any) { return l.id || l.equipment_id; }
  trackGroup(_i: number, g: any) { return g.name; }
  totalIssued(): number { return this.lines.reduce((s, l) => s + (Number(l.qty_issued) || 0), 0); }
  lineCount(): number { return this.lines.filter(l => Number(l.qty_issued) > 0).length; }
  pct(n: number): number { return this.lines.length ? Math.round(n * 100 / this.lines.length) : 0; }
  fmt(n: number): string { const v = Number(n) || 0; return (Math.round(v * 100) / 100).toString(); }
  missingQty(l: any): number { return Math.max(0, (Number(l.qty_issued) || 0) - (Number(l.qty_returned) || 0) - (Number(l.qty_damaged) || 0)); }
  fillAll() { this.lines.forEach(l => l.qty_issued = l.qty_required); }
  removeLine(l: any) { l.qty_issued = 0; }
  fillReturned() { this.lines.forEach(l => { if (!l.qty_returned && !l.qty_damaged) { l.qty_returned = l.qty_issued; } }); }
  badge(s: string): string { return s === 'issued' ? 'bg-warning' : s === 'delivered' ? 'bg-info' : s === 'returned' ? 'bg-success' : 'bg-secondary'; }

  /* ---------------- actions ---------------- */
  create(thenIssue: boolean) {
    if (this.busy) { return; }
    if (!this.form.issued_to.trim()) { this.toastr.warning('Team member name (Issued To) bharna zaroori hai', 'Required'); return; }
    if (this.lineCount() === 0) { this.toastr.warning('Koi equipment line nahi hai', 'Required'); return; }
    this.busy = true;
    const data = { token: localStorage.getItem('token'), booking_id: this.bookingId, ...this.form, lines: this.lines.map(l => ({ equipment_id: l.equipment_id, qty_required: l.qty_required, qty_issued: l.qty_issued, remarks: l.remarks })) };
    this.appService.postData('equipment-issue/create', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      const r: any = res;
      if (!r.success) { this.busy = false; this.toastr.error(r.message, 'Error'); return; }
      this.toastr.success(r.message, 'Success');
      if (thenIssue) { this.issueId = r.issue_id; this.postStatus('issued', () => this.router.navigate(['/equipment-issue/view/' + r.issue_id])); }
      else { this.busy = false; this.router.navigate(['/equipment-issue/view/' + r.issue_id]); }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
  }

  save() {
    if (this.busy || this.mode !== 'view') { return; }
    this.busy = true;
    const data = { token: localStorage.getItem('token'), issue_id: this.issueId, ...this.form, lines: this.lines.map(l => ({ id: l.id, qty_issued: l.qty_issued, remarks: l.remarks })) };
    this.appService.postData('equipment-issue/update', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.busy = false; const r: any = res;
      if (r.success) { this.toastr.success(r.message, 'Saved'); this.loadIssue(); } else { this.toastr.error(r.message, 'Error'); }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
  }

  tick(l: any, field: 'packed' | 'loaded' | 'delivered') {
    if (!this.canTick() || l._busy) { return; }
    const val = !l[field];
    l[field] = val; l._busy = true;
    // store → load → deliver chain: ticking a later step ticks the earlier ones too
    if (val && field === 'loaded' && !l.packed) { l.packed = true; this.sendTick(l, 'packed', true); }
    if (val && field === 'delivered') { if (!l.packed) { l.packed = true; this.sendTick(l, 'packed', true); } if (!l.loaded) { l.loaded = true; this.sendTick(l, 'loaded', true); } }
    this.sendTick(l, field, val, () => { l._busy = false; this.recount(); });
  }
  private sendTick(l: any, field: string, value: boolean, done?: () => void) {
    this.appService.postData('equipment-issue/tick', { token: localStorage.getItem('token'), item_id: l.id, field: field, value: value ? 1 : 0 }).pipe(takeUntil(this.destroy$)).subscribe(() => { if (done) { done(); } }, () => { l[field] = !value; l._busy = false; this.toastr.error('Server Error', 'Error'); });
  }
  tickAll(field: 'packed' | 'loaded' | 'delivered') {
    if (!this.canTick() || this.busy) { return; }
    this.busy = true;
    const pending = this.visible().filter(l => !l[field]);
    if (!pending.length) { this.busy = false; return; }
    let n = 0;
    pending.forEach(l => { l[field] = true; if (field !== 'packed') { l.packed = true; } if (field === 'delivered') { l.loaded = true; } this.sendTick(l, field, true, () => { n++; if (n === pending.length) { this.busy = false; this.recount(); } }); });
  }
  recount() { this.summary.packed = this.lines.filter(l => l.packed).length; this.summary.loaded = this.lines.filter(l => l.loaded).length; this.summary.delivered = this.lines.filter(l => l.delivered).length; }

  markIssued() {
    if (this.busy) { return; }
    Swal.fire({ title: 'Mark as Issued?', html: '<b>' + this.lineCount() + ' lines · ' + this.fmt(this.totalIssued()) + ' pcs</b><br><small>Stock in store will be reduced by the issue quantities.</small>', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, issue', cancelButtonText: 'No' }).then(r => {
      if (!r.value) { return; }
      this.busy = true;
      // save edits first, then change status
      const data = { token: localStorage.getItem('token'), issue_id: this.issueId, ...this.form, lines: this.lines.map(l => ({ id: l.id, qty_issued: l.qty_issued, remarks: l.remarks })) };
      this.appService.postData('equipment-issue/update', data).pipe(takeUntil(this.destroy$)).subscribe(() => this.postStatus('issued'), () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
    });
  }
  markDelivered() {
    if (this.busy) { return; }
    Swal.fire({ title: 'Delivered at venue?', text: 'All lines will be ticked as received at site.', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No' }).then(r => { if (r.value) { this.busy = true; this.postStatus('delivered'); } });
  }
  revert() {
    if (this.busy) { return; }
    Swal.fire({ title: 'Revert to Draft?', text: 'Stock will be added back to store.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No' }).then(r => { if (r.value) { this.busy = true; this.postStatus('draft'); } });
  }
  private postStatus(to: string, after?: () => void) {
    this.appService.postData('equipment-issue/status', { token: localStorage.getItem('token'), issue_id: this.issueId, issue_status: to }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.busy = false; const r: any = res;
      if (r.success) { this.toastr.success(r.message, 'Success'); if (after) { after(); } else { this.loadIssue(); } }
      else { this.toastr.error(r.message, 'Error'); if (after) { after(); } }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); if (after) { after(); } });
  }

  startReturn() { this.returnMode = true; this.fillReturned(); if (!this.form.return_date) { this.form.return_date = new Date().toISOString().slice(0, 10); } }
  cancelReturn() { this.returnMode = false; this.loadIssue(); }
  submitReturn() {
    if (this.busy) { return; }
    const dmg = this.lines.reduce((s, l) => s + (Number(l.qty_damaged) || 0), 0);
    const miss = this.lines.reduce((s, l) => s + this.missingQty(l), 0);
    Swal.fire({ title: 'Record Return?', html: 'Damaged: <b class="text-danger">' + this.fmt(dmg) + '</b> · Missing: <b class="text-danger">' + this.fmt(miss) + '</b><br><small>Returned quantities go back to stock. This cannot be edited afterwards.</small>', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, record', cancelButtonText: 'No' }).then(r => {
      if (!r.value) { return; }
      this.busy = true;
      const data = { token: localStorage.getItem('token'), issue_id: this.issueId, return_date: this.form.return_date, lines: this.lines.map(l => ({ id: l.id, qty_returned: l.qty_returned, qty_damaged: l.qty_damaged, remarks: l.remarks })) };
      this.appService.postData('equipment-issue/return', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.busy = false; const x: any = res;
        if (x.success) { this.toastr.success(x.message, 'Success'); this.loadIssue(); } else { this.toastr.error(x.message, 'Error'); }
      }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
    });
  }

  deleteIssue() {
    if (this.busy) { return; }
    Swal.fire({ title: 'Delete this slip?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No' }).then(r => {
      if (!r.value) { return; }
      this.busy = true;
      this.appService.putData('equipment-issue/status/update/' + this.issueId + '/3', { token: localStorage.getItem('token') }).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.busy = false; const x: any = res;
        if (x.success) { this.toastr.success(x.message, 'Deleted'); this.router.navigate(['/equipment-issue/' + this.bookingId]); } else { this.toastr.error(x.message, 'Error'); }
      }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
    });
  }

  /* ---------------- PDF ---------------- */
  generatePdf() {
    if (this.pdfLoading || !this.issueId) { return; }
    this.pdfLoading = true; this.safePdfUrl = null; this.pdfUrl = ''; this.waLink = '';
    $('#issuePdfModal').modal('show');
    this.appService.postData('generate/equipment-issue/pdf', { token: localStorage.getItem('token'), issue_id: this.issueId }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.pdfLoading = false; const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      this.pdfUrl = this.SiteUrl + 'storage/pdf/' + r.file_name + '?v=' + Date.now();
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl + '#toolbar=0');
      const text = (r.whatsapp_text || '') + '\n\nPDF: ' + this.SiteUrl + 'storage/pdf/' + r.file_name;
      const phone = r.phone ? (r.phone.length === 10 ? '91' + r.phone : r.phone) : '';
      this.waLink = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
    }, () => { this.pdfLoading = false; this.toastr.error('Server Error', 'Error'); });
  }
  openPdf() { if (this.pdfUrl) { window.open(this.pdfUrl, '_blank'); } }
  shareWhatsApp() { if (this.waLink) { window.open(this.waLink, '_blank'); } }
}
