import { Component, OnInit } from '@angular/core';

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
    },
    {
      id: 2,
      title: 'Birthday Party',
      customer_name: 'Amit Kumar',
      date: '2026-09-03',
      start_time: '18:00',
      end_time: '21:00',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Corporate Event',
      customer_name: 'ABC Pvt Ltd',
      date: '2026-09-10',
      start_time: '11:00',
      end_time: '16:00',
      status: 'confirmed'
    },
    {
      id: 4,
      title: 'Engagement',
      customer_name: 'Vikas Sharma',
      date: '2026-09-15',
      start_time: '17:00',
      end_time: '22:00',
      status: 'completed'
    },
    {
      id: 5,
      title: 'Wedding Reception',
      customer_name: 'Mohit Jain',
      date: '2026-09-20',
      start_time: '19:00',
      end_time: '23:00',
      status: 'cancelled'
    }
  ];

  ngOnInit(): void {
    this.generateCalendar();
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
