import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ThoughtRecordRepository } from '../../core/services/thought-record-repository.service';
import { WeeklyReportService } from '../../core/services/weekly-report.service';
import { getCurrentWeekRange, isDateWithinWeek } from '../../core/utils/week.util';
import { RecordCard } from '../../shared/components/record-card/record-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-home',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    RecordCard,
    EmptyState,
    TitleCasePipe,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly repository = inject(ThoughtRecordRepository);
  private readonly weeklyReportService = inject(WeeklyReportService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  readonly isGeneratingReport = signal(false);

  readonly weekRecords = computed(() => {
    const range = getCurrentWeekRange();
    return this.repository
      .records()
      .filter((record) => isDateWithinWeek(new Date(record.recordDate), range));
  });

  goToNewRecord(): void {
    this.router.navigate(['/record/new']);
  }

  goToEditRecord(id: string): void {
    this.router.navigate(['/record', id, 'edit']);
  }

  async generateWeeklyReport(): Promise<void> {
    if (this.isGeneratingReport()) {
      return;
    }

    const records = this.weekRecords();
    if (records.length === 0) {
      const toast = await this.toastController.create({
        message: 'Todavía no hay registros esta semana.',
        duration: 2500,
        position: 'bottom',
      });
      await toast.present();
      return;
    }

    this.isGeneratingReport.set(true);
    try {
      await this.weeklyReportService.generateAndDeliver(getCurrentWeekRange(), records);
    } finally {
      this.isGeneratingReport.set(false);
    }
  }
}
