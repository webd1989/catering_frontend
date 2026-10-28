import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ServiceService } from '../../services/service.service';

@Component({
  selector: 'app-item-equipment',
  templateUrl: './item-equipment.component.html',
  styleUrls: ['./item-equipment.component.css']
})
export class ItemEquipmentComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();

  itemId: number = 0;
  item: any = null;
  records: any[] = [];
  equipments: any[] = [];
  loading: boolean = false;
  busy: boolean = false;

  // add/edit form
  form: any = this.blank();
  editingId: number = 0;
  search: string = '';

  constructor(
    private appService: ServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnDestroy(): void { this.destroy$.complete(); }

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.params['id'] || 0);
    if (!this.itemId) { this.router.navigate(['/items']); return; }
    this.load();
  }

  blank() { return { equipment_id: '', qty: 1, qty_basis: 'fixed', note: '' }; }

  load() {
    this.loading = true;
    const data = { token: localStorage.getItem('token'), item_id: this.itemId };
    this.appService.postData('item-equipment/list', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.loading = false;
      const r: any = res;
      if (!r.success) { this.toastr.error(r.message, 'Error'); this.router.navigate(['/items']); return; }
      this.item = r.item;
      this.records = r.records;
      this.equipments = r.equipments;
    }, () => { this.loading = false; this.toastr.error('Server Error', 'Error'); });
  }

  /** equipment dropdown: hide ones already mapped (unless editing that one) */
  availableEquipments(): any[] {
    const used = new Set(this.records.filter(r => r.id !== this.editingId).map(r => String(r.equipment_id)));
    return this.equipments.filter(e => !used.has(String(e.id)));
  }

  filteredRecords(): any[] {
    if (!this.search.trim()) { return this.records; }
    const s = this.search.toLowerCase();
    return this.records.filter(r => (r.material_name + ' ' + (r.equipment_category || '') + ' ' + (r.note || '')).toLowerCase().includes(s));
  }

  edit(r: any) {
    this.editingId = r.id;
    this.form = { equipment_id: String(r.equipment_id), qty: Number(r.qty), qty_basis: r.qty_basis, note: r.note || '' };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() { this.editingId = 0; this.form = this.blank(); }

  save() {
    if (this.busy) { return; }
    if (!this.form.equipment_id) { this.toastr.error('Please select equipment', 'Error'); return; }
    if (!(Number(this.form.qty) > 0)) { this.toastr.error('Quantity must be greater than 0', 'Error'); return; }
    this.busy = true;
    const data = { token: localStorage.getItem('token'), item_id: this.itemId, id: this.editingId, ...this.form };
    this.appService.postData('item-equipment/save', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.busy = false;
      const r: any = res;
      if (r.success) { this.toastr.success(r.message, 'Success'); this.cancelEdit(); this.load(); }
      else { this.toastr.error(r.message, 'Error'); }
    }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
  }

  remove(r: any) {
    Swal.fire({ title: 'Remove equipment?', text: r.material_name, icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No' })
      .then(result => {
        if (!result.value || this.busy) { return; }
        this.busy = true;
        const data = { token: localStorage.getItem('token') };
        this.appService.putData('item-equipment/status/update/' + r.id + '/3', data).pipe(takeUntil(this.destroy$)).subscribe(res => {
          this.busy = false;
          const x: any = res;
          if (x.success) { this.toastr.success('Removed', 'Success'); this.load(); }
          else { this.toastr.error(x.message, 'Error'); }
        }, () => { this.busy = false; this.toastr.error('Server Error', 'Error'); });
      });
  }

  basisLabel(b: string) { return b === 'per_100_pax' ? 'per 100 pax' : 'per counter / dish'; }
}
