import jsPDF from 'jspdf';

/**
 * generateKitchenTicket
 * Prints a clean, high-contrast kitchen order slip (comanda de cocina).
 * 
 * FIXES APPLIED:
 * 1. Removed UTF-8 emojis that caused character corruption in jsPDF (like '&', '!³', '&¡').
 * 2. Fixed margins (left 6mm, right 72mm) so text never spills over 80mm thermal paper edge.
 * 3. Uses splitTextToSize for automatic multi-line wrapping of item names, combo details, notes & extras.
 */
export const generateKitchenTicket = (table, shiftMode) => {
  const items = table.items || [];
  
  // Calculate dynamic height based on text content lines
  let estimatedLines = 0;
  items.forEach((i) => {
    estimatedLines += Math.ceil((i.name || '').length / 22) + 1;
    if (i.notes) {
      estimatedLines += Math.ceil((i.notes || '').length / 32) + 1;
    }
  });

  const pageHeight = Math.max(120, 85 + estimatedLines * 6);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, pageHeight],
  });

  let y = 8;
  const leftMargin = 6;
  const rightMargin = 72; // Safe right margin inside 80mm width
  const contentWidth = rightMargin - leftMargin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('COMANDA DE COCINA', 40, y, { align: 'center' });

  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DONDE LOS ZAMBRANO', 40, y, { align: 'center' });

  // Divider
  y += 3.5;
  doc.setLineWidth(0.6);
  doc.line(leftMargin, y, rightMargin, y);

  // Table info
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${table.name || 'Mesa'}`, 40, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Hora: ${now}`, leftMargin, y);
  
  const shiftText = shiftMode === 'LUNCH' ? '[ALMUERZOS]' : '[COMIDAS RAPIDAS]';
  doc.text(shiftText, rightMargin, y, { align: 'right' });

  // Divider
  y += 3.5;
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightMargin, y);

  // Items List
  y += 5;

  items.forEach((item) => {
    doc.setFont('helvetica', 'bold');

    // Quantity Badge (Big & Clear)
    doc.setFontSize(12);
    const qtyText = `${item.qty}x`;
    doc.text(qtyText, leftMargin, y);

    // Item Name with Auto Multi-Line Wrapping (Width: 54mm)
    doc.setFontSize(10);
    const nameLines = doc.splitTextToSize(item.name || '', 54);
    doc.text(nameLines, leftMargin + 10, y);

    y += nameLines.length * 4.5 + 1;

    // Detailed Notes & Combo Details (Sopa, Seco, Adicionales, Observaciones)
    if (item.notes) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      // Split notes into multiple clean lines (Width: 58mm)
      const noteLines = doc.splitTextToSize(`* ${item.notes}`, 58);
      doc.text(noteLines, leftMargin + 6, y);

      y += noteLines.length * 3.8 + 1.5;

      doc.setTextColor(0, 0, 0);
    } else {
      y += 1.5;
    }
  });

  // Footer divider
  y += 2;
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, rightMargin, y);

  y += 4.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Total ítems: ' + items.reduce((a, c) => a + c.qty, 0), 40, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('*** PREPARAR PEDIDO ***', 40, y, { align: 'center' });

  return doc;
};
