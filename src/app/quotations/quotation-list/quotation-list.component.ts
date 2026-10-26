import { Component, OnInit, OnDestroy } from '@angular/core';
declare var $: any;
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { ServiceService } from '../../services/service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-quotation-list',
  templateUrl: './quotation-list.component.html',
  styleUrls: ['./quotation-list.component.css']
})
export class QuotationListComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  public SiteUrl = environment.documentUrl;

  users: any[] = [];
  p: number = 1;
  total: number = 0;

  search: string = '';
  quotation_status: string = '';
  from_date: string = '';
  to_date: string = '';

  statuses = ['draft', 'sent', 'approved', 'rejected'];

  busy: boolean = false;          // any server action in flight → buttons disabled
  loading: boolean = false;       // list loading

  // PDF modal state
  pdfLoading: boolean = false;
  pdfUrl: string = '';
  safePdfUrl: SafeResourceUrl | null = null;
  pdfQuotation: any = null;
  waLink: string = '';

  constructor(
    private appService: ServiceService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.getList();
    // Came back from form with "Save & Generate PDF"
    const pdfId = Number(this.route.snapshot.queryParams['pdf'] || 0);
    if (pdfId > 0) {
      this.generatePdf(pdfId);
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  List                                                               */
  /* ------------------------------------------------------------------ */

  getList() {
    const data = {
      token: localStorage.getItem('token'),
      search: this.search,
      quotation_status: this.quotation_status,
      from_date: this.from_date,
      to_date: this.to_date,
      page: this.p
    };
    this.loading = true;
    this.appService.postData('quotation/list', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.loading = false;
      const r: any = res;
      this.users = r.users.data;
      this.total = r.users.total;
    }, () => { this.loading = false; this.toastr.error('Server Error', 'Error'); });
  }

  searchData() { this.p = 1; this.getList(); }

  reset() {
    this.search = ''; this.quotation_status = ''; this.from_date = ''; this.to_date = '';
    this.p = 1; this.getList();
  }

  pageChangeEvent(event: number) {
    this.p = event;
    this.getList();
  }

  /* ------------------------------------------------------------------ */
  /*  Actions                                                            */
  /* ------------------------------------------------------------------ */

  changeStatus(row: any, status: string) {
    if (this.busy || row.quotation_status === status) { return; }
    this.busy = true;
    const data = { token: localStorage.getItem('token'), id: row.id, quotation_status: status };
    this.appService.postData('quotation/status/change', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.busy = false;
      const r: any = res;
      if (r.success) { row.quotation_status = status; this.toastr.success(r.message, 'Success'); }
      else { this.toastr.error(r.message, 'Error'); }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
  }

  duplicate(id: number) {
    if (this.busy) { return; }
    this.busy = true;
    const data = { token: localStorage.getItem('token'), id: id };
    this.appService.postData('quotation/duplicate', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.busy = false;
      const r: any = res;
      if (r.success) {
        this.toastr.success(r.message, 'Success');
        this.router.navigate(['/edit-quotation/' + r.id]);
      } else { this.toastr.error(r.message, 'Error'); }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
  }

  Delete(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This quotation will be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.value) {
        if (this.busy) { return; }
        this.busy = true;
        const data = { token: localStorage.getItem('token') };
        this.appService.putData('quotation/status/update/' + id + '/3', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
          this.busy = false;
          const r: any = res;
          if (r.success) { this.toastr.success(r.message, 'Success'); this.getList(); }
          else { this.toastr.error(r.message, 'Error'); }
        }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  PDF + share                                                        */
  /* ------------------------------------------------------------------ */

  generatePdf(id: number) {
    if (this.pdfLoading) { return; }
    this.pdfLoading = true;
    this.safePdfUrl = null;
    this.pdfUrl = '';
    this.waLink = '';
    this.pdfQuotation = this.users.find(u => u.id === id) || null;
    $('#quotationPdfModal').modal('show');

    const data = { token: localStorage.getItem('token'), id: id };
    this.appService.postData('generate/quotation/pdf', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.pdfLoading = false;
      const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); return; }
      // cache-bust so an edited quotation shows the new PDF
      this.pdfUrl = this.SiteUrl + 'storage/pdf/' + r.file_name + '?v=' + Date.now();
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl + '#toolbar=0');

      const text = (r.whatsapp_text || '') + '\n\nPDF: ' + this.SiteUrl + 'storage/pdf/' + r.file_name;
      const phone = r.phone ? (r.phone.length === 10 ? '91' + r.phone : r.phone) : '';
      this.waLink = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
    }, () => { this.pdfLoading = false; this.toastr.error('Server Error', 'Error'); });
  }

  openPdf() {
    if (this.pdfUrl) { window.open(this.pdfUrl, '_blank'); }
  }

  shareWhatsApp() {
    if (this.waLink) { window.open(this.waLink, '_blank'); }
  }

  copyLink() {
    if (!this.pdfUrl) { return; }
    const clean = this.pdfUrl.split('?')[0];
    navigator.clipboard.writeText(clean).then(() => this.toastr.success('PDF link copied', 'Copied'));
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'sent': return 'bg-info';
      case 'rejected': return 'bg-danger';
      case 'converted': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }
}
