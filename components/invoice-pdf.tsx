import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';
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

interface TimeEntry {
  hours: number;
  minutes: number;
  seconds: number;
}

interface Invoice {
  _id: string;
  client: string;
  episodeTitle: string;
  type: string;
  invoicedAmount: number;
  billedMinutes: number;
  length: TimeEntry[];
  paymentMethod: string;
  editingTime: TimeEntry[];
  dateInvoiced: string;
  datePaid: string;
  note: string;
}

interface Rate {
  episodeType: string;
  rateType: 'Per delivered minute' | 'Hourly' | 'Flat rate';
  rate: number;
}

interface Client {
  _id: string;
  name: string;
  aliases?: string[];
  rates: Rate[];
}

interface InvoicePDFProps {
  invoice: Invoice;
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
  paymentSection: {
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    color: '#666',
  },
  paymentLink: {
    color: '#2563eb',
    textDecoration: 'underline',
    fontSize: 14,
  },
  paymentMethod: {
    marginBottom: 8,
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

const formatDuration = (entries: TimeEntry[]) => {
  // Sum up all entries
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const totalSeconds = entries.reduce((sum, entry) => sum + entry.seconds, 0);

  // Convert to normalized format
  const normalizedHours = totalHours + Math.floor(totalMinutes / 60);
  const normalizedMinutes = (totalMinutes % 60) + Math.floor(totalSeconds / 60);
  const normalizedSeconds = totalSeconds % 60;

  // Human readable format (e.g., "3h 16m 49s")
  const parts = [];
  if (normalizedHours) parts.push(`${normalizedHours}h`);
  if (normalizedMinutes) parts.push(`${normalizedMinutes}m`);
  if (normalizedSeconds) parts.push(`${normalizedSeconds}s`);
  const humanReadable = parts.join(' ') || '0s';

  // Decimal hours format (e.g., "3.28 hours")
  const decimalHours = totalHours + (totalMinutes / 60) + (totalSeconds / 3600);
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
      return { items: [], qtyLabel: 'Qty', total: 0 };
    }

    const isPerMinute = matchingRate.rateType === 'Per delivered minute';
    const isHourly = matchingRate.rateType === 'Hourly';
    const qtyLabel = isPerMinute ? 'Minutes' : isHourly ? 'Hours' : 'Qty';

    // Add episode details with appropriate quantity and rate
    let quantity = '1';
    const rate = matchingRate.rate;
    let total = 0;

    if (isPerMinute) {
      quantity = `${invoice.billedMinutes}`;
      const subtotal = rate * invoice.billedMinutes;
      total = subtotal;
      items.push({
        item: invoice.episodeTitle,
        quantity,
        rate,
        subtotal,
      });
    } else if (isHourly) {
      // For hourly billing, show both formats
      quantity = formatDuration(invoice.editingTime);
      // Calculate decimal hours and subtotal
      const decimalHours = invoice.editingTime.reduce((sum, entry) => 
        sum + entry.hours + (entry.minutes / 60) + (entry.seconds / 3600)
      , 0);
      const subtotal = rate * decimalHours;
      total = subtotal;
      items.push({
        item: invoice.episodeTitle,
        quantity,
        rate,
        subtotal,
      });
    } else {
      // Flat rate
      const subtotal = invoice.invoicedAmount;
      total = subtotal;
      items.push({
        item: invoice.episodeTitle,
        quantity: '1',
        rate: subtotal,
        subtotal,
      });
    }

    return { items, qtyLabel, total };
  };

  const { items, qtyLabel, total } = getLineItems();

  // Create filename from client and episode title
  const filename = `${invoice.client.toLowerCase().replace(/\s+/g, '-')}-${invoice.episodeTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;

  return createElement(Document, { 
    title: filename,
    author: 'Aurora Media LLC',
    producer: 'Aurora Media LLC',
    creator: 'Aurora Media LLC'
  }, 
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
          createElement(Text, { style: styles.totalValue, key: 'total-value' }, formatCurrency(total)),
        ]),
      ]),

      // Payment Section
      createElement(View, { style: styles.paymentSection, key: 'payment-section' }, [
        createElement(Text, { style: styles.paymentTitle, key: 'payment-title' }, 
          'How to pay'
        ),
        createElement(Link, { 
          src: `https://pay.podcasts.geoffvrijmoet.com/invoice/${invoice._id}`,
          style: [styles.paymentLink, styles.paymentMethod],
          key: 'card-link'
        }, 'Credit/Debit Card'),
        createElement(Link, {
          src: `https://venmo.com/auroramedia?txn=pay&amount=${total.toFixed(2)}&note=${encodeURIComponent(invoice.episodeTitle)}`,
          style: [styles.paymentLink, styles.paymentMethod],
          key: 'venmo-link'
        }, 'Venmo'),
        createElement(Link, {
          src: `https://paypal.me/auroramediallc/${total.toFixed(2)}`,
          style: [styles.paymentLink, styles.paymentMethod],
          key: 'paypal-link'
        }, 'PayPal'),
      ]),

      // Thank You Message
      createElement(Text, { style: styles.thankYou, key: 'thank-you' }, 
        'Thanks for your consideration!'
      ),
    ])
  );
} 