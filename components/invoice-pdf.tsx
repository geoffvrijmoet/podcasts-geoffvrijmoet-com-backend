import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { createElement } from 'react';

// Register Quicksand fonts
Font.register({
  family: 'Quicksand',
  fonts: [
    {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/quicksand-latin-400-normal.woff`,
      fontWeight: 400,
    },
    {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/quicksand-latin-700-normal.woff`,
      fontWeight: 700,
    },
  ],
});

interface Rate {
  episodeType: string;
  rateType: 'Per delivered minute' | 'Hourly';
  rate: number;
}

interface Client {
  _id: string;
  name: string;
  aliases?: string[];
  rates: Rate[];
}

interface InvoicePDFProps {
  invoice: {
    client: string;
    episodeTitle: string;
    type: string;
    invoicedAmount: number;
    billedMinutes: number;
    length: {
      hours: number;
      minutes: number;
      seconds: number;
    };
    paymentMethod: string;
    editingTime: {
      hours: number;
      minutes: number;
      seconds: number;
    };
    dateInvoiced: string;
    datePaid: string;
    note: string;
  };
  clientData: Client;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Quicksand',
    fontSize: 12,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companySection: {
    width: '50%',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 10,
  },
  companyDetails: {
    color: '#666',
  },
  billToSection: {
    width: '40%',
  },
  billToHeader: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
  },
  billToDetails: {
    color: '#666',
  },
  dateSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  gridContainer: {
    marginBottom: 30,
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid',
    padding: 10,
  },
  colItem: {
    width: '40%',
    paddingRight: 10,
  },
  colQty: {
    width: '20%',
    paddingRight: 10,
  },
  colRate: {
    width: '20%',
    paddingRight: 10,
    textAlign: 'right',
  },
  colSubtotal: {
    width: '20%',
    textAlign: 'right',
  },
  headerText: {
    fontWeight: 700,
    color: '#666',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderTopStyle: 'solid',
  },
  totalRow: {
    flexDirection: 'row',
    width: '40%',
  },
  totalLabel: {
    width: '50%',
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 14,
    fontWeight: 700,
  },
  totalValue: {
    width: '50%',
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 700,
  },
  thankYou: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    console.error('Invalid date:', dateString);
    return '';
  }
};

const formatDuration = (duration: { hours: number; minutes: number; seconds: number }) => {
  // Human readable format (e.g., "3h 16m 49s")
  const parts = [];
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (duration.seconds) parts.push(`${duration.seconds}s`);
  const humanReadable = parts.join(' ') || '0s';

  // Decimal hours format (e.g., "3.28 hours")
  const decimalHours = duration.hours + (duration.minutes / 60) + (duration.seconds / 3600);
  const decimal = decimalHours.toFixed(2);

  return `${humanReadable} (${decimal} hours)`;
};

export function createInvoicePDF({ invoice, clientData }: InvoicePDFProps) {
  const getLineItems = () => {
    const items = [];

    // Find the matching rate for this invoice type
    const matchingRate = clientData.rates.find(rate => rate.episodeType === invoice.type);
    if (!matchingRate) {
      console.error('No matching rate found for episode type:', invoice.type);
      return { items: [], qtyLabel: 'Qty' };
    }

    const isPerMinute = matchingRate.rateType === 'Per delivered minute';
    const isHourly = matchingRate.rateType === 'Hourly';
    const qtyLabel = isPerMinute ? 'Minutes' : isHourly ? 'Hours' : 'Qty';

    // Add episode details with appropriate quantity and rate
    let quantity = '1';
    const rate = matchingRate.rate;
    let subtotal = invoice.invoicedAmount;

    if (isPerMinute) {
      quantity = `${invoice.billedMinutes}`;
      subtotal = rate * invoice.billedMinutes;
    } else if (isHourly) {
      // For hourly billing, show both formats
      quantity = formatDuration(invoice.editingTime);
      // Use decimal hours for calculation
      const decimalHours = invoice.editingTime.hours + (invoice.editingTime.minutes / 60) + (invoice.editingTime.seconds / 3600);
      subtotal = rate * decimalHours;
    }

    items.push({
      item: invoice.episodeTitle,
      quantity,
      rate,
      subtotal,
    });

    return { items, qtyLabel };
  };

  const { items, qtyLabel } = getLineItems();

  return createElement(Document, {}, 
    createElement(Page, { size: "A4", style: styles.page }, [
      // Header with Company and Bill To sections
      createElement(View, { style: styles.headerSection, key: 'header' }, [
        createElement(View, { style: styles.companySection, key: 'company' }, [
          createElement(Text, { style: styles.companyName, key: 'company-name' }, 'Aurora Media LLC'),
          createElement(Text, { style: styles.companyDetails, key: 'company-address' }, '492 Gates Ave #4B'),
          createElement(Text, { style: styles.companyDetails, key: 'company-city' }, 'Brooklyn, NY 11216'),
          createElement(Text, { style: styles.companyDetails, key: 'company-phone' }, '(541) 359-5481'),
        ]),
        createElement(View, { style: styles.billToSection, key: 'bill-to' }, [
          createElement(Text, { style: styles.billToHeader, key: 'bill-to-header' }, 'Bill To:'),
          createElement(Text, { style: styles.billToDetails, key: 'bill-to-name' }, invoice.client),
        ]),
      ]),

      // Date Section
      createElement(View, { style: styles.dateSection, key: 'date' }, [
        createElement(Text, { style: styles.dateText, key: 'invoice-date' }, 
          `Invoice Date: ${formatDate(invoice.dateInvoiced)}`
        ),
      ]),

      // Grid Header
      createElement(View, { style: styles.gridContainer, key: 'grid' }, [
        createElement(View, { style: styles.gridHeader, key: 'grid-header' }, [
          createElement(Text, { style: [styles.headerText, styles.colItem], key: 'header-item' }, 'Item'),
          createElement(Text, { style: [styles.headerText, styles.colQty], key: 'header-qty' }, qtyLabel),
          createElement(Text, { style: [styles.headerText, styles.colRate], key: 'header-rate' }, 'Rate'),
          createElement(Text, { style: [styles.headerText, styles.colSubtotal], key: 'header-subtotal' }, 'Subtotal'),
        ]),

        // Line Items
        ...items.map((item, index) => 
          createElement(View, { style: styles.gridRow, key: `row-${index}` }, [
            createElement(Text, { style: styles.colItem, key: `item-${index}` }, item.item),
            createElement(Text, { style: styles.colQty, key: `qty-${index}` }, item.quantity),
            createElement(Text, { style: styles.colRate, key: `rate-${index}` }, formatCurrency(item.rate)),
            createElement(Text, { style: styles.colSubtotal, key: `subtotal-${index}` }, formatCurrency(item.subtotal)),
          ])
        ),
      ]),

      // Total Section
      createElement(View, { style: styles.totalSection, key: 'total-section' }, [
        createElement(View, { style: styles.totalRow, key: 'total-row' }, [
          createElement(Text, { style: styles.totalLabel, key: 'total-label' }, 'Total:'),
          createElement(Text, { style: styles.totalValue, key: 'total-value' }, formatCurrency(invoice.invoicedAmount)),
        ]),
      ]),

      // Thank You Message
      createElement(Text, { style: styles.thankYou, key: 'thank-you' }, 
        'Thanks for your consideration!'
      ),
    ])
  );
} 