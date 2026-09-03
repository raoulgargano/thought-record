import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  CUSTOM_EMOTION_OPTION,
  EmotionEntry,
  PREDEFINED_EMOTIONS,
  ThoughtRecordDraft,
} from '../../core/models/thought-record.model';
import { DraftService } from '../../core/services/draft.service';
import { ThoughtRecordRepository } from '../../core/services/thought-record-repository.service';
import { generateId } from '../../core/utils/id.util';

interface EmotionFormValue {
  id: string;
  preset: string;
  customName: string;
  intensity: number;
}

interface RecordFormValue {
  recordDate: string;
  situation: string;
  thought: string;
  beliefLevel: number;
  emotions: EmotionFormValue[];
  behavior: string;
}

@Component({
  selector: 'app-record-form',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonRange,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
  ],
  templateUrl: './record-form.page.html',
  styleUrl: './record-form.page.scss',
})
export class RecordFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(ThoughtRecordRepository);
  private readonly draftService = inject(DraftService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  private draftSubscription?: Subscription;
  private recordId: string | null = null;

  readonly predefinedEmotions = PREDEFINED_EMOTIONS;
  readonly customEmotionOption = CUSTOM_EMOTION_OPTION;
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);

  readonly form: FormGroup = this.fb.group({
    recordDate: [new Date().toISOString(), Validators.required],
    situation: ['', Validators.required],
    thought: ['', Validators.required],
    beliefLevel: [5, [Validators.required, Validators.min(0), Validators.max(10)]],
    emotions: this.fb.array<FormGroup>([]),
    behavior: [''],
  });

  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar registro' : 'Nuevo registro'));

  get emotionsArray(): FormArray {
    return this.form.get('emotions') as FormArray;
  }

  private get draftKey(): string {
    return this.recordId ? `edit-${this.recordId}` : 'new';
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.recordId = id;
      this.isEditMode.set(true);
      const existing = await this.repository.getById(id);
      if (!existing) {
        await this.presentMissingRecordToast();
        this.location.back();
        return;
      }
      this.patchFormFromRecord(existing.recordDate, existing);
    } else {
      const draft = this.draftService.load<RecordFormValue>(this.draftKey);
      if (draft) {
        this.form.patchValue(draft, { emitEvent: false });
        (draft.emotions ?? []).forEach((emotion) =>
          this.emotionsArray.push(this.buildEmotionGroup(emotion)),
        );
      }
    }

    this.draftSubscription = this.form.valueChanges.pipe(debounceTime(400)).subscribe((value) => {
      this.draftService.save(this.draftKey, value);
    });
  }

  ngOnDestroy(): void {
    this.draftSubscription?.unsubscribe();
  }

  private patchFormFromRecord(
    recordDate: string,
    record: {
      situation: string;
      thought: string;
      beliefLevel: number;
      emotions: EmotionEntry[];
      behavior: string;
    },
  ): void {
    this.form.patchValue(
      {
        recordDate,
        situation: record.situation,
        thought: record.thought,
        beliefLevel: record.beliefLevel,
        behavior: record.behavior,
      },
      { emitEvent: false },
    );
    record.emotions.forEach((emotion) => {
      const isPredefined = (PREDEFINED_EMOTIONS as readonly string[]).includes(emotion.name);
      this.emotionsArray.push(
        this.buildEmotionGroup({
          id: emotion.id,
          preset: isPredefined ? emotion.name : CUSTOM_EMOTION_OPTION,
          customName: isPredefined ? '' : emotion.name,
          intensity: emotion.intensity,
        }),
      );
    });
  }

  private buildEmotionGroup(value?: Partial<EmotionFormValue>): FormGroup {
    return this.fb.group({
      id: [value?.id ?? generateId()],
      preset: [value?.preset ?? PREDEFINED_EMOTIONS[0], Validators.required],
      customName: [value?.customName ?? ''],
      intensity: [
        value?.intensity ?? 5,
        [Validators.required, Validators.min(0), Validators.max(10)],
      ],
    });
  }

  isCustomEmotion(index: number): boolean {
    return this.emotionsArray.at(index).get('preset')?.value === CUSTOM_EMOTION_OPTION;
  }

  addEmotion(): void {
    this.emotionsArray.push(this.buildEmotionGroup());
  }

  removeEmotion(index: number): void {
    this.emotionsArray.removeAt(index);
  }

  private buildEmotionEntries(): EmotionEntry[] {
    return (this.emotionsArray.value as EmotionFormValue[])
      .map((emotion) => ({
        id: emotion.id,
        name: (emotion.preset === CUSTOM_EMOTION_OPTION
          ? emotion.customName
          : emotion.preset
        ).trim(),
        intensity: emotion.intensity,
      }))
      .filter((emotion) => emotion.name.length > 0);
  }

  async save(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const value = this.form.getRawValue() as RecordFormValue;
      const draft: ThoughtRecordDraft = {
        recordDate: value.recordDate,
        situation: value.situation,
        thought: value.thought,
        beliefLevel: value.beliefLevel,
        emotions: this.buildEmotionEntries(),
        behavior: value.behavior,
      };

      if (this.recordId) {
        await this.repository.update(this.recordId, draft);
      } else {
        await this.repository.create(draft);
      }

      this.draftService.clear(this.draftKey);
      this.location.back();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancel(): void {
    this.draftService.clear(this.draftKey);
    this.location.back();
  }

  async confirmDelete(): Promise<void> {
    if (!this.recordId) {
      return;
    }
    const alert = await this.alertController.create({
      header: 'Eliminar registro',
      message: '¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteRecord(),
        },
      ],
    });
    await alert.present();
  }

  private async deleteRecord(): Promise<void> {
    if (!this.recordId) {
      return;
    }
    await this.repository.delete(this.recordId);
    this.draftService.clear(this.draftKey);
    this.location.back();
  }

  private async presentMissingRecordToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'No se ha encontrado el registro.',
      duration: 2500,
      position: 'bottom',
    });
    await toast.present();
  }
}
