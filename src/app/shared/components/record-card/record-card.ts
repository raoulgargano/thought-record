import { Component, computed, input, output } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonIcon } from '@ionic/angular';
import { ThoughtRecord } from '../../../core/models/thought-record.model';
import { getMainEmotion } from '../../../core/utils/emotion.util';
import { formatRecordDayLabel, formatRecordTimestamp } from '../../../core/utils/week.util';

@Component({
  selector: 'app-record-card',
  imports: [IonCard, IonCardContent, IonBadge, IonIcon, IonButton],
  templateUrl: './record-card.html',
  styleUrl: './record-card.scss',
})
export class RecordCard {
  readonly record = input.required<ThoughtRecord>();
  readonly showThought = input(false);
  readonly showAllEmotions = input(false);
  readonly deletable = input(false);

  readonly cardClick = output<void>();
  readonly deleteClick = output<void>();

  readonly dayLabel = computed(() => formatRecordDayLabel(this.record().recordDate));
  readonly timeLabel = computed(() => formatRecordTimestamp(this.record().recordDate));
  readonly mainEmotion = computed(() => getMainEmotion(this.record().emotions));

  onCardClick(): void {
    this.cardClick.emit();
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.deleteClick.emit();
  }
}
