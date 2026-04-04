import {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
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

function formatDateFull(date: Date): string {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function lineSeparator(): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC", space: 4 } },
    children: [],
  });
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
        text: ` Registra-se que V.S. já recebeu advertências anteriores: ${data.previousWarnings.join(", ")}.`,
        font: "Arial",
        size: 22,
      })
    );
  }

  if (data.unjustifiedAbsences.length > 0) {
    reasonRuns.push(
      new TextRun({
        text: ` Constam ainda faltas sem justificativa nos dias: ${data.unjustifiedAbsences.join(", ")}.`,
        font: "Arial",
        size: 22,
      })
    );
  }

  reasonRuns.push(
    new TextRun({
      text: " A presente advertência é aplicada com fundamento no artigo 2º da Consolidação das Leis do Trabalho (CLT), que confere ao empregador o poder diretivo e disciplinar sobre seus empregados.",
      font: "Arial",
      size: 22,
    })
  );

  reasonRuns.push(
    new TextRun({
      text: " Ressalta-se que, nos termos do artigo 482 da CLT, a reiteração deste tipo de conduta poderá acarretar penalidades mais severas, incluindo suspensão disciplinar e, em última instância, a rescisão do contrato de trabalho por justa causa.",
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
            margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // Company header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: data.companyName.toUpperCase(),
                font: "Arial",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `CNPJ: ${data.cnpj}`,
                font: "Arial",
                size: 18,
                color: "666666",
              }),
            ],
          }),
          lineSeparator(),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "TERMO DE ADVERTÊNCIA DISCIPLINAR",
                font: "Arial",
                size: 28,
                bold: true,
              }),
            ],
          }),
          // Date
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: formatDateFull(data.warningDate),
                font: "Arial",
                size: 20,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          // Intro
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Pelo presente instrumento, fica o(a) empregado(a) abaixo identificado(a) formalmente advertido(a):",
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          // Employee data
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "Empregado(a): ", font: "Arial", size: 22, bold: true }),
              new TextRun({ text: data.employeeName, font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "CPF: ", font: "Arial", size: 22, bold: true }),
              new TextRun({ text: data.cpf, font: "Arial", size: 22 }),
            ],
          }),
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
          lineSeparator(),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          // Reason
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "MOTIVO DA ADVERTÊNCIA:",
                font: "Arial",
                size: 22,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          new Paragraph({
            spacing: { after: 300 },
            alignment: AlignmentType.JUSTIFIED,
            children: reasonRuns,
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          // Legal basis
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Base Legal: ",
                font: "Arial",
                size: 20,
                bold: true,
                italics: true,
              }),
              new TextRun({
                text: "Art. 2º (poder diretivo do empregador) e Art. 482 (justa causa por reiteração) da Consolidação das Leis do Trabalho — CLT.",
                font: "Arial",
                size: 20,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "Para que produza os devidos efeitos legais, firmo o presente termo em 02 (duas) vias de igual teor e forma.",
                font: "Arial",
                size: 22,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 300 }, children: [] }),
          lineSeparator(),
          new Paragraph({ spacing: { after: 300 }, children: [] }),
          // Signatures
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "________________________________________", font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [
              new TextRun({ text: data.employeeName, font: "Arial", size: 22, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `CPF: ${data.cpf}`, font: "Arial", size: 20, color: "555555" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [
              new TextRun({ text: "Empregado(a)", font: "Arial", size: 18, italics: true, color: "888888" }),
            ],
          }),
          new Paragraph({ spacing: { after: 300 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "________________________________________", font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [
              new TextRun({ text: data.companyName, font: "Arial", size: 22, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `CNPJ: ${data.cnpj}`, font: "Arial", size: 20, color: "555555" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Empregador", font: "Arial", size: 18, italics: true, color: "888888" }),
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
