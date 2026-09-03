import { Component, OnInit } from '@angular/core';
declare var $: any;
import { ServiceService } from '../services/service.service';
import { Router } from '@angular/router';
import {from, noop, of, Subject} from 'rxjs';
import {map, mergeAll, mergeMap, takeUntil} from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

interface Booking {
  id: number;
  title: string;
  customer_name: string;
  date: string;
  start_time?: string;
  end_time?: string;
  status: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  currentMonth: boolean;
  today: boolean;
  bookings: Booking[];
}

@Component({
  selector: 'app-booking-calender',
  templateUrl: './booking-calender.component.html',
  styleUrls: ['./booking-calender.component.css']
})
export class BookingCalenderComponent implements OnInit {

  currentDate: Date = new Date();

  currentMonthName: string = '';
  currentYear: number = 0;

  weeks: CalendarDay[][] = [];

  selectedBooking: Booking | null = null;

  // Test data
  // Later this will come from Laravel API
  bookings: Booking[] = [
    {
      id: 1,
      title: 'Wedding Booking',
      customer_name: 'Rahul Sharma',
      date: '2026-09-03',
      start_time: '10:00',
      end_time: '14:00',
      status: 'confirmed'
    }
  ];

  destroy$ = new Subject();

  constructor(
    private appService: ServiceService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.generateCalendar();
  }
  getBookingsFromDb(){
    const data = {
      token: localStorage.getItem('token')
    };
    this.appService.postData('booking/list/all',data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
      var r:any=res;

    },error=>{
      this.toastr.error("Server Error","Error");
    });
  }

  /**
   * Generate calendar
   */
  generateCalendar(): void {

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.currentMonthName = this.currentDate.toLocaleString('default', {
      month: 'long'
    });

    this.currentYear = year;

    const firstDay = new Date(year, month, 1);

    const lastDay = new Date(year, month + 1, 0);

    // Sunday = 0
    const firstDayIndex = firstDay.getDay();

    const totalDays = lastDay.getDate();

    this.weeks = [];

    let week: CalendarDay[] = [];

    // Previous month's dates
    for (let i = firstDayIndex - 1; i >= 0; i--) {

      const date = new Date(
        year,
        month,
        -i
      );

      week.push(this.createCalendarDay(date, false));

    }

    // Current month's dates
    for (let day = 1; day <= totalDays; day++) {

      const date = new Date(year, month, day);

      week.push(
        this.createCalendarDay(date, true)
      );

      if (week.length === 7) {

        this.weeks.push(week);

        week = [];
      }
    }

    // Next month's dates
    let nextDay = 1;

    while (week.length < 7) {

      const date = new Date(
        year,
        month + 1,
        nextDay++
      );

      week.push(
        this.createCalendarDay(date, false)
      );

    }

    if (week.length > 0) {
      this.weeks.push(week);
    }
  }

  /**
   * Create calendar day
   */
  createCalendarDay(
    date: Date,
    currentMonth: boolean
  ): CalendarDay {

    return {
      date: date,
      day: date.getDate(),
      currentMonth: currentMonth,
      today: this.isToday(date),
      bookings: this.getBookings(date)
    };
  }

  /**
   * Get bookings for particular date
   */
  getBookings(date: Date): Booking[] {

    const dateString = this.formatDate(date);

    return this.bookings.filter(
      booking => booking.date === dateString
    );
  }

  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date: Date): string {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Check today's date
   */
  isToday(date: Date): boolean {

    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Previous month
   */
  previousMonth(): void {

    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );

    this.generateCalendar();
  }

  /**
   * Next month
   */
  nextMonth(): void {

    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );

    this.generateCalendar();
  }

  /**
   * Go to today
   */
  goToToday(): void {

    this.currentDate = new Date();

    this.generateCalendar();
  }

  /**
   * Date click
   */
  dateClick(day: CalendarDay): void {

    console.log('Selected Date:', this.formatDate(day.date));

    // You can open booking create popup here
  }

  /**
   * Booking click
   */
  bookingClick(
    booking: Booking,
    event: Event
  ): void {

    event.stopPropagation();

    this.selectedBooking = booking;

    console.log('Selected Booking:', booking);
  }

  /**
   * Close booking popup
   */
  closeBooking(): void {

    this.selectedBooking = null;
  }

  /**
   * Get status class
   */
  getStatusClass(status: string): string {

    switch (status.toLowerCase()) {

      case 'confirmed':
        return 'booking-confirmed';

      case 'pending':
        return 'booking-pending';

      case 'completed':
        return 'booking-completed';

      case 'cancelled':
        return 'booking-cancelled';

      default:
        return 'booking-default';
    }
  }

}
