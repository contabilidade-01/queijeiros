import {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType, TabStopPosition
} from "docx";
import { saveAs } from "file-saver";
import { format, addDays } from "date-fns";
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
  isThirdSuspension?: boolean;
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

export function generateSuspensionDoc(data: SuspensionData) {
  const endDate = addDays(data.startDate, data.suspensionDays - 1);
  const returnDate = addDays(endDate, 1);

  // Build justification
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
      text: `, estamos procedendo com uma suspensão disciplinar de ${data.suspensionDays.toString().padStart(2, "0")} (${data.suspensionDays > 1 ? extenso(data.suspensionDays) : "um"}) dia${data.suspensionDays > 1 ? "s" : ""}, `,
      font: "Arial",
      size: 22,
    })
  );

  justificationRuns.push(
    new TextRun({
      text: "com fundamento no artigo 474 da Consolidação das Leis do Trabalho (CLT), que confere ao empregador o poder disciplinar de suspender o empregado por até 30 (trinta) dias consecutivos.",
      font: "Arial",
      size: 22,
    })
  );

  justificationRuns.push(
    new TextRun({
      text: " Esta medida é necessária para enfatizar a seriedade do cumprimento das responsabilidades e o impacto negativo que suas faltas geram na equipe e nos processos da empresa.",
      font: "Arial",
      size: 22,
    })
  );

  justificationRuns.push(
    new TextRun({
      text: " Ressalta-se que, conforme o artigo 482 da CLT, a continuidade desse comportamento pode resultar em rescisão do contrato de trabalho por justa causa.",
      font: "Arial",
      size: 22,
    })
  );

  if (data.isThirdSuspension) {
    justificationRuns.push(
      new TextRun({ text: "\n\n", font: "Arial", size: 22 })
    );
    justificationRuns.push(
      new TextRun({
        text: "ATENÇÃO: A próxima falta injustificada poderá ensejar a RESCISÃO DO CONTRATO DE TRABALHO POR JUSTA CAUSA, nos termos do artigo 482, alínea \"e\" (desídia no desempenho das respectivas funções) da CLT.",
        font: "Arial",
        size: 22,
        bold: true,
      })
    );
  }

  justificationRuns.push(
    new TextRun({
      text: " Esperamos que, ao retornar, demonstre compromisso renovado com suas obrigações profissionais.",
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
          // Title
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
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "TERMO DE SUSPENSÃO DISCIPLINAR",
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
                text: formatDateFull(data.startDate),
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
                text: "Pelo presente instrumento, fica o(a) empregado(a) abaixo identificado(a) suspenso(a) de suas atividades laborais:",
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
          // Period
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "Período de suspensão: ", font: "Arial", size: 22, bold: true }),
              new TextRun({
                text: `${formatDateBR(data.startDate)} a ${formatDateBR(endDate)}`,
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "Total de dias: ", font: "Arial", size: 22, bold: true }),
              new TextRun({
                text: `${data.suspensionDays.toString().padStart(2, "0")} (${data.suspensionDays > 1 ? extenso(data.suspensionDays) : "um"}) dia${data.suspensionDays > 1 ? "s" : ""}`,
                font: "Arial",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "Data de retorno: ", font: "Arial", size: 22, bold: true }),
              new TextRun({ text: formatDateBR(returnDate), font: "Arial", size: 22 }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          lineSeparator(),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          // Justification
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "FUNDAMENTAÇÃO:",
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
            children: justificationRuns,
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
                text: "Art. 2º (poder diretivo do empregador), Art. 474 (suspensão disciplinar) e Art. 482 (justa causa) da Consolidação das Leis do Trabalho — CLT.",
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

function extenso(n: number): string {
  const nomes = [
    "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete",
    "dezoito", "dezenove", "vinte", "vinte e um", "vinte e dois", "vinte e três",
    "vinte e quatro", "vinte e cinco", "vinte e seis", "vinte e sete", "vinte e oito",
    "vinte e nove", "trinta",
  ];
  return nomes[n] || n.toString();
}

export async function downloadSuspensionDoc(data: SuspensionData) {
  const doc = generateSuspensionDoc(data);
  const blob = await Packer.toBlob(doc);
  const fileName = `suspensao_${data.employeeName.replace(/\s+/g, "_").toLowerCase()}_${formatDateBR(data.startDate).replace(/\//g, "-")}.docx`;
  saveAs(blob, fileName);
}
