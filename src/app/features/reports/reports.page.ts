import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ThoughtRecord } from '../../core/models/thought-record.model';
import { ThoughtRecordRepository } from '../../core/services/thought-record-repository.service';
import { WeeklyReportService } from '../../core/services/weekly-report.service';
import {
  WeekRange,
  formatWeekLabel,
  formatWeekRangeShort,
  getCurrentWeekRange,
  getWeekKey,
  getWeekRange,
} from '../../core/utils/week.util';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface WeekSummary {
  key: string;
  range: WeekRange;
  records: ThoughtRecord[];
  isCurrent: boolean;
}

@Component({
  selector: 'app-reports',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonBadge,
    IonButton,
    EmptyState,
  ],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
})
export class ReportsPage {
  private readonly repository = inject(ThoughtRecordRepository);
  private readonly weeklyReportService = inject(WeeklyReportService);
  private readonly router = inject(Router);

  readonly generatingWeekKey = signal<string | null>(null);

  readonly weeks = computed<WeekSummary[]>(() => {
    const grouped = new Map<string, WeekSummary>();

    for (const record of this.repository.records()) {
      const range = getWeekRange(new Date(record.recordDate));
      const key = getWeekKey(range);
      const existing = grouped.get(key);
      if (existing) {
        existing.records.push(record);
      } else {
        grouped.set(key, { key, range, records: [record], isCurrent: false });
      }
    }

    const currentRange = getCurrentWeekRange();
    const currentKey = getWeekKey(currentRange);
    if (!grouped.has(currentKey)) {
      grouped.set(currentKey, {
        key: currentKey,
        range: currentRange,
        records: [],
        isCurrent: true,
      });
    } else {
      grouped.get(currentKey)!.isCurrent = true;
    }

    return Array.from(grouped.values()).sort((a, b) => b.key.localeCompare(a.key));
  });

  weekLabel(range: WeekRange): string {
    return formatWeekLabel(range);
  }

  weekShortRange(range: WeekRange): string {
    return formatWeekRangeShort(range);
  }

  viewWeek(week: WeekSummary): void {
    this.router.navigate(['/tabs/history'], { queryParams: { week: week.key } });
  }

  async generatePdf(week: WeekSummary): Promise<void> {
    if (this.generatingWeekKey()) {
      return;
    }
    this.generatingWeekKey.set(week.key);
    try {
      await this.weeklyReportService.generateAndDeliver(week.range, week.records);
    } finally {
      this.generatingWeekKey.set(null);
    }
  }
}
