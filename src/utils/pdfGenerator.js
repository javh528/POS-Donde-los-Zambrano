import jsPDF from 'jspdf';
import { RESTAURANT_INFO } from '../data/menuData';

/**
 * generateInvoicePDF
 * Generates an 80mm thermal receipt formatted PDF for "Donde los Zambrano"
 * Corrected with multi-line wrapping and clean margins.
 */
export const generateInvoicePDF = (saleData) => {
  const items = saleData.items || [];
  let estimatedLines = 0;
  items.forEach((i) => {
    estimatedLines += Math.ceil((i.name || '').length / 24) + 1;
    if (i.notes) {
      estimatedLines += Math.ceil((i.notes || '').length / 34) + 1;
    }
  });

  const pageHeight = Math.max(160, 130 + estimatedLines * 6);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, pageHeight],
  });

  const leftMargin = 5;
  const rightMargin = 73;
  let y = 8;

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(200, 29, 37); // Red Z
  doc.text('DONDE LOS ZAMBRANO', 40, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`NIT: ${RESTAURANT_INFO.nit}`, 40, y, { align: 'center' });

  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Comidas Rápidas & Almuerzos Caseros', 40, y, { align: 'center' });

  y += 3.5;
  doc.text(RESTAURANT_INFO.address, 40, y, { align: 'center' });
  y += 3.5;
  doc.text(`Tel / WhatsApp: ${RESTAURANT_INFO.phone}`, 40, y, { align: 'center' });

  // Divider line
  y += 3;
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  doc.line(leftMargin, y, rightMargin, y);

  // Ticket Metadata
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`FACTURA DE VENTA: #${saleData.saleId || 'ZAM-001'}`, leftMargin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${saleData.dateFormatted || new Date().toLocaleString()}`, leftMargin, y);

  y += 4;
  const modeLabel = saleData.shiftMode === 'LUNCH' ? 'Almuerzos' : 'Comidas Rápidas';
  doc.text(`Mesa: ${saleData.tableName || 'Mesa'} (${modeLabel})`, leftMargin, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${saleData.customerName || 'Cliente General'}`, leftMargin, y);
  y += 4;
  doc.text(`NIT / CC: ${saleData.customerNit || '222222222222'}`, leftMargin, y);

  // Divider
  y += 3;
  doc.line(leftMargin, y, rightMargin, y);

  // Table Headers
  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Cant', leftMargin, y);
  doc.text('Descripción', leftMargin + 8, y);
  doc.text('Total', rightMargin, y, { align: 'right' });

  y += 2.5;
  doc.line(leftMargin, y, rightMargin, y);

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  items.forEach((item) => {
    y += 4.5;
    const qtyText = `${item.qty}x`;
    const itemTotal = (item.price * item.qty).toLocaleString('es-CO');

    doc.setFont('helvetica', 'bold');
    doc.text(qtyText, leftMargin, y);

    const nameLines = doc.splitTextToSize(item.name || '', 44);
    doc.text(nameLines, leftMargin + 8, y);

    doc.text(`$${itemTotal}`, rightMargin, y, { align: 'right' });

    y += (nameLines.length - 1) * 3.5;

    if (item.notes) {
      y += 3.5;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      const noteLines = doc.splitTextToSize(`Nota: ${item.notes}`, 56);
      doc.text(noteLines, leftMargin + 8, y);
      y += (noteLines.length - 1) * 3;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    }
  });

  // Divider
  y += 4;
  doc.line(leftMargin, y, rightMargin, y);

  // Totals
  y += 5;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL A PAGAR:', leftMargin, y);
  doc.text(`$${(saleData.total || 0).toLocaleString('es-CO')}`, rightMargin, y, { align: 'right' });

  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de Pago: ${saleData.paymentMethod || 'Efectivo'}`, leftMargin, y);

  // Footer Message
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text('¡Gracias por preferir a Donde los Zambrano!', 40, y, { align: 'center' });

  return doc;
};

/**
 * shareInvoiceViaWhatsApp
 */
export const shareInvoiceViaWhatsApp = (saleData, phoneNumber = '') => {
  const rawPhone = (phoneNumber || saleData.customerPhone || '').replace(/\D/g, '');
  const phoneToUse = rawPhone
    ? rawPhone.startsWith('57')
      ? rawPhone
      : `57${rawPhone}`
    : RESTAURANT_INFO.whatsapp;

  const waUrl = `https://api.whatsapp.com/send?phone=${phoneToUse}`;
  window.open(waUrl, '_blank');
};

export const generateWhatsAppLink = (saleData, phoneNumber = '') => {
  shareInvoiceViaWhatsApp(saleData, phoneNumber);
};
