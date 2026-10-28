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
  selector: 'app-menu-material',
  templateUrl: './menu-material.component.html',
  styleUrls: ['./menu-material.component.css']
})
export class MenuMaterialComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  public SiteUrl = environment.documentUrl;

  menuId: number = 0;
  menu: any = null;
  /** 'menu' = saved menu (menues table) | 'items' = ad-hoc list of item ids */
  mode: 'menu' | 'items' = 'menu';
  itemIds: number[] = [];
  pax: number = 100;
  loading: boolean = false;
  busy: boolean = false;

  summary: any = { items: 0, material_lines: 0, short_lines: 0, unmapped_items: 0, est_cost: 0, cost_per_pax: 0 };
  groups: any[] = [];
  items: any[] = [];
  unmapped: string[] = [];

  view: 'material' | 'items' = 'material';
  onlyShort: boolean = false;
  search: string = '';
  collapsed: { [k: string]: boolean } = {};

  // PDF modal
  pdfLoading: boolean = false;
  pdfUrl: string = '';
  safePdfUrl: SafeResourceUrl | null = null;

  constructor(
    private appService: ServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnDestroy(): void { this.destroy$.complete(); }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParams;
    const url = this.router.url;
    this.menuId = Number(this.route.snapshot.params['id'] || 0);

    if (url.startsWith('/material-calculator') || qp['items']) {
      // ad-hoc: ?items=12,45,301&pax=500
      this.mode = 'items';
      this.itemIds = String(qp['items'] || '').split(',').map((x: string) => Number(x)).filter((x: number) => x > 0);
      this.pax = Number(qp['pax'] || 100);
      if (this.itemIds.length === 0) { this.toastr.error('No items selected', 'Error'); this.router.navigate(['/items']); return; }
      this.load(this.pax);
      return;
    }
    if (url.startsWith('/item-material')) {
      // single item: /item-requirement/431
      this.mode = 'items';
      this.itemIds = [this.menuId];
      this.load();
      return;
    }
    if (!this.menuId) { this.router.navigate(['/menu-list']); return; }
    this.load();
  }

  load(paxOverride?: number) {
    if (this.loading) { return; }
    this.loading = true;
    const data: any = { token: localStorage.getItem('token') };
    if (paxOverride && paxOverride > 0) { data.pax = paxOverride; }
    let url = 'menu/material/requirement';
    if (this.mode === 'items') { url = 'material/requirement'; data.item_ids = this.itemIds; }
    else { data.menu_id = this.menuId; }
    this.appService.postData(url, data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.loading = false;
      const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      this.menu = r.menu || null;
      this.pax = r.pax;
      this.summary = r.summary;
      this.groups = r.groups;
      this.items = r.items;
      this.unmapped = r.unmapped_items || [];
    }, () => { this.loading = false; this.toastr.error('Server Error', 'Error'); });
  }

  recalc() {
    const p = Number(this.pax) || 0;
    if (p <= 0) { this.toastr.error('Enter pax', 'Error'); return; }
    this.load(p);
  }

  toggle(cat: string) { this.collapsed[cat] = !this.collapsed[cat]; }

  rowsOf(g: any): any[] {
    let rows = g.rows as any[];
    if (this.onlyShort) { rows = rows.filter(r => r.shortage > 0); }
    if (this.search.trim()) {
      const s = this.search.toLowerCase();
      rows = rows.filter(r => (r.material + ' ' + (r.name_hindi || '') + ' ' + r.items).toLowerCase().includes(s));
    }
    return rows;
  }

  visibleGroups(): any[] {
    return this.groups.filter(g => this.rowsOf(g).length > 0);
  }

  generatePdf() {
    if (this.pdfLoading) { return; }
    this.pdfLoading = true; this.safePdfUrl = null; this.pdfUrl = '';
    $('#materialPdfModal').modal('show');
    const data: any = { token: localStorage.getItem('token'), pax: this.pax };
    if (this.mode === 'items') { data.item_ids = this.itemIds; } else { data.menu_id = this.menuId; }
    this.appService.postData('generate/material/pdf', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.pdfLoading = false;
      const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      this.pdfUrl = this.SiteUrl + 'storage/pdf/' + r.file_name + '?v=' + Date.now();
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl + '#toolbar=0');
    }, () => { this.pdfLoading = false; this.toastr.error('Server Error', 'Error'); });
  }

  openPdf() { if (this.pdfUrl) { window.open(this.pdfUrl, '_blank'); } }

  print() { window.print(); }

  trackByEq(i: number, r: any) { return r.raw_material_id; }

  inr(n: number): string {
    n = Math.round(Number(n) || 0);
    let s = String(n);
    if (s.length > 3) { const last3 = s.slice(-3); let rest = s.slice(0, -3); rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); s = rest + ',' + last3; }
    return '₹' + s;
  }

  fmt(n: number): string { const v = Number(n) || 0; return (Math.round(v * 100) / 100).toString(); }
}
