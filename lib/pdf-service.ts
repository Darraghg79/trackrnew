/**
 * PDF Generation Service
 * Handles PDF creation for invoices with web and native support
 */

// Import type from the types file (adjust path as needed)
// import type { Invoice } from '@/types/invoice';

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  includeNotes?: boolean;
  includeTaxNumber?: boolean;
}

export interface GeneratedPDF {
  blob: Blob;
  base64: string;
  size: number;
  filename: string;
}

/**
 * Generate HTML content for invoice
 */
export const generateInvoiceHTML = (
  invoice: any, // Use 'any' for now, replace with Invoice type
  instructorInfo: any,
  currency: string = '€'
): string => {
  const formatCurrency = (amount: number) => `${currency}${amount.toFixed(2)}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-GB');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${invoice.invoiceNumber}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563eb;
        }
        
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          margin: 0;
        }
        
        .invoice-number {
          text-align: right;
          font-size: 18px;
          color: #666;
        }
        
        .invoice-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 8px;
          ${invoice.status === 'paid' ? 'background: #10b981; color: white;' :
            invoice.status === 'sent' ? 'background: #3b82f6; color: white;' :
            invoice.status === 'locked' ? 'background: #f97316; color: white;' :
            'background: #fbbf24; color: #92400e;'}
        }
        
        .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .party {
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .party h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .party p {
          margin: 4px 0;
          color: #4b5563;
        }
        
        .invoice-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 8px;
        }
        
        .meta-item {
          text-align: center;
        }
        
        .meta-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .meta-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-top: 4px;
        }
        
        .items-table {
          width: 100%;
          margin-bottom: 40px;
          border-collapse: collapse;
        }
        
        .items-table th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #d1d5db;
        }
        
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table tr:hover {
          background: #f9fafb;
        }
        
        .text-right {
          text-align: right;
        }
        
        .totals {
          margin-left: auto;
          width: 300px;
          margin-bottom: 40px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row.grand-total {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          border-top: 2px solid #2563eb;
          border-bottom: none;
          padding-top: 16px;
          margin-top: 8px;
        }
        
        .notes {
          padding: 20px;
          background: #fef3c7;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
          margin-bottom: 40px;
        }
        
        .notes h3 {
          margin: 0 0 8px 0;
          color: #92400e;
        }
        
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        
        .jump-details {
          margin-top: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .jump-item {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .jump-item:last-child {
          border-bottom: none;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div>
          <h1 class="invoice-title">INVOICE</h1>
          <div class="invoice-status">${invoice.status.toUpperCase()}</div>
        </div>
        <div class="invoice-number">
          <div style="font-size: 24px; font-weight: bold;">#${invoice.invoiceNumber}</div>
          ${invoice.isRevised ? '<div style="color: #f97316;">REVISED</div>' : ''}
        </div>
      </div>
      
      <div class="parties">
        <div class="party">
          <h3>From</h3>
          <p style="font-weight: 600; font-size: 18px;">${instructorInfo.name}</p>
          <p style="white-space: pre-line;">${instructorInfo.address}</p>
          ${instructorInfo.taxNumber ? `<p>Tax: ${instructorInfo.taxNumber}</p>` : ''}
          ${instructorInfo.email ? `<p>Email: ${instructorInfo.email}</p>` : ''}
          ${instructorInfo.phone ? `<p>Phone: ${instructorInfo.phone}</p>` : ''}
        </div>
        
        <div class="party">
          <h3>Bill To</h3>
          <p style="font-weight: 600; font-size: 18px;">${invoice.dropZone}</p>
          ${invoice.dropZoneAddress ? `<p style="white-space: pre-line;">${invoice.dropZoneAddress}</p>` : ''}
          ${invoice.dropZoneContact ? `<p>Contact: ${invoice.dropZoneContact}</p>` : ''}
        </div>
      </div>
      
      <div class="invoice-meta">
        <div class="meta-item">
          <div class="meta-label">Issue Date</div>
          <div class="meta-value">${formatDate(invoice.dateCreated)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Due Date</div>
          <div class="meta-value">${formatDate(invoice.dueDate || new Date(new Date(invoice.dateCreated).getTime() + 30 * 24 * 60 * 60 * 1000))}</div>
        </div>
        ${invoice.datePaid ? `
        <div class="meta-item">
          <div class="meta-label">Paid Date</div>
          <div class="meta-value">${formatDate(invoice.datePaid)}</div>
        </div>
        ` : ''}
        <div class="meta-item">
          <div class="meta-label">Total Jumps</div>
          <div class="meta-value">${invoice.jumpDetails?.length || invoice.items?.length || 0}</div>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Service</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems ? invoice.lineItems.map((item: any) => `
            <tr>
              <td>
                <div style="font-weight: 500;">${item.description}</div>
                ${item.details ? `<div style="font-size: 12px; color: #6b7280;">${item.details}</div>` : ''}
              </td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.rate)}</td>
              <td class="text-right" style="font-weight: 500;">${formatCurrency(item.total)}</td>
            </tr>
          `).join('') : 
          invoice.items ? invoice.items.map((item: any) => `
            <tr>
              <td>
                <div style="font-weight: 500;">${item.service}</div>
                <div style="font-size: 12px; color: #6b7280;">Jump #${item.jumpNumber} - ${item.customerName}</div>
              </td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.rate)}</td>
              <td class="text-right" style="font-weight: 500;">${formatCurrency(item.total)}</td>
            </tr>
          `).join('') : ''}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(invoice.subtotal || invoice.total)}</span>
        </div>
        ${invoice.tax && invoice.tax > 0 ? `
        <div class="total-row">
          <span>Tax (${((invoice.taxRate || 0) * 100).toFixed(1)}%)</span>
          <span>${formatCurrency(invoice.tax)}</span>
        </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>Total</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>
      
      ${invoice.notes ? `
      <div class="notes">
        <h3>Notes</h3>
        <p>${invoice.notes}</p>
      </div>
      ` : ''}
      
      ${instructorInfo.bankDetails ? `
      <div class="party" style="width: 100%; max-width: 400px;">
        <h3>Payment Details</h3>
        <p style="white-space: pre-line;">${instructorInfo.bankDetails}</p>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

/**
 * Generate PDF from invoice data
 */
export const generateInvoicePDF = async (
  invoice: any,
  instructorInfo: any,
  currency: string = '€',
  options: PDFGenerationOptions = {}
): Promise<GeneratedPDF> => {
  const html = generateInvoiceHTML(invoice, instructorInfo, currency);
  const filename = `invoice-${invoice.invoiceNumber}${invoice.isRevised ? '-revised' : ''}.pdf`;
  
  // For web environment, we'll create a blob from the HTML
  const blob = new Blob([html], { type: 'text/html' });
  
  // Convert blob to base64 for native app compatibility
  const base64 = await blobToBase64(blob);
  
  return {
    blob,
    base64,
    size: blob.size,
    filename
  };
};

/**
 * Convert blob to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Download PDF in browser environment
 */
export const downloadPDF = (pdf: GeneratedPDF) => {
  const url = URL.createObjectURL(pdf.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = pdf.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Open PDF in new window/tab (web only)
 */
export const openPDFInNewTab = (pdf: GeneratedPDF) => {
  const url = URL.createObjectURL(pdf.blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};