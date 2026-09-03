import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ThoughtRecord } from '../../core/models/thought-record.model';
import { ThoughtRecordRepository } from '../../core/services/thought-record-repository.service';
import {
  WeekRange,
  formatWeekLabel,
  getNextWeekRange,
  getPreviousWeekRange,
  getWeekRange,
  isDateWithinWeek,
} from '../../core/utils/week.util';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { RecordCard } from '../../shared/components/record-card/record-card';

@Component({
  selector: 'app-history',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonSearchbar,
    FormsModule,
    RecordCard,
    EmptyState,
  ],
  templateUrl: './history.page.html',
  styleUrl: './history.page.scss',
})
export class HistoryPage {
  private readonly repository = inject(ThoughtRecordRepository);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertController = inject(AlertController);

  readonly selectedWeek = signal<WeekRange>(this.resolveInitialWeek());
  readonly searchTerm = signal('');

  readonly weekLabel = computed(() => formatWeekLabel(this.selectedWeek()));

  readonly weekRecords = computed<ThoughtRecord[]>(() => {
    const range = this.selectedWeek();
    const term = this.searchTerm().trim().toLowerCase();

    return this.repository.records().filter((record) => {
      if (!isDateWithinWeek(new Date(record.recordDate), range)) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        record.situation.toLowerCase().includes(term) ||
        record.thought.toLowerCase().includes(term) ||
        record.emotions.some((emotion) => emotion.name.toLowerCase().includes(term))
      );
    });
  });

  private resolveInitialWeek(): WeekRange {
    const weekParam = this.route.snapshot.queryParamMap.get('week');
    if (weekParam) {
      const parsed = new Date(weekParam);
      if (!Number.isNaN(parsed.getTime())) {
        return getWeekRange(parsed);
      }
    }
    return getWeekRange(new Date());
  }

  goToPreviousWeek(): void {
    this.selectedWeek.update((range) => getPreviousWeekRange(range));
  }

  goToNextWeek(): void {
    this.selectedWeek.update((range) => getNextWeekRange(range));
  }

  onSearchChange(value: string | null | undefined): void {
    this.searchTerm.set(value ?? '');
  }

  openRecord(id: string): void {
    this.router.navigate(['/record', id, 'edit']);
  }

  async deleteRecord(record: ThoughtRecord): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar registro',
      message: '¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.repository.delete(record.id),
        },
      ],
    });
    await alert.present();
  }
}
