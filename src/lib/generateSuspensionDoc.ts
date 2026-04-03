import {
  Document, Packer, Paragraph, TextRun, AlignmentType
} from "docx";
import { saveAs } from "file-saver";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface SuspensionData {
  employeeName: string;
  pis: string;
  cpf: string;
  companyName: string;
  cnpj: string;
  startDate: Date;
  suspensionDays: number;
  previousWarnings: string[];
  previousSuspensions: string[];
  recentAbsenceDate: string;
  unjustifiedAbsences: string[];
}

function formatDateBR(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

function formatDateFull(date: Date): string {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function generateSuspensionDoc(data: SuspensionData) {
  const endDate = addDays(data.startDate, data.suspensionDays - 1);
  const returnDate = addDays(endDate, 1);

  // Build the justification paragraph
  const justificationRuns: TextRun[] = [];

  justificationRuns.push(
    new TextRun({
      text: `Devido às suas repetidas ausências não justificadas`,
      font: "Arial",
      size: 22,
    })
  );

  if (data.recentAbsenceDate) {
    justificationRuns.push(
      new TextRun({
        text: `, inclusive a mais recente em ${data.recentAbsenceDate}`,
        font: "Arial",
        size: 22,
      })
    );
  }

  if (data.previousSuspensions.length > 0) {
    justificationRuns.push(
      new TextRun({
        text: `, e após já ter recebido ${data.previousSuspensions.length === 1 ? "uma suspensão" : data.previousSuspensions.length + " suspensões"} `,
        font: "Arial",
        size: 22,
      })
    );
    justificationRuns.push(
      new TextRun({
        text: data.previousSuspensions.join(" e "),
        font: "Arial",
        size: 22,
        bold: true,
      })
    );
  }

  if (data.previousWarnings.length > 0 || data.unjustifiedAbsences.length > 0) {
    justificationRuns.push(
      new TextRun({
        text: ` e advertências formais anteriormente aplicadas`,
        font: "Arial",
        size: 22,
      })
    );

    if (data.unjustifiedAbsences.length > 0) {
      justificationRuns.push(
        new TextRun({
          text: ` (Faltas sem justificativas nos dias ${data.unjustifiedAbsences.join(", ")})`,
          font: "Arial",
          size: 22,
        })
      );
    }
  }

  justificationRuns.push(
    new TextRun({
      text: `, estamos procedendo com uma suspensão de ${data.suspensionDays.toString().padStart(2, "0")} dia${data.suspensionDays > 1 ? "s" : ""}. `,
      font: "Arial",
      size: 22,
    })
  );

  justificationRuns.push(
    new TextRun({
      text: "Esta medida é necessária para enfatizar a seriedade do cumprimento das responsabilidades e o impacto negativo que suas faltas geram na equipe e nos processos da empresa. ",
      font: "Arial",
      size: 22,
    })
  );

  justificationRuns.push(
    new TextRun({
      text: "É importante lembrar que, conforme previsto no artigo 482 da Consolidação das Leis do Trabalho (CLT), a continuidade desse comportamento pode resultar em demissão por justa causa. ",
      font: "Arial",
      size: 22,
    })
  );

  justificationRuns.push(
    new TextRun({
      text: "ATENÇÃO: A próxima falta injustificada pode levar a DEMISSÃO COM JUSTA CAUSA.",
      font: "Arial",
      size: 22,
      bold: true,
    })
  );

  justificationRuns.push(
    new TextRun({
      text: " Esperamos que, ao retornar, você demonstre um compromisso renovado com suas obrigações profissionais.",
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
              new TextRun({
                text: "TERMO DE SUSPENSÃO",
                font: "Arial",
                size: 28,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Pelo presente fica V. S. suspenso no:",
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Período de: ",
                font: "Arial",
                size: 22,
                bold: true,
              }),
              new TextRun({
                text: `${formatDateBR(data.startDate)} a ${formatDateBR(endDate)}`,
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Total de dias de suspensão: ",
                font: "Arial",
                size: 22,
                bold: true,
              }),
              new TextRun({
                text: data.suspensionDays.toString(),
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Data de retorno ao trabalho: ",
                font: "Arial",
                size: 22,
                bold: true,
              }),
              new TextRun({
                text: formatDateBR(returnDate),
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Pelas faltas discriminadas abaixo:",
                font: "Arial",
                size: 22,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
            children: justificationRuns,
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          new Paragraph({
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "Esperamos que no futuro procure não incorrer em novas faltas.",
                font: "Arial",
                size: 22,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          // Employee data
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "PIS: ", font: "Arial", size: 22, bold: true }),
              new TextRun({ text: data.pis, font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "________________________________________",
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: data.employeeName,
                font: "Arial",
                size: 22,
                bold: true,
              }),
            ],
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
            children: [
              new TextRun({
                text: "________________________________________",
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: data.companyName,
                font: "Arial",
                size: 22,
                bold: true,
              }),
            ],
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

export async function downloadSuspensionDoc(data: SuspensionData) {
  const doc = generateSuspensionDoc(data);
  const blob = await Packer.toBlob(doc);
  const fileName = `suspensao_${data.employeeName.replace(/\s+/g, "_").toLowerCase()}_${formatDateBR(data.startDate).replace(/\//g, "-")}.docx`;
  saveAs(blob, fileName);
}
