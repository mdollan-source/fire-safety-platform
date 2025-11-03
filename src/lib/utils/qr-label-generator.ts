import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface LabelData {
  id: string;
  siteName: string;
  assetName: string;
  assetType?: string;
  location: string;
  url: string;
}

/**
 * Generates a PDF with QR code labels in Avery L7159 format
 * (24 labels per A4 sheet: 3 columns x 8 rows)
 * Label size: 63.5mm x 38.1mm
 */
export async function generateQRLabelsPDF(labels: LabelData[]): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Avery L7159 specifications (in mm)
  const pageWidth = 210; // A4 width
  const pageHeight = 297; // A4 height
  const labelWidth = 63.5;
  const labelHeight = 38.1;
  const marginLeft = 7;
  const marginTop = 15.1;
  const gapX = 2.5;
  const gapY = 0;
  const cols = 3;
  const rows = 8;
  const labelsPerPage = cols * rows;

  let labelIndex = 0;

  for (const label of labels) {
    // Calculate page and position
    const pageIndex = Math.floor(labelIndex / labelsPerPage);
    const positionOnPage = labelIndex % labelsPerPage;
    const col = positionOnPage % cols;
    const row = Math.floor(positionOnPage / cols);

    // Add new page if needed
    if (labelIndex > 0 && positionOnPage === 0) {
      pdf.addPage();
    }

    // Calculate label position
    const x = marginLeft + col * (labelWidth + gapX);
    const y = marginTop + row * (labelHeight + gapY);

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(label.url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    // Draw label border (for debugging - can be removed)
    // pdf.setDrawColor(200, 200, 200);
    // pdf.rect(x, y, labelWidth, labelHeight);

    // QR code dimensions and position (centered, taking most of the label)
    const qrSize = 28; // mm
    const qrX = x + (labelWidth - qrSize) / 2;
    const qrY = y + 2;

    // Add QR code
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Add text below QR code
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');

    // Location (primary text)
    const textY = qrY + qrSize + 2;
    const locationText = label.location.length > 30
      ? label.location.substring(0, 27) + '...'
      : label.location;

    pdf.text(locationText, x + labelWidth / 2, textY, {
      align: 'center',
      maxWidth: labelWidth - 4,
    });

    // Site name (smaller, secondary text)
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    const siteText = label.siteName.length > 30
      ? label.siteName.substring(0, 27) + '...'
      : label.siteName;

    pdf.text(siteText, x + labelWidth / 2, textY + 3, {
      align: 'center',
      maxWidth: labelWidth - 4,
    });

    labelIndex++;
  }

  // Download the PDF
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`QR-Labels-${timestamp}.pdf`);
}

/**
 * Balanced version - QR code with header and key information
 */
export async function generateSimpleQRLabelsPDF(labels: LabelData[]): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Avery L7159 specifications
  const labelWidth = 63.5;
  const labelHeight = 38.1;
  const marginLeft = 7;
  const marginTop = 15.1;
  const gapX = 2.5;
  const gapY = 0;
  const cols = 3;
  const rows = 8;
  const labelsPerPage = cols * rows;

  let labelIndex = 0;

  for (const label of labels) {
    const pageIndex = Math.floor(labelIndex / labelsPerPage);
    const positionOnPage = labelIndex % labelsPerPage;
    const col = positionOnPage % cols;
    const row = Math.floor(positionOnPage / cols);

    if (labelIndex > 0 && positionOnPage === 0) {
      pdf.addPage();
    }

    const x = marginLeft + col * (labelWidth + gapX);
    const y = marginTop + row * (labelHeight + gapY);

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(label.url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'H',
    });

    // Header
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FIRE SAFETY ASSET', x + labelWidth / 2, y + 3, {
      align: 'center',
    });

    // Divider line
    pdf.setLineWidth(0.1);
    pdf.line(x + 5, y + 4, x + labelWidth - 5, y + 4);

    // QR code positioned to the left
    const qrSize = 26; // mm
    const qrX = x + 4;
    const qrY = y + 6;

    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Text on the right side of QR
    const textX = qrX + qrSize + 3;
    let textY = qrY + 2;

    // Asset Type (if provided)
    if (label.assetType) {
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const typeText = label.assetType.length > 20
        ? label.assetType.substring(0, 17) + '...'
        : label.assetType;
      pdf.text(typeText, textX, textY, {
        maxWidth: labelWidth - (qrSize + 11),
      });
      textY += 3.5;
    }

    // Asset name
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    const assetText = label.assetName.length > 20
      ? label.assetName.substring(0, 17) + '...'
      : label.assetName;
    pdf.text(assetText, textX, textY, {
      maxWidth: labelWidth - (qrSize + 11),
    });
    textY += 3.5;

    // Location
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    const locationLines = pdf.splitTextToSize(
      label.location,
      labelWidth - (qrSize + 11)
    );
    pdf.text(locationLines.slice(0, 2), textX, textY);

    // Site name at bottom
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'italic');
    const siteText = label.siteName.length > 30
      ? label.siteName.substring(0, 27) + '...'
      : label.siteName;
    pdf.text(siteText, x + labelWidth / 2, y + labelHeight - 1.5, {
      align: 'center',
      maxWidth: labelWidth - 4,
    });

    labelIndex++;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`QR-Labels-${timestamp}.pdf`);
}
