import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface InvoiceData {
  contractorName: string;
  abn: string;
  bsb: string;
  accountNumber: string;
  dailyHours: {
    date: string;
    hours: number;
    hourlyRate: number;  // Make sure this is included
    pay: number;
    jobsite?: string;
  }[];
  startDate: string;
  endDate: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const generateInvoice = async (data: InvoiceData) => {
  // Calculate totals using the hourly_rate from the database
  const totalHours = data.dailyHours.reduce((sum, day) => sum + parseFloat(day.hours), 0);
  const totalPay = data.dailyHours.reduce((sum, day) => 
    sum + (parseFloat(day.hours) * parseFloat(day.hourly_rate)), 0
  );

  const tableRows = data.dailyHours.map(day => `
    <tr>
      <td>${formatDate(day.date)}</td>
      <td>${day.jobsite || 'N/A'}</td>
      <td>${parseFloat(day.hours).toFixed(2)}</td>
      <td>$${parseFloat(day.hourly_rate).toFixed(2)}</td>
      <td>$${(parseFloat(day.hours) * parseFloat(day.hourly_rate)).toFixed(2)}</td>
    </tr>
  `).join('');

  const tableHeader = `
    <tr>
      <th>Date</th>
      <th>Jobsite</th>
      <th>Hours</th>
      <th>Rate</th>
      <th>Amount</th>
    </tr>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .bill-to { 
            margin-bottom: 20px; 
            background-color: #e0e0e0;  /* Darker gray */
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #ccc;
          }
          .bill-to h3 {
            margin-top: 0;
            color: #333;
          }
          .bill-to p {
            margin-bottom: 0;
            color: #444;  /* Darker text color */
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tax Invoice</h1>
          <p>Period: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}</p>
        </div>

        <div class="bill-to">
          <h3>BILL TO:</h3>
          <p>T&S Ironcraft Pty Ltd</p>
        </div>

        <div>
          <p><strong>Contractor:</strong> ${data.contractorName}</p>
          <p><strong>ABN:</strong> ${data.abn}</p>
        </div>

        <table>
          <thead>
            ${tableHeader}
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="total">
          <p><strong>Total Hours:</strong> ${totalHours.toFixed(2)}</p>
          <p><strong>Total Amount:</strong> $${totalPay.toFixed(2)}</p>
        </div>

        <div style="margin-top: 30px;">
          <h3>Payment Details</h3>
          <p><strong>BSB:</strong> ${data.bsb}</p>
          <p><strong>Account Number:</strong> ${data.accountNumber}</p>
        </div>
      </body>
    </html>
  `;

  try {
    const fileUri = `${FileSystem.documentDirectory}invoice.html`;
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8
    });

    await Share.share({
      url: fileUri,
      title: `Invoice_${data.startDate}_${data.endDate}`
    });

    return true;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};