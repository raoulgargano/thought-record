import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-empty-state',
  imports: [IonIcon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly icon = input('document-text-outline');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}
