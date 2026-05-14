
export const printPOSReceipt = (sale, translations) => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  const content = `
    <html>
      <head>
        <title>Receipt - ${sale.invoice_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
          
          @page { 
            margin: 0; 
            size: 80mm auto;
          }
          
          body { 
            font-family: 'Courier Prime', 'Courier New', Courier, monospace; 
            width: 72mm; 
            padding: 4mm; 
            margin: 0; 
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            background: #fff;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          
          .header { margin-bottom: 5mm; }
          .shop-name { font-size: 16px; font-weight: bold; margin-bottom: 1mm; text-transform: uppercase; }
          .shop-info { font-size: 10px; margin-bottom: 1mm; }
          
          .divider { border-top: 1px dashed #000; margin: 2mm 0; }
          
          .info-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; font-size: 11px; }
          
          .items-table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 11px; }
          .items-table th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 1mm; font-weight: bold; }
          .items-table td { padding: 1.5mm 0; vertical-align: top; }
          
          .totals { margin-top: 2mm; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
          .grand-total { font-size: 15px; font-weight: bold; border-top: 1px solid #000; padding-top: 2mm; margin-top: 1mm; }
          
          .footer { margin-top: 8mm; font-size: 10px; }
          
          @media print {
            body { width: 72mm; }
          }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="shop-name">${translations.pos.receipt.title}</div>
          <div class="shop-info">${translations.pos.receipt.address}</div>
          <div class="shop-info">${translations.pos.receipt.phone}</div>
        </div>

        <div class="divider"></div>
        
        <div class="info-section">
          <div class="info-row">
            <span>${translations.pos.receipt.invoice}</span>
            <span class="font-bold">${sale.invoice_number}</span>
          </div>
          <div class="info-row">
            <span>${translations.pos.receipt.date}</span>
            <span>${sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="info-row">
            <span>${translations.pos.receipt.customer}</span>
            <span>${sale.customer_name || 'Walk-in'}</span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th width="45%">${translations.pos.receipt.item}</th>
              <th width="15%" class="text-center">${translations.pos.receipt.qty}</th>
              <th width="20%" class="text-right">${translations.pos.receipt.price}</th>
              <th width="20%" class="text-right">${translations.pos.receipt.total}</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || []).map(item => {
              const unitLabel = (() => {
                const u = item.sale_unit;
                if (u === 'Strip') return translations.pos.strip || 'Strip';
                if (u === 'Box') return translations.pos.box || 'Box';
                // If it's Tablet/Piece, use dosage_form if it's not Tablet, else use translated piece
                if (u === 'Tablet') {
                  if (item.dosage_form && item.dosage_form !== 'Tablet') return item.dosage_form;
                  return translations.pos.piece || 'Pc';
                }
                return u || translations.pos.piece || 'Pc';
              })();

              return `
                <tr>
                  <td>${item.medicine_name || item.name}</td>
                  <td class="text-center">${item.sale_qty || item.quantity || item.qty_tablets || 0} ${unitLabel}</td>
                  <td class="text-right">${(parseFloat(item.subtotal || 0) / Math.max(1, parseFloat(item.sale_qty || item.quantity || item.qty_tablets || 1))).toFixed(2)}</td>
                  <td class="text-right">${parseFloat(item.subtotal || 0).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div class="total-row">
            <span>${translations.pos.receipt.subtotal}</span>
            <span>৳${parseFloat(sale.subtotal).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>${translations.pos.receipt.tax}</span>
            <span>৳${parseFloat(sale.tax_total).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>${translations.pos.receipt.discount}</span>
            <span>-৳${parseFloat(sale.discount_total).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>${translations.pos.receipt.grand_total}</span>
            <span>৳${parseFloat(sale.grand_total).toFixed(2)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="text-center font-bold" style="margin-top: 2mm; font-size: 13px;">
          ${translations.pos.receipt.paid_via}: ${sale.payment_method}
        </div>

        <div class="footer text-center">
          <div class="font-bold">${translations.pos.receipt.thank_you}</div>
          <div style="margin-top: 1mm;">${translations.pos.receipt.check_expiry}</div>
          <div style="margin-top: 4mm; font-size: 8px;">Software by Medisync</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
              // Fallback for some browsers
              setTimeout(() => {
                window.close();
              }, 1000);
            }, 500);
          }
        </script>
      </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
};
