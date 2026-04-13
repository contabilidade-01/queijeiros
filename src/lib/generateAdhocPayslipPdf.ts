import { maskCNPJ } from "@/lib/masks";

/** Desconto agregado no recibo ad hoc (vale, adiantamento, farmácia, alimentação). */
export const ADHOC_VALE_COMPOSITE_LABEL = "Vale/Adiantamento/Farmacia/Alimentação";

export interface AdhocPayslipData {
  companyName: string;
  companyCnpjDigits: string;
  refMonthTitle: string;
  employeeName: string;
  employeeCode: string;
  salarioBase: number;
  diasBrutos: number;
  faltasCount: number;
  diasLiquidos: number;
  valorDia: number;
  bruto: number;
  vale: number;
  outros: number;
  liquido: number;
  faltaDatesText: string;
  modoDescricao: string;
}

function moneyPt(n: number): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildDocDefinition(data: AdhocPayslipData) {
  const digits = data.companyCnpjDigits.replace(/\D/g, "").slice(0, 14);
  const cnpjMask = digits.length ? maskCNPJ(digits) : "—";
  const totalDesc = data.vale + data.outros;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfmake table rows are loosely typed
  const rows: any[][] = [
    [
      { text: "Cód.", style: "th" },
      { text: "Descrição", style: "th" },
      { text: "Referência", style: "th", alignment: "right" },
      { text: "Vencimentos", style: "th", alignment: "right" },
      { text: "Descontos", style: "th", alignment: "right" },
    ],
    [
      "8781",
      {
        stack: [
          "SALÁRIO PROPORCIONAL (base ÷30 × dias líquidos)",
          { text: `Modo: ${data.modoDescricao}`, fontSize: 8, color: "#444444" },
          { text: `Faltas (${data.faltasCount}): ${data.faltaDatesText || "—"}`, fontSize: 8, color: "#444444" },
        ],
      },
      { text: moneyPt(data.diasLiquidos), alignment: "right" },
      { text: moneyPt(data.bruto), alignment: "right" },
      { text: "—", alignment: "center" },
    ],
  ];

  if (data.vale > 0) {
    rows.push([
      "",
      ADHOC_VALE_COMPOSITE_LABEL,
      { text: "—", alignment: "center" },
      { text: "—", alignment: "center" },
      { text: moneyPt(data.vale), alignment: "right" },
    ]);
  }
  if (data.outros > 0) {
    rows.push([
      "",
      "Outros descontos",
      { text: "—", alignment: "center" },
      { text: "—", alignment: "center" },
      { text: moneyPt(data.outros), alignment: "right" },
    ]);
  }

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { font: "Roboto", fontSize: 10 },
    styles: {
      th: { bold: true, fillColor: "#eeeeee", fontSize: 9 },
      title: { fontSize: 13, bold: true, alignment: "center" },
      sub: { fontSize: 9, alignment: "center", color: "#555555" },
    },
    content: [
      { text: "RECIBO DE PAGAMENTO DE SALÁRIO — CÁLCULO AVULSO", style: "title", margin: [0, 0, 0, 4] },
      {
        text: "Experiência / treino — conferir com DP ou contabilidade.",
        style: "sub",
        margin: [0, 0, 0, 16],
      },
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: data.companyName || "—", bold: true, fontSize: 11 },
              { text: `CNPJ: ${cnpjMask}`, fontSize: 9 },
            ],
          },
          {
            width: "auto",
            stack: [
              { text: "Folha mensal", bold: true, alignment: "right", fontSize: 10 },
              { text: data.refMonthTitle, alignment: "right", fontSize: 10 },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        columns: [
          { width: 80, text: `Código: ${data.employeeCode}`, fontSize: 9 },
          { width: "*", text: `Nome do funcionário: ${data.employeeName}`, fontSize: 10 },
        ],
        margin: [0, 0, 0, 14],
      },
      {
        table: {
          headerRows: 1,
          widths: [28, "*", 52, 58, 58],
          body: rows,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 14],
      },
      {
        table: {
          widths: ["*", 70, 70, 75],
          body: [
            [
              {
                stack: [
                  { text: `Salário base (contratual): R$ ${moneyPt(data.salarioBase)}`, fontSize: 9 },
                  {
                    text: `Dias brutos: ${data.diasBrutos} · Valor/dia (base÷30): R$ ${moneyPt(data.valorDia)}`,
                    fontSize: 8,
                    color: "#444444",
                  },
                ],
              },
              {
                stack: [
                  { text: "Total vencimentos", bold: true, fontSize: 9 },
                  { text: `R$ ${moneyPt(data.bruto)}`, bold: true, alignment: "right", fontSize: 11 },
                ],
              },
              {
                stack: [
                  { text: "Total descontos", bold: true, fontSize: 9 },
                  { text: `R$ ${moneyPt(totalDesc)}`, bold: true, alignment: "right", fontSize: 11 },
                ],
              },
              {
                stack: [
                  { text: "Valor líquido", bold: true, fontSize: 9 },
                  { text: `R$ ${moneyPt(data.liquido)}`, bold: true, alignment: "right", fontSize: 12 },
                ],
              },
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 28],
      },
      {
        text: "Declaro ter recebido a importância líquida discriminada neste recibo.",
        alignment: "center",
        fontSize: 10,
        margin: [0, 0, 0, 8],
      },
      { text: "Data: _____ / _____ / _________", alignment: "center", fontSize: 10, margin: [0, 0, 0, 20] },
      { text: "____________________________________", alignment: "center", margin: [0, 0, 0, 4] },
      { text: "Assinatura do funcionário", alignment: "center", fontSize: 8, color: "#555555" },
    ],
  };
}

function buildFileName(data: AdhocPayslipData): string {
  const safe = data.employeeName
    .replace(/\s+/g, "_")
    .replace(/[^\w\-àáâãäåèéêëìíîïòóôõöùúûüçñÁÀÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ]/gi, "");
  const monthSafe = data.refMonthTitle.replace(/\s+/g, "_").replace(/[^\w\-àáâã]/gi, "");
  return `holerite_avulso_${safe || "funcionario"}_${monthSafe || "ref"}.pdf`;
}

/** Gera e descarrega o recibo em PDF (pdfmake + Roboto, carregamento dinâmico). */
export async function downloadAdhocPayslipPdf(data: AdhocPayslipData): Promise<void> {
  const [{ default: pdfMake }, pdfFontsMod] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);

  const vfs = (pdfFontsMod as { default?: Record<string, string> }).default ?? pdfFontsMod;
  (pdfMake as { vfs: Record<string, string> }).vfs = vfs;

  const dd = buildDocDefinition(data);
  const fileName = buildFileName(data);

  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(dd).download(fileName, () => resolve());
    } catch (e) {
      reject(e);
    }
  });
}
