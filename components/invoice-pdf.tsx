import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { createElement } from 'react';

// Register Quicksand fonts
Font.register({
  family: 'Quicksand',
  src: 'https://fonts.gstatic.com/s/quicksand/v30/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkP8o58a-wjwxUD2GF9Zc.woff2',
  fontStyle: 'normal',
  fontWeight: 400
});

Font.register({
  family: 'Quicksand',
  src: 'https://fonts.gstatic.com/s/quicksand/v30/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkBgv58a-wjwxUD2GF9Zc.woff2',
  fontStyle: 'normal',
  fontWeight: 700
});

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
    billingType: 'per-minute' | 'per-hour' | 'flat-rate';
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Quicksand',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontFamily: 'Quicksand',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'Quicksand',
    fontWeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 5,
    fontFamily: 'Quicksand',
    fontWeight: 700,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontSize: 12,
    color: '#666',
    fontFamily: 'Quicksand',
    fontWeight: 700,
  },
  value: {
    width: '70%',
    fontSize: 12,
    fontFamily: 'Quicksand',
    fontWeight: 400,
  },
  footer: {
    marginTop: 30,
    borderTop: 1,
    paddingTop: 10,
    fontSize: 10,
    color: '#666',
    fontFamily: 'Quicksand',
    fontWeight: 400,
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
    return date.toLocaleDateString();
  } catch {
    console.error('Invalid date:', dateString);
    return '';
  }
};

const formatDuration = (duration: { hours: number; minutes: number; seconds: number }) => {
  const parts = [];
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (duration.seconds) parts.push(`${duration.seconds}s`);
  return parts.join(' ') || '0s';
};

export function createInvoicePDF({ invoice }: InvoicePDFProps) {
  // Helper function to create time details section based on billing type
  const createTimeDetailsSection = () => {
    if (invoice.billingType === 'flat-rate') {
      return null; // Don't show time details for flat rate
    }

    const timeRows = [];

    if (invoice.billingType === 'per-minute') {
      timeRows.push(
        createElement(View, { style: styles.row, key: 'length-row' }, [
          createElement(Text, { style: styles.label, key: 'length-label' }, 'Episode Length:'),
          createElement(Text, { style: styles.value, key: 'length-value' }, formatDuration(invoice.length)),
        ]),
        createElement(View, { style: styles.row, key: 'billed-row' }, [
          createElement(Text, { style: styles.label, key: 'billed-label' }, 'Billed Minutes:'),
          createElement(Text, { style: styles.value, key: 'billed-value' }, `${invoice.billedMinutes} minutes`),
        ])
      );
    }

    if (invoice.billingType === 'per-hour') {
      timeRows.push(
        createElement(View, { style: styles.row, key: 'editing-row' }, [
          createElement(Text, { style: styles.label, key: 'editing-label' }, 'Editing Time:'),
          createElement(Text, { style: styles.value, key: 'editing-value' }, formatDuration(invoice.editingTime)),
        ])
      );
    }

    if (timeRows.length === 0) return null;

    return createElement(View, { style: styles.section, key: 'time-section' }, [
      createElement(Text, { style: styles.sectionTitle, key: 'time-title' }, 'Time Details'),
      ...timeRows
    ]);
  };

  return createElement(Document, {}, 
    createElement(Page, { size: "A4", style: styles.page }, [
      createElement(View, { style: styles.header, key: 'header' }, [
        createElement(Text, { style: styles.title, key: 'title' }, 'Invoice'),
        createElement(Text, { style: styles.subtitle, key: 'subtitle' }, `Generated on ${new Date().toLocaleDateString()}`),
      ]),

      createElement(View, { style: styles.section, key: 'client-section' }, [
        createElement(Text, { style: styles.sectionTitle, key: 'client-title' }, 'Client Information'),
        createElement(View, { style: styles.row, key: 'client-row' }, [
          createElement(Text, { style: styles.label, key: 'client-label' }, 'Client:'),
          createElement(Text, { style: styles.value, key: 'client-value' }, invoice.client),
        ]),
        createElement(View, { style: styles.row, key: 'episode-row' }, [
          createElement(Text, { style: styles.label, key: 'episode-label' }, 'Episode Title:'),
          createElement(Text, { style: styles.value, key: 'episode-value' }, invoice.episodeTitle),
        ]),
        createElement(View, { style: styles.row, key: 'type-row' }, [
          createElement(Text, { style: styles.label, key: 'type-label' }, 'Type:'),
          createElement(Text, { style: styles.value, key: 'type-value' }, invoice.type),
        ]),
      ]),

      createElement(View, { style: styles.section, key: 'financial-section' }, [
        createElement(Text, { style: styles.sectionTitle, key: 'financial-title' }, 'Financial Details'),
        createElement(View, { style: styles.row, key: 'invoiced-row' }, [
          createElement(Text, { style: styles.label, key: 'invoiced-label' }, 'Amount:'),
          createElement(Text, { style: styles.value, key: 'invoiced-value' }, formatCurrency(invoice.invoicedAmount)),
        ]),
        createElement(View, { style: styles.row, key: 'payment-row' }, [
          createElement(Text, { style: styles.label, key: 'payment-label' }, 'Payment Method:'),
          createElement(Text, { style: styles.value, key: 'payment-value' }, invoice.paymentMethod),
        ]),
      ]),

      createTimeDetailsSection(),

      createElement(View, { style: styles.section, key: 'dates-section' }, [
        createElement(Text, { style: styles.sectionTitle, key: 'dates-title' }, 'Dates'),
        createElement(View, { style: styles.row, key: 'invoiced-date-row' }, [
          createElement(Text, { style: styles.label, key: 'invoiced-date-label' }, 'Date Invoiced:'),
          createElement(Text, { style: styles.value, key: 'invoiced-date-value' }, formatDate(invoice.dateInvoiced)),
        ]),
        // Only show date paid if it exists
        invoice.datePaid && createElement(View, { style: styles.row, key: 'paid-date-row' }, [
          createElement(Text, { style: styles.label, key: 'paid-date-label' }, 'Date Paid:'),
          createElement(Text, { style: styles.value, key: 'paid-date-value' }, formatDate(invoice.datePaid)),
        ]),
      ]),

      invoice.note && createElement(View, { style: styles.section, key: 'notes-section' }, [
        createElement(Text, { style: styles.sectionTitle, key: 'notes-title' }, 'Notes'),
        createElement(Text, { style: styles.value, key: 'notes-value' }, invoice.note),
      ]),

      createElement(View, { style: styles.footer, key: 'footer' }, [
        createElement(Text, { key: 'footer-text' }, 'This is an automatically generated invoice.'),
      ]),
    ])
  );
} 