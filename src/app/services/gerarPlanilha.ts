// src/services/exportExcel.ts
import * as XLSX from "xlsx";

/**
 * Exporta o conteúdo de uma tabela HTML ou array de dados para Excel (.xlsx)
 * @param options - Opções de exportação
 * @param options.tableId - ID do elemento <table> no DOM
 * @param options.filename - Nome do arquivo de saída
 * @param options.sheetName - Nome da planilha dentro do Excel (default: "Planilha")
 * @param options.data - Dados opcionais (caso não queira capturar a tabela do DOM)
 */
export function exportExcelFile(options: {
  tableId?: string;
  filename?: string;
  sheetName?: string;
  data?: (string | number)[][];
}) {
  const { tableId, filename = "dados.xlsx", sheetName = "Planilha", data } = options;

  let worksheet: XLSX.WorkSheet;

  // Caso seja passado um ID de tabela, captura os dados do DOM
  if (tableId) {
    const tableElement = document.getElementById(tableId) as HTMLTableElement | null;
    if (!tableElement) {
      console.error(`❌ Tabela com id="${tableId}" não encontrada no DOM.`);
      return;
    }
    worksheet = XLSX.utils.table_to_sheet(tableElement);
  } else if (data) {
    // Caso receba dados manualmente
    worksheet = XLSX.utils.aoa_to_sheet(data);
  } else {
    console.error("❌ Nenhum tableId ou data fornecido para exportação.");
    return;
  }
  //aplica o auto filtro
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range.s, { r: range.s.r, c: range.e.c }) };
  // aplica o auto ajuste
  const colWidths: { wch: number }[] = [];
  const dataArray = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

  dataArray.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const contentLength = cell ? cell.toString().length : 10;
      colWidths[colIndex] = {
        wch: Math.max(colWidths[colIndex]?.wch || 10, contentLength + 2),
      };
    });
  });

  worksheet["!cols"] = colWidths;

  // Cria o workbook e adiciona a planilha
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Gera o arquivo e dispara o download
  XLSX.writeFile(workbook, filename);

  console.log(`✅ Arquivo Excel "${filename}" gerado com sucesso!`);
}
