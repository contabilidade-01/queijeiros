import {
  Document, Packer, Paragraph, TextRun, AlignmentType
} from "docx";
import { saveAs } from "file-saver";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WarningData {
  employeeName: string;
  pis: string;
  cpf: string;
  companyName: string;
  cnpj: string;
  warningDate: Date;
  reason: string;
  previousWarnings: string[];
  unjustifiedAbsences: string[];
}

function formatDateBR(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function generateWarningDoc(data: WarningData) {
  const reasonRuns: TextRun[] = [];

  reasonRuns.push(
    new TextRun({
      text: data.reason,
      font: "Arial",
      size: 22,
    })
  );

  if (data.previousWarnings.length > 0) {
    reasonRuns.push(
      new TextRun({
        text: ` Advertências anteriores aplicadas: ${data.previousWarnings.join(", ")}.`,
        font: "Arial",
        size: 22,
      })
    );
  }

  if (data.unjustifiedAbsences.length > 0) {
    reasonRuns.push(
      new TextRun({
        text: ` Faltas sem justificativa: ${data.unjustifiedAbsences.join(", ")}.`,
        font: "Arial",
        size: 22,
      })
    );
  }

  reasonRuns.push(
    new TextRun({
      text: " É importante lembrar que, conforme previsto no artigo 482 da Consolidação das Leis do Trabalho (CLT), a continuidade desse comportamento pode resultar em penalidades mais severas, incluindo suspensão ou demissão por justa causa.",
      font: "Arial",
      size: 22,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: "TERMO DE ADVERTÊNCIA", font: "Arial", size: 28, bold: true }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Data: ", font: "Arial", size: 22, bold: true }),
              new TextRun({ text: formatDateBR(data.warningDate), font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Pelo presente, fica V. S. advertido(a) pelos seguintes motivos:", font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
            children: reasonRuns,
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          new Paragraph({
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "Esperamos que no futuro procure não incorrer em novas faltas, sob pena de aplicação de penalidades mais severas.",
                font: "Arial",
                size: 22,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          ...(data.pis ? [
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({ text: "PIS: ", font: "Arial", size: 22, bold: true }),
                new TextRun({ text: data.pis, font: "Arial", size: 22 }),
              ],
            }),
          ] : []),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: "________________________________________", font: "Arial", size: 22 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: data.employeeName, font: "Arial", size: 22, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({ text: "CPF: ", font: "Arial", size: 22 }),
              new TextRun({ text: data.cpf, font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: "________________________________________", font: "Arial", size: 22 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: data.companyName, font: "Arial", size: 22, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "CNPJ: ", font: "Arial", size: 22 }),
              new TextRun({ text: data.cnpj, font: "Arial", size: 22 }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

export async function downloadWarningDoc(data: WarningData) {
  const doc = generateWarningDoc(data);
  const blob = await Packer.toBlob(doc);
  const fileName = `advertencia_${data.employeeName.replace(/\s+/g, "_").toLowerCase()}_${formatDateBR(data.warningDate).replace(/\//g, "-")}.docx`;
  saveAs(blob, fileName);
}
