import { Component, OnInit, OnDestroy } from '@angular/core';
declare var $: any;
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { ServiceService } from '../../services/service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-booking-requirement',
  templateUrl: './booking-requirement.component.html',
  styleUrls: ['./booking-requirement.component.css']
})
export class BookingRequirementComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  public SiteUrl = environment.documentUrl;

  bookingId: number = 0;
  type: 'equipment' | 'material' = 'equipment';
  booking: any = null;
  groups: any[] = [];
  functions: any[] = [];
  missing: string[] = [];
  summary: any = { lines: 0, short_lines: 0, est_cost: 0, functions: 0, missing: 0 };
  loading: boolean = false;
  onlyShort: boolean = false;
  search: string = '';
  collapsed: { [k: string]: boolean } = {};

  pdfLoading: boolean = false;
  pdfUrl: string = '';
  safePdfUrl: SafeResourceUrl | null = null;

  constructor(private appService: ServiceService, private route: ActivatedRoute, private router: Router, private toastr: ToastrService, private sanitizer: DomSanitizer) { }
  ngOnDestroy(): void { this.destroy$.complete(); }

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.params['id'] || 0);
    this.type = this.route.snapshot.queryParams['type'] === 'material' ? 'material' : 'equipment';
    if (!this.bookingId) { this.router.navigate(['/booking-list']); return; }
    this.load();
  }

  switchType(t: 'equipment' | 'material') {
    if (this.type === t) { return; }
    this.type = t;
    this.router.navigate([], { queryParams: { type: t }, replaceUrl: true });
    this.load();
  }

  load() {
    this.loading = true;
    this.appService.postData('booking/requirement', { token: localStorage.getItem('token'), booking_id: this.bookingId, type: this.type }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.loading = false; const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      this.booking = r.booking; this.groups = r.groups; this.functions = r.functions; this.missing = r.missing; this.summary = r.summary;
    }, () => { this.loading = false; this.toastr.error('Server Error', 'Error'); });
  }

  isMat(): boolean { return this.type === 'material'; }
  nameOf(r: any): string { return this.isMat() ? r.material : r.equipment; }
  toggle(c: string) { this.collapsed[c] = !this.collapsed[c]; }
  rowsOf(g: any): any[] {
    let rows = g.rows as any[];
    if (this.onlyShort) { rows = rows.filter(r => r.shortage > 0); }
    if (this.search.trim()) { const s = this.search.toLowerCase(); rows = rows.filter(r => (this.nameOf(r) + ' ' + (r.name_hindi || '') + ' ' + r.items).toLowerCase().includes(s)); }
    return rows;
  }
  visibleGroups(): any[] { return this.groups.filter(g => this.rowsOf(g).length > 0); }

  generatePdf() {
    if (this.pdfLoading) { return; }
    this.pdfLoading = true; this.safePdfUrl = null; this.pdfUrl = '';
    $('#bookingReqPdfModal').modal('show');
    this.appService.postData('generate/booking/requirement/pdf', { token: localStorage.getItem('token'), booking_id: this.bookingId, type: this.type }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.pdfLoading = false; const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      this.pdfUrl = this.SiteUrl + 'storage/pdf/' + r.file_name + '?v=' + Date.now();
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl + '#toolbar=0');
    }, () => { this.pdfLoading = false; this.toastr.error('Server Error', 'Error'); });
  }
  openPdf() { if (this.pdfUrl) { window.open(this.pdfUrl, '_blank'); } }

  inr(n: number): string {
    n = Math.round(Number(n) || 0); let s = String(n);
    if (s.length > 3) { const l = s.slice(-3); let r = s.slice(0, -3); r = r.replace(/\B(?=(\d{2})+(?!\d))/g, ','); s = r + ',' + l; }
    return '₹' + s;
  }
  fmt(n: number): string { const v = Number(n) || 0; return (Math.round(v * 100) / 100).toString(); }
}
