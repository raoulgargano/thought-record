import { Injectable } from '@angular/core';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { EmotionEntry, ThoughtRecord } from '../models/thought-record.model';
import { formatWeekLabel, formatWeekRangeShort, WeekRange } from '../utils/week.util';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface WeeklyReportRecord {
  formattedDateTime: string;
  situation: string;
  thought: string;
  beliefLevel: number;
  emotions: EmotionEntry[];
  behavior: string;
}

export interface WeeklyReportData {
  title: string;
  subtitle: string;
  recordCount: number;
  records: WeeklyReportRecord[];
}

const PAGE_MARGIN = 50;
const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4 in points
const BODY_SIZE = 10;
const LABEL_SIZE = 10;
const HEADING_SIZE = 12;
const LINE_HEIGHT = BODY_SIZE * 1.4;
const COLOR_TEXT = rgb(0.13, 0.13, 0.15);
const COLOR_LABEL = rgb(0.29, 0.33, 0.64);
const COLOR_MUTED = rgb(0.45, 0.45, 0.48);
const COLOR_LINE = rgb(0.85, 0.85, 0.88);

/**
 * Renders a clean A4 PDF for a week of thought records using pdf-lib.
 * No network, no server: the document is built entirely in the browser.
 */
@Injectable({ providedIn: 'root' })
export class PdfReportService {
  buildReportData(range: WeekRange, records: ThoughtRecord[]): WeeklyReportData {
    const sorted = [...records].sort((a, b) => a.recordDate.localeCompare(b.recordDate));
    return {
      title: 'REGISTRO DE PENSAMIENTOS',
      subtitle: formatWeekLabel(range),
      recordCount: sorted.length,
      records: sorted.map((record) => ({
        formattedDateTime: format(new Date(record.recordDate), "EEEE d 'de' MMMM, HH:mm", {
          locale: es,
        }),
        situation: record.situation,
        thought: record.thought,
        beliefLevel: record.beliefLevel,
        emotions: record.emotions,
        behavior: record.behavior,
      })),
    };
  }

  async generatePdf(data: WeeklyReportData): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    doc.setTitle(data.title);
    doc.setProducer('Thought Record (thought-record)');
    doc.setCreator('Thought Record');

    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const writer = new PdfWriter(doc, regularFont, boldFont);
    writer.drawTitleBlock(data.title, data.subtitle);

    if (data.records.length === 0) {
      writer.drawEmptyState();
    }

    data.records.forEach((record, index) => {
      writer.drawRecord(record, index);
    });

    writer.drawFooterNote(
      `${data.recordCount} registro${data.recordCount === 1 ? '' : 's'} durante esta semana`,
    );

    return doc.save();
  }

  suggestedFilename(range: WeekRange): string {
    const start = format(range.start, 'yyyy-MM-dd');
    const end = format(range.end, 'yyyy-MM-dd');
    return `registro-pensamientos-${start}_${end}.pdf`;
  }

  weekRangeShortLabel(range: WeekRange): string {
    return formatWeekRangeShort(range);
  }
}

/** Stateful helper that tracks the drawing cursor and paginates automatically. */
class PdfWriter {
  private page: PDFPage;
  private y: number;
  private readonly contentWidth: number;

  constructor(
    private readonly doc: PDFDocument,
    private readonly font: PDFFont,
    private readonly boldFont: PDFFont,
  ) {
    this.page = this.doc.addPage(PAGE_SIZE);
    this.contentWidth = PAGE_SIZE[0] - PAGE_MARGIN * 2;
    this.y = PAGE_SIZE[1] - PAGE_MARGIN;
  }

  private addPage(): void {
    this.page = this.doc.addPage(PAGE_SIZE);
    this.y = PAGE_SIZE[1] - PAGE_MARGIN;
  }

  private ensureSpace(height: number): void {
    if (this.y - height < PAGE_MARGIN) {
      this.addPage();
    }
  }

  private wrapText(text: string, font: PDFFont, size: number): string[] {
    const paragraphs = text.length > 0 ? text.split(/\r?\n/) : [''];
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
      if (words.length === 0) {
        lines.push('');
        continue;
      }

      let currentLine = '';
      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(candidate, size);
        if (width > this.contentWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = candidate;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  private drawParagraph(
    text: string,
    options: { size: number; font: PDFFont; color: typeof COLOR_TEXT },
  ): void {
    const lines = this.wrapText(text, options.font, options.size);
    for (const line of lines) {
      this.ensureSpace(LINE_HEIGHT);
      this.page.drawText(line, {
        x: PAGE_MARGIN,
        y: this.y - options.size,
        size: options.size,
        font: options.font,
        color: options.color,
      });
      this.y -= LINE_HEIGHT;
    }
  }

  drawTitleBlock(title: string, subtitle: string): void {
    this.ensureSpace(60);
    this.page.drawText(title, {
      x: PAGE_MARGIN,
      y: this.y - 18,
      size: 18,
      font: this.boldFont,
      color: COLOR_TEXT,
    });
    this.y -= 30;
    this.page.drawText(subtitle, {
      x: PAGE_MARGIN,
      y: this.y - 12,
      size: 12,
      font: this.font,
      color: COLOR_MUTED,
    });
    this.y -= 34;
  }

  drawEmptyState(): void {
    this.drawParagraph('No se registraron pensamientos durante esta semana.', {
      size: BODY_SIZE,
      font: this.font,
      color: COLOR_MUTED,
    });
    this.y -= 10;
  }

  private drawSectionLabel(label: string, question: string): void {
    this.ensureSpace(LINE_HEIGHT * 2);
    this.page.drawText(label, {
      x: PAGE_MARGIN,
      y: this.y - LABEL_SIZE,
      size: LABEL_SIZE,
      font: this.boldFont,
      color: COLOR_LABEL,
    });
    this.y -= LINE_HEIGHT;
    this.page.drawText(question, {
      x: PAGE_MARGIN,
      y: this.y - BODY_SIZE,
      size: BODY_SIZE,
      font: this.font,
      color: COLOR_MUTED,
    });
    this.y -= LINE_HEIGHT;
  }

  drawRecord(record: WeeklyReportRecord, index: number): void {
    this.ensureSpace(LINE_HEIGHT * 3);
    if (index > 0) {
      this.y -= 6;
      this.ensureSpace(LINE_HEIGHT);
      this.page.drawLine({
        start: { x: PAGE_MARGIN, y: this.y },
        end: { x: PAGE_MARGIN + this.contentWidth, y: this.y },
        thickness: 1,
        color: COLOR_LINE,
      });
      this.y -= 18;
    }

    this.ensureSpace(HEADING_SIZE + LINE_HEIGHT);
    this.page.drawText(capitalize(record.formattedDateTime), {
      x: PAGE_MARGIN,
      y: this.y - HEADING_SIZE,
      size: HEADING_SIZE,
      font: this.boldFont,
      color: COLOR_TEXT,
    });
    this.y -= HEADING_SIZE + 10;

    this.drawSectionLabel('SITUACIÓN', '¿Qué ocurrió?');
    this.drawParagraph(record.situation || '—', {
      size: BODY_SIZE,
      font: this.font,
      color: COLOR_TEXT,
    });
    this.y -= 10;

    this.drawSectionLabel('PENSAMIENTO', '¿Qué pensé?');
    this.drawParagraph(record.thought || '—', {
      size: BODY_SIZE,
      font: this.font,
      color: COLOR_TEXT,
    });
    this.y -= 6;

    this.ensureSpace(LINE_HEIGHT);
    this.drawParagraph(`Nivel de creencia: ${record.beliefLevel}/10`, {
      size: BODY_SIZE,
      font: this.boldFont,
      color: COLOR_TEXT,
    });
    this.y -= 6;

    this.ensureSpace(LINE_HEIGHT * 2);
    this.page.drawText('EMOCIONES', {
      x: PAGE_MARGIN,
      y: this.y - LABEL_SIZE,
      size: LABEL_SIZE,
      font: this.boldFont,
      color: COLOR_LABEL,
    });
    this.y -= LINE_HEIGHT;

    if (record.emotions.length === 0) {
      this.drawParagraph('Sin emociones registradas.', {
        size: BODY_SIZE,
        font: this.font,
        color: COLOR_MUTED,
      });
    } else {
      for (const emotion of record.emotions) {
        this.drawParagraph(`${emotion.name} — ${emotion.intensity}/10`, {
          size: BODY_SIZE,
          font: this.font,
          color: COLOR_TEXT,
        });
      }
    }
    this.y -= 10;

    this.drawSectionLabel('CONDUCTAS', '¿Cómo reaccioné?');
    this.drawParagraph(record.behavior || '—', {
      size: BODY_SIZE,
      font: this.font,
      color: COLOR_TEXT,
    });
    this.y -= 12;
  }

  drawFooterNote(text: string): void {
    this.ensureSpace(LINE_HEIGHT * 2);
    this.y -= 10;
    this.page.drawText(text, {
      x: PAGE_MARGIN,
      y: this.y - BODY_SIZE,
      size: BODY_SIZE,
      font: this.font,
      color: COLOR_MUTED,
    });
  }
}

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
