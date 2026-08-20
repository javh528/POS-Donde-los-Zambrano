import jsPDF from 'jspdf';
import { numberToWordsColombianPesos } from './numberToWordsEs';

export const DEFAULT_BILLING_REPRESENTATIVE = {
  payeeName: 'Carlos Eduardo Zambrano Sanchez',
  payeeCC: '76320887',
  signatureName: 'Carlos Zambrano',
  phone: '3116834930',
  address: 'Carrera 17 # 13b-15',
  bankAccount: 'Bancolombia ahorros: 91203971058',
  city: 'Popayán',
};

/**
 * Genera el documento PDF formal de "CUENTA DE COBRO"
 * @param {Object} cuentaData Datos de la cuenta de cobro
 * @returns {jsPDF} Documento PDF listo para imprimir o descargar
 */
export const generateCuentaCobroPDF = (cuentaData) => {
  const {
    companyName = 'EMPRESA CLIENTE SAS',
    companyNit = '900000000-1',
    city = DEFAULT_BILLING_REPRESENTATIVE.city,
    dateFormatted = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    payeeName = DEFAULT_BILLING_REPRESENTATIVE.payeeName,
    payeeCC = DEFAULT_BILLING_REPRESENTATIVE.payeeCC,
    signatureName = DEFAULT_BILLING_REPRESENTATIVE.signatureName,
    phone = DEFAULT_BILLING_REPRESENTATIVE.phone,
    address = DEFAULT_BILLING_REPRESENTATIVE.address,
    bankAccount = DEFAULT_BILLING_REPRESENTATIVE.bankAccount,
    items = [],
    pendingBalance = 0,
  } = cuentaData;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 25;
  const contentWidth = pageWidth - (marginX * 2);
  let y = 28;

  // 1. TÍTULO PRINCIPAL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('CUENTA DE COBRO', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Lugar y Fecha:${city} ${dateFormatted}`, pageWidth / 2, y, { align: 'center' });

  // 2. EMPRESA DEUDORA
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(companyName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.text(`NIT: ${companyNit}`, pageWidth / 2, y, { align: 'center' });

  // 3. A QUIEN SE DEBE
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`DEBE A:${payeeName}`, marginX, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`C.C.: ${payeeCC}`, marginX, y);

  // 4. VALOR EN LETRAS Y NÚMEROS
  // Calcular total de consumos + saldo pendiente
  const itemsTotal = items.reduce((acc, item) => acc + (Number(item.totalPrice) || (Number(item.unitPrice) * Number(item.qty)) || 0), 0);
  const pendingBalanceNum = Number(pendingBalance) || 0;
  const grandTotal = itemsTotal + pendingBalanceNum;

  const amountInWords = numberToWordsColombianPesos(grandTotal);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('La suma de:', marginX, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  const amountText = `${amountInWords} ($${grandTotal.toLocaleString('es-CO')})`;
  const splitAmount = doc.splitTextToSize(amountText, contentWidth);
  doc.text(splitAmount, marginX, y);
  y += (splitAmount.length * 5) + 3;

  // 5. POR CONCEPTO DE
  doc.setFont('helvetica', 'bold');
  doc.text('POR CONCEPTO DE:', marginX, y);

  y += 7;

  // 6. TABLA DE CONSUMOS
  // Encabezados de columna
  const colDateX = marginX;
  const colConceptX = marginX + 28;
  const colUnitX = marginX + 95;
  const colTotalX = marginX + contentWidth;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Fecha.', colDateX, y);
  doc.text('Concepto.', colConceptX, y);
  doc.text('Valor unitario.', colUnitX, y);
  doc.text('Valor total.', colTotalX, y, { align: 'right' });
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  if (pendingBalanceNum > 0) {
    if (y > 240) {
      doc.addPage();
      y = 25;
    }
    doc.text('-', colDateX, y);
    doc.text('Saldo Pendiente de Factura Anterior.', colConceptX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${pendingBalanceNum.toLocaleString('es-CO')}`, colTotalX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 5.5;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, y - 3, marginX + contentWidth, y - 3);
  }

  items.forEach((item) => {
    // Si la página se está llenando, agregar nueva página
    if (y > 240) {
      doc.addPage();
      y = 25;
    }

    const itemDate = item.dateFormatted || item.date || '';
    // Format date as DD-MM if full date provided
    let shortDate = itemDate;
    if (itemDate.includes('-')) {
      const parts = itemDate.split('-');
      if (parts.length === 3) {
        shortDate = `${parts[2]}-${parts[1]}.`;
      }
    } else if (!shortDate.endsWith('.')) {
      shortDate += '.';
    }

    let conceptText = `${item.qty} ${item.concept || item.name || 'Servicio'}.`;
    if (item.isTakeout) {
      conceptText = `${item.qty} ${item.concept || item.name || 'Servicio'} (Llevar).`;
    }

    const unitPriceNum = Number(item.unitPrice) || 0;
    const itemTotalNum = Number(item.totalPrice) || (unitPriceNum * Number(item.qty)) || 0;

    doc.text(shortDate, colDateX, y);
    doc.text(conceptText, colConceptX, y);
    doc.text(`$${unitPriceNum.toLocaleString('es-CO')}.`, colUnitX, y);
    doc.text(`$${itemTotalNum.toLocaleString('es-CO')}`, colTotalX, y, { align: 'right' });

    y += 5;
  });

  // TOTAL
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TOTAL:$${grandTotal.toLocaleString('es-CO')}`, colTotalX, y, { align: 'right' });

  // 7. FIRMA / PIE DE PÁGINA
  y += 16;
  if (y > 245) {
    doc.addPage();
    y = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Cordialmente,', marginX, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Nombre: ${signatureName}`, marginX, y);

  y += 4.5;
  doc.text(`C.C.: ${payeeCC}`, marginX, y);

  y += 7;
  doc.text(`TEL: ${phone}`, marginX, y);

  y += 4.5;
  doc.text(`Dirección: ${address}`, marginX, y);

  y += 4.5;
  doc.text(bankAccount, marginX, y);

  return doc;
};
