/**
 * Native Integration Service
 * Handles Capacitor/native app functionality with web fallbacks
 */

// import type { GeneratedPDF } from './pdf-service';
// import { getPlatformCapabilities, isDevelopment } from './platform-utils';

/**
 * Save PDF to device storage
 */
export const savePDFToDevice = async (pdf: GeneratedPDF): Promise<void> => {
  const platform = getPlatformCapabilities();
  
  if (platform.isNative) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      await Filesystem.writeFile({
        path: pdf.filename,
        data: pdf.base64,
        directory: Directory.Documents,
      });
      
      console.log('PDF saved to device:', pdf.filename);
      return;
    } catch (error) {
      console.error('Failed to save PDF to device:', error);
    }
  }
  
  // Web fallback - trigger download
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
 * Preview PDF on device
 */
export const previewPDF = async (pdf: GeneratedPDF): Promise<void> => {
  const platform = getPlatformCapabilities();
  
  if (platform.isNative) {
    try {
      const { PreviewAnyFile } = await import('@capacitor-community/preview-any-file');
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const result = await Filesystem.writeFile({
        path: pdf.filename,
        data: pdf.base64,
        directory: Directory.Cache,
      });
      
      await PreviewAnyFile.preview({
        url: result.uri,
      });
      
      return;
    } catch (error) {
      console.error('Failed to preview PDF on device:', error);
    }
  }
  
  // Web fallback - open in new tab
  const url = URL.createObjectURL(pdf.blob);
  const newWindow = window.open(url, '_blank');
  
  if (!newWindow) {
    alert('Preview blocked by browser. The PDF will be downloaded instead.');
    await savePDFToDevice(pdf);
  }
  
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

/**
 * Share PDF via native share sheet
 */
export const sharePDF = async (
  pdf: GeneratedPDF,
  text?: string,
  subject?: string
): Promise<boolean> => {
  const platform = getPlatformCapabilities();
  
  if (platform.isNative) {
    try {
      const { Share } = await import('@capacitor/share');
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const result = await Filesystem.writeFile({
        path: pdf.filename,
        data: pdf.base64,
        directory: Directory.Cache,
      });
      
      await Share.share({
        title: subject || `Invoice ${pdf.filename}`,
        text: text || 'Please find the attached invoice.',
        url: result.uri,
        dialogTitle: 'Share invoice via...',
      });
      
      return true;
    } catch (error) {
      console.error('Failed to share PDF:', error);
      return false;
    }
  }
  
  // Web fallback - use Web Share API if available
  if (platform.canShare && navigator.share) {
    try {
      const file = new File([pdf.blob], pdf.filename, { type: 'application/pdf' });
      
      await navigator.share({
        title: subject || 'Invoice',
        text: text || 'Please find the attached invoice.',
        files: [file],
      });
      
      return true;
    } catch (error) {
      console.error('Web share failed:', error);
    }
  }
  
  console.log('Share not available, downloading instead');
  await savePDFToDevice(pdf);
  return false;
};

/**
 * Send email with PDF attachment
 */
export const sendEmailWithPDF = async (
  pdf: GeneratedPDF,
  to: string[],
  subject: string,
  body: string,
  cc?: string[],
  bcc?: string[]
): Promise<boolean> => {
  const platform = getPlatformCapabilities();
  
  if (platform.isNative) {
    try {
      const { EmailComposer } = await import('@capacitor-community/email-composer');
      
      const { hasAccount } = await EmailComposer.isAvailable();
      
      if (!hasAccount) {
        console.log('No email account configured, using share instead');
        return await sharePDF(pdf, body, subject);
      }
      
      await EmailComposer.open({
        to,
        cc,
        bcc,
        subject,
        body,
        isHtml: true,
        attachments: [{
          path: `base64:${pdf.filename}//${pdf.base64}`,
          type: 'application/pdf',
          name: pdf.filename,
        }],
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return await sharePDF(pdf, body, subject);
    }
  }
  
  // Web fallback
  if (isDevelopment()) {
    alert(
      'Email with PDF attachment is only available in the mobile app. ' +
      'For testing, the PDF will be downloaded and a mailto link will open.'
    );
  }
  
  await savePDFToDevice(pdf);
  
  const mailtoUrl = `mailto:${to.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nNote: Please attach the downloaded PDF manually.')}`;
  window.location.href = mailtoUrl;
  
  return false;
};

/**
 * Handle invoice send action with appropriate method
 */
export const sendInvoice = async (
  pdf: GeneratedPDF,
  dropZoneEmail: string,
  dropZoneName: string,
  invoiceNumber: string | number
): Promise<void> => {
  const platform = getPlatformCapabilities();
  
  const subject = `Invoice #${invoiceNumber} - ${dropZoneName}`;
  const body = `
Dear ${dropZoneName},

Please find attached Invoice #${invoiceNumber}.

If you have any questions regarding this invoice, please don't hesitate to contact me.

Best regards
  `.trim();
  
  if (platform.canEmail) {
    const sent = await sendEmailWithPDF(
      pdf,
      [dropZoneEmail],
      subject,
      body
    );
    
    if (sent) {
      return;
    }
  }
  
  if (platform.canShare) {
    const shared = await sharePDF(pdf, body, subject);
    
    if (shared) {
      return;
    }
  }
  
  // Last resort - download and mailto
  await savePDFToDevice(pdf);
  
  if (isDevelopment()) {
    alert(
      'In the mobile app, this will open your email with the PDF attached. ' +
      'For now, the PDF has been downloaded and a mailto link will open.'
    );
  }
  
  const mailtoUrl = `mailto:${dropZoneEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nNote: Please attach the downloaded invoice PDF.')}`;
  window.location.href = mailtoUrl;
};

/**
 * Export multiple invoices as PDFs
 */
export const exportMultiplePDFs = async (
  pdfs: GeneratedPDF[]
): Promise<void> => {
  const platform = getPlatformCapabilities();
  
  if (platform.isNative) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      const folderName = `invoices_${new Date().toISOString().split('T')[0]}`;
      
      for (const pdf of pdfs) {
        await Filesystem.writeFile({
          path: `${folderName}/${pdf.filename}`,
          data: pdf.base64,
          directory: Directory.Documents,
        });
      }
      
      alert(`${pdfs.length} invoices saved to ${folderName} folder`);
      return;
    } catch (error) {
      console.error('Failed to export PDFs:', error);
    }
  }
  
  // Web fallback
  for (const pdf of pdfs) {
    await savePDFToDevice(pdf);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};