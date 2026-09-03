import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  cloudDownloadOutline,
  cloudUploadOutline,
  closeCircleOutline,
  closeOutline,
  documentTextOutline,
  downloadOutline,
  homeOutline,
  lockClosedOutline,
  searchOutline,
  settingsOutline,
  shareOutline,
  statsChartOutline,
  trashOutline,
} from 'ionicons/icons';

/** Registers every ionicon used across the app in one place. */
export function registerAppIcons(): void {
  addIcons({
    addOutline,
    alertCircleOutline,
    arrowBackOutline,
    calendarOutline,
    checkmarkCircleOutline,
    chevronBackOutline,
    chevronForwardOutline,
    cloudDownloadOutline,
    cloudUploadOutline,
    closeCircleOutline,
    closeOutline,
    documentTextOutline,
    downloadOutline,
    homeOutline,
    lockClosedOutline,
    searchOutline,
    settingsOutline,
    shareOutline,
    statsChartOutline,
    trashOutline,
  });
}
