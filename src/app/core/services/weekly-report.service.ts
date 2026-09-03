import { Injectable, inject } from '@angular/core';
import { ThoughtRecord } from '../models/thought-record.model';
import { WeekRange } from '../utils/week.util';
import { FileExportService } from './file-export.service';
import { PdfReportService } from './pdf-report.service';

/**
 * Combines report data preparation, PDF rendering and share/download into
 * the single action both Home and Reports expose as "Generar informe".
 */
@Injectable({ providedIn: 'root' })
export class WeeklyReportService {
  private readonly pdfReportService = inject(PdfReportService);
  private readonly fileExportService = inject(FileExportService);

  async generateAndDeliver(
    range: WeekRange,
    records: ThoughtRecord[],
  ): Promise<'shared' | 'downloaded'> {
    const data = this.pdfReportService.buildReportData(range, records);
    const bytes = await this.pdfReportService.generatePdf(data);
    const filename = this.pdfReportService.suggestedFilename(range);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    return this.fileExportService.shareOrDownload(blob, filename, 'application/pdf', data.title);
  }
}
