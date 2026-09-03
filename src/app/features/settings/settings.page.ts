import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  AlertController,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { BackupService, InvalidBackupFileError } from '../../core/services/backup.service';
import { FileExportService } from '../../core/services/file-export.service';
import { ThoughtRecordRepository } from '../../core/services/thought-record-repository.service';

@Component({
  selector: 'app-settings',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonCard,
    IonCardContent,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  private readonly repository = inject(ThoughtRecordRepository);
  private readonly backupService = inject(BackupService);
  private readonly fileExportService = inject(FileExportService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly isExporting = signal(false);
  readonly isImporting = signal(false);
  readonly recordCount = this.repository.records;

  async exportBackup(): Promise<void> {
    if (this.isExporting()) {
      return;
    }
    this.isExporting.set(true);
    try {
      const records = await this.repository.getAll();
      const json = this.backupService.serialize(records);
      const blob = new Blob([json], { type: 'application/json' });
      await this.fileExportService.shareOrDownload(
        blob,
        this.backupService.suggestedFilename(),
        'application/json',
        'Copia de seguridad de Thought Record',
      );
    } finally {
      this.isExporting.set(false);
    }
  }

  triggerImport(): void {
    this.fileInput()?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const backup = this.backupService.parse(text);

      const alert = await this.alertController.create({
        header: 'Importar copia de seguridad',
        message: `Se han encontrado ${backup.recordCount} registro${backup.recordCount === 1 ? '' : 's'}. Los registros existentes con el mismo identificador se actualizarán; el resto se añadirá.`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Importar',
            handler: () => this.applyImport(backup.records),
          },
        ],
      });
      await alert.present();
    } catch (error) {
      const message =
        error instanceof InvalidBackupFileError
          ? error.message
          : 'No se ha podido leer el archivo de copia de seguridad.';
      await this.presentToast(message);
    } finally {
      input.value = '';
    }
  }

  private async applyImport(
    records: Parameters<ThoughtRecordRepository['upsertMany']>[0],
  ): Promise<void> {
    this.isImporting.set(true);
    try {
      const { created, updated } = await this.repository.upsertMany(records);
      await this.presentToast(
        `Importación completada: ${created} nuevos, ${updated} actualizados.`,
      );
    } finally {
      this.isImporting.set(false);
    }
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
    });
    await toast.present();
  }
}
