/****************************************************************************************
 * Invoices - Real Invoice Generator
 * 
 * This page generates invoices with the following features:
 * 1. Invoice numbering in the format INV-0001, INV-0002, etc.
 * 2. PDF export (using jsPDF)
 * 3. Payment integration (Pay Invoice button with selection for MasterCard, PayPal,
 *    Credit Card, Bank Account)
 * 4. Tax and discount support (calculates total after tax and discount)
 * 5. Color-coded invoice status (green: Paid, yellow: Pending, red: Unpaid)
 * 6. Due date alerts: overdue invoices highlighted in red; near-due invoices get a warning.
 * 7. Detailed client information (Email, Phone, Billing Address)
 * 8. Currency selection (USD, EUR, PKR, etc.)
 * 9. Dark theme integration for consistency with your app.
 * 10. Data persistence using localStorage.
 * 11. Animated summary metrics using CountUp.
 * 12. “Send Invoice” integration (via WhatsApp, Facebook, Instagram, Email)
 *
 * Additional Payment Features:
 * - Payment methods: MasterCard, PayPal, Credit Card, Bank Account.
 * - Invoice sending channels: WhatsApp, Facebook, Instagram, Email.
 *
 * Author: Your Name
 * Date: YYYY-MM-DD
 ****************************************************************************************/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Invoices.css';
import { jsPDF } from 'jspdf';
import CountUp from 'react-countup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem
} from '@mui/material';

// Helper: Format a date as a localized string
const formatDate = (date) => new Date(date).toLocaleDateString();

// Helper: Format invoice number as "INV-0001"
const formatInvoiceNumber = (id) =>
  `INV-${id.toString().padStart(4, "0")}`;

const Invoices = () => {
  // Invoice data & form states
  const [invoices, setInvoices] = useState([]);
  const [client, setClient] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);

  // Search & sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  const navigate = useNavigate();
  const { id } = useParams();

  // New states for Payment & Sending dialogs
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('MasterCard');

  const [showSendInvoiceDialog, setShowSendInvoiceDialog] = useState(false);
  const [selectedInvoiceForSend, setSelectedInvoiceForSend] = useState(null);
  const [sendChannel, setSendChannel] = useState('WhatsApp');

  // Helper: Calculate total amount after tax and discount
  const calculateTotal = () => {
    const amt = parseFloat(amount) || 0;
    const taxAmt = amt * (parseFloat(tax) / 100);
    const total = amt + taxAmt - (parseFloat(discount) || 0);
    return total.toFixed(2);
  };

  // Due date alert helper: returns a class name based on due date
  const getDueDateClass = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = (due - now) / (1000 * 3600 * 24);
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return '';
  };

  // Fetch initial invoice data from localStorage or default values
  useEffect(() => {
    const storedInvoices = JSON.parse(localStorage.getItem('invoices'));
    const fetchedInvoices = storedInvoices || [
      { id: 1, client: 'Client A', email: 'a@example.com', phone: '1234567890', billingAddress: 'Address A', amount: 1200, tax: 10, discount: 50, currency: 'USD', dueDate: '2025-02-01', status: 'Paid', createdAt: '2025-01-01T10:00:00Z' },
      { id: 2, client: 'Client B', email: 'b@example.com', phone: '9876543210', billingAddress: 'Address B', amount: 800, tax: 5, discount: 0, currency: 'USD', dueDate: '2025-02-10', status: 'Pending', createdAt: '2025-01-05T12:00:00Z' },
      { id: 3, client: 'Client C', email: 'c@example.com', phone: '5555555555', billingAddress: 'Address C', amount: 1500, tax: 8, discount: 100, currency: 'EUR', dueDate: '2025-01-30', status: 'Unpaid', createdAt: '2025-01-10T09:30:00Z' },
      { id: 4, client: 'Client D', email: 'd@example.com', phone: '4444444444', billingAddress: 'Address D', amount: 950, tax: 10, discount: 20, currency: 'USD', dueDate: '2025-02-05', status: 'Paid', createdAt: '2025-01-15T11:45:00Z' },
    ];
    setInvoices(fetchedInvoices);

    if (id) {
      const invoiceToEdit = fetchedInvoices.find(invoice => invoice.id === parseInt(id, 10));
      if (invoiceToEdit) {
        setEditingInvoice(invoiceToEdit);
        setClient(invoiceToEdit.client);
        setEmail(invoiceToEdit.email);
        setPhone(invoiceToEdit.phone);
        setBillingAddress(invoiceToEdit.billingAddress);
        setAmount(invoiceToEdit.amount);
        setTax(invoiceToEdit.tax);
        setDiscount(invoiceToEdit.discount);
        setCurrency(invoiceToEdit.currency);
        setDueDate(invoiceToEdit.dueDate);
        setStatus(invoiceToEdit.status);
      }
    }
  }, [id]);

  // Persist invoices to localStorage on every change
  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Simulate real-time invoice generation (adds a random invoice every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setInvoices(prev => {
        const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
        const newInvoice = {
          id: newId,
          client: 'Random Client ' + Math.floor(Math.random() * 100),
          email: 'random@example.com',
          phone: '0000000000',
          billingAddress: 'Random Address',
          amount: Math.floor(Math.random() * 1000) + 100,
          tax: 10,
          discount: 0,
          currency: 'USD',
          dueDate: new Date(Date.now() + Math.floor(Math.random() * 10) * 86400000)
            .toISOString().split('T')[0],
          status: ['Paid', 'Unpaid', 'Pending'][Math.floor(Math.random() * 3)],
          createdAt: new Date().toISOString()
        };
        return [...prev, newInvoice];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Clear form fields
  const clearFields = () => {
    setClient('');
    setEmail('');
    setPhone('');
    setBillingAddress('');
    setAmount('');
    setTax(0);
    setDiscount(0);
    setCurrency('USD');
    setDueDate('');
    setStatus('Unpaid');
  };

  // Create a new invoice
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!client || !amount || !dueDate) {
      alert('All fields are required!');
      return;
    }
    const newInvoice = {
      id: invoices.length ? invoices[invoices.length - 1].id + 1 : 1,
      client,
      email,
      phone,
      billingAddress,
      amount,
      tax,
      discount,
      currency,
      dueDate,
      status,
      createdAt: new Date().toISOString()
    };
    setInvoices([...invoices, newInvoice]);
    clearFields();
    navigate('/invoices');
  };

  // Edit an existing invoice
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!client || !amount || !dueDate) {
      alert('All fields are required!');
      return;
    }
    const updatedInvoice = {
      ...editingInvoice,
      client,
      email,
      phone,
      billingAddress,
      amount,
      tax,
      discount,
      currency,
      dueDate,
      status,
    };
    const updatedInvoices = invoices.map(invoice =>
      invoice.id === editingInvoice.id ? updatedInvoice : invoice
    );
    setInvoices(updatedInvoices);
    setEditingInvoice(null);
    clearFields();
    navigate('/invoices');
  };

  // Delete an invoice
  const handleDelete = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
      setInvoices(updatedInvoices);
      if (viewInvoice?.id === invoiceId) setViewInvoice(null);
    }
  };

  // View detailed invoice info
  const handleView = (invoice) => {
    setViewInvoice(invoice);
  };

  // Export the current invoice as a PDF using jsPDF
  const handleExportPDF = (invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Invoice', 14, 22);
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${formatInvoiceNumber(invoice.id)}`, 14, 32);
    doc.text(`Client: ${invoice.client}`, 14, 40);
    doc.text(`Email: ${invoice.email}`, 14, 48);
    doc.text(`Phone: ${invoice.phone}`, 14, 56);
    doc.text(`Billing Address: ${invoice.billingAddress}`, 14, 64);
    doc.text(`Amount: ${invoice.currency} ${invoice.amount}`, 14, 72);
    doc.text(`Tax: ${invoice.tax}%`, 14, 80);
    doc.text(`Discount: ${invoice.currency} ${invoice.discount}`, 14, 88);
    const total = ((invoice.amount * (1 + invoice.tax / 100)) - invoice.discount).toFixed(2);
    doc.text(`Total: ${invoice.currency} ${total}`, 14, 96);
    doc.text(`Due Date: ${invoice.dueDate}`, 14, 104);
    doc.text(`Status: ${invoice.status}`, 14, 112);
    doc.text(`Created At: ${formatDate(invoice.createdAt)}`, 14, 120);
    doc.save(`Invoice-${formatInvoiceNumber(invoice.id)}.pdf`);
  };

  // Payment integration: Open payment dialog for invoice
  const handlePayInvoice = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentMethod('MasterCard'); // default payment method
    setShowPaymentDialog(true);
  };

  // Confirm payment: Update invoice status to "Paid"
  const handleConfirmPayment = () => {
    if (selectedInvoiceForPayment) {
      const updatedInvoices = invoices.map(inv =>
        inv.id === selectedInvoiceForPayment.id ? { ...inv, status: 'Paid' } : inv
      );
      setInvoices(updatedInvoices);
      alert(`Invoice ${formatInvoiceNumber(selectedInvoiceForPayment.id)} paid successfully using ${paymentMethod}!`);
      setShowPaymentDialog(false);
    }
  };

  // Send invoice: Open send invoice dialog
  const handleSendInvoice = (invoice) => {
    setSelectedInvoiceForSend(invoice);
    setSendChannel('WhatsApp'); // default channel
    setShowSendInvoiceDialog(true);
  };

  // Confirm sending invoice: Perform action based on selected channel
  const handleConfirmSendInvoice = () => {
    if (!selectedInvoiceForSend) return;
    switch (sendChannel.toLowerCase()) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent("Invoice " + formatInvoiceNumber(selectedInvoiceForSend.id) + " for " + selectedInvoiceForSend.client + ". Total: " + selectedInvoiceForSend.currency + " " + selectedInvoiceForSend.amount)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
        break;
      case 'instagram':
        alert("Instagram sharing is not supported via web. Please share manually.");
        break;
      case 'email':
        window.location.href = `mailto:${selectedInvoiceForSend.email}?subject=Invoice%20${formatInvoiceNumber(selectedInvoiceForSend.id)}&body=${encodeURIComponent("Please find attached your invoice details for " + selectedInvoiceForSend.client)}`;
        break;
      default:
        alert("Invalid channel selected.");
        return;
    }
    alert(`Invoice ${formatInvoiceNumber(selectedInvoiceForSend.id)} sent via ${sendChannel}!`);
    setShowSendInvoiceDialog(false);
  };

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(invoice =>
    invoice.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort filtered invoices
  const sortedInvoices = filteredInvoices.sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    if (sortField === 'dueDate' || sortField === 'createdAt') {
      fieldA = new Date(fieldA);
      fieldB = new Date(fieldB);
    }
    if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Toggle sort settings
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate total revenue from all invoices
  const totalRevenue = invoices.reduce((acc, inv) => {
    const amt = parseFloat(inv.amount) || 0;
    const taxAmt = amt * (parseFloat(inv.tax) / 100);
    return acc + amt + taxAmt - (parseFloat(inv.discount) || 0);
  }, 0);

  // Extra feature: Clear all invoices (for admin/testing)
  const handleClearAllInvoices = () => {
    if (window.confirm('Are you sure you want to clear all invoices?')) {
      setInvoices([]);
    }
  };

  return (
    <div className="invoices">
      <div className="invoices-header">
        <h2>Invoices</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search by client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="btn btn-danger" onClick={handleClearAllInvoices}>
            Clear All Invoices
          </button>
        </div>
      </div>

      {/* Summary Section with CountUp */}
      <div className="invoices-summary">
        <div className="summary-item">
          <h4>Total Invoices</h4>
          <CountUp end={invoices.length} duration={2} />
        </div>
        <div className="summary-item">
          <h4>Total Revenue</h4>
          <CountUp
            end={parseFloat(totalRevenue.toFixed(2))}
            duration={2}
            prefix={invoices[0]?.currency === 'USD' ? '$' : ''}
            decimals={2}
          />
        </div>
      </div>

      {/* Live Invoice Preview */}
      {(client || amount || dueDate || status) && (
        <div className="invoice-preview">
          <h3>Live Invoice Preview</h3>
          <p>
            <strong>Invoice Number:</strong> {invoices.length ? formatInvoiceNumber(invoices[invoices.length - 1].id + 1) : 'N/A'}
          </p>
          <p><strong>Client:</strong> {client || 'N/A'}</p>
          <p><strong>Email:</strong> {email || 'N/A'}</p>
          <p><strong>Phone:</strong> {phone || 'N/A'}</p>
          <p><strong>Billing Address:</strong> {billingAddress || 'N/A'}</p>
          <p><strong>Amount:</strong> {amount ? `${currency} ${amount}` : 'N/A'}</p>
          <p><strong>Tax:</strong> {tax}%</p>
          <p><strong>Discount:</strong> {discount ? `${currency} ${discount}` : 'N/A'}</p>
          <p><strong>Total:</strong> {amount ? `${currency} ${calculateTotal()}` : 'N/A'}</p>
          <p>
            <strong>Due Date:</strong> {dueDate ? <span className={getDueDateClass(dueDate)}>{formatDate(dueDate)}</span> : 'N/A'}
          </p>
          <p><strong>Status:</strong> {status}</p>
        </div>
      )}

      {/* Form for Creating or Editing an Invoice */}
      <div className="invoice-form">
        <h3>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h3>
        <form onSubmit={editingInvoice ? handleEditSubmit : handleCreateSubmit}>
          <div className="form-group">
            <label htmlFor="client">Client</label>
            <input
              type="text"
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="billingAddress">Billing Address</label>
            <input
              type="text"
              id="billingAddress"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="tax">Tax (%)</label>
            <input
              type="number"
              id="tax"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="discount">Discount ({currency})</label>
            <input
              type="number"
              id="discount"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="PKR">PKR (₨)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            {editingInvoice ? 'Save Changes' : 'Create Invoice'}
          </button>
        </form>
      </div>

      {/* Detailed Invoice View */}
      {viewInvoice && (
        <div className="view-invoice">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> {formatInvoiceNumber(viewInvoice.id)}</p>
          <p><strong>Client:</strong> {viewInvoice.client}</p>
          <p><strong>Email:</strong> {viewInvoice.email}</p>
          <p><strong>Phone:</strong> {viewInvoice.phone}</p>
          <p><strong>Billing Address:</strong> {viewInvoice.billingAddress}</p>
          <p><strong>Amount:</strong> {viewInvoice.currency} {viewInvoice.amount}</p>
          <p><strong>Tax:</strong> {viewInvoice.tax}%</p>
          <p><strong>Discount:</strong> {viewInvoice.currency} {viewInvoice.discount}</p>
          <p>
            <strong>Total:</strong> {viewInvoice.currency} {((viewInvoice.amount * (1 + viewInvoice.tax / 100)) - viewInvoice.discount).toFixed(2)}
          </p>
          <p>
            <strong>Due Date:</strong> <span className={getDueDateClass(viewInvoice.dueDate)}>{formatDate(viewInvoice.dueDate)}</span>
          </p>
          <p>
            <strong>Status:</strong> <span className={`invoice-status ${viewInvoice.status.toLowerCase()}`}>{viewInvoice.status}</span>
          </p>
          {viewInvoice.createdAt && (
            <p><strong>Created At:</strong> {formatDate(viewInvoice.createdAt)}</p>
          )}
          <button className="btn btn-info" onClick={() => handleExportPDF(viewInvoice)}>Download PDF</button>
          <button className="btn btn-success" onClick={() => handlePayInvoice(viewInvoice)}>Pay Invoice</button>
          <button className="btn btn-warning" onClick={() => handleSendInvoice(viewInvoice)}>Send Invoice</button>
          <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>Close</button>
        </div>
      )}

      {/* Invoice Table with Sorting */}
      {!editingInvoice && !viewInvoice && (
        <div className="invoices-table">
          {sortedInvoices.length === 0 ? (
            <p>No invoices available. Create one to get started!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>Invoice Number</th>
                  <th onClick={() => handleSort('client')}>Client</th>
                  <th onClick={() => handleSort('amount')}>Amount</th>
                  <th onClick={() => handleSort('dueDate')}>Due Date</th>
                  <th onClick={() => handleSort('status')}>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{formatInvoiceNumber(invoice.id)}</td>
                    <td>{invoice.client}</td>
                    <td>{invoice.currency} {invoice.amount}</td>
                    <td className={getDueDateClass(invoice.dueDate)}>{formatDate(invoice.dueDate)}</td>
                    <td>
                      <span className={`invoice-status ${invoice.status.toLowerCase()}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-info" onClick={() => handleView(invoice)}>View</button>
                      <button className="btn btn-warning" onClick={() => {
                        setEditingInvoice(invoice);
                        setViewInvoice(null);
                        setClient(invoice.client);
                        setEmail(invoice.email);
                        setPhone(invoice.phone);
                        setBillingAddress(invoice.billingAddress);
                        setAmount(invoice.amount);
                        setTax(invoice.tax);
                        setDiscount(invoice.discount);
                        setCurrency(invoice.currency);
                        setDueDate(invoice.dueDate);
                        setStatus(invoice.status);
                      }}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(invoice.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
        <DialogTitle>
          Pay Invoice {selectedInvoiceForPayment ? formatInvoiceNumber(selectedInvoiceForPayment.id) : ''}
        </DialogTitle>
        <DialogContent>
          <Select
            fullWidth
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <MenuItem value="MasterCard">MasterCard</MenuItem>
            <MenuItem value="PayPal">PayPal</MenuItem>
            <MenuItem value="Credit Card">Credit Card</MenuItem>
            <MenuItem value="Bank Account">Bank Account</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)} color="secondary">Cancel</Button>
          <Button onClick={handleConfirmPayment} color="primary" variant="contained">Confirm Payment</Button>
        </DialogActions>
      </Dialog>

      {/* Send Invoice Dialog */}
      <Dialog open={showSendInvoiceDialog} onClose={() => setShowSendInvoiceDialog(false)}>
        <DialogTitle>
          Send Invoice {selectedInvoiceForSend ? formatInvoiceNumber(selectedInvoiceForSend.id) : ''}
        </DialogTitle>
        <DialogContent>
          <Select
            fullWidth
            value={sendChannel}
            onChange={(e) => setSendChannel(e.target.value)}
          >
            <MenuItem value="WhatsApp">WhatsApp</MenuItem>
            <MenuItem value="Facebook">Facebook</MenuItem>
            <MenuItem value="Instagram">Instagram</MenuItem>
            <MenuItem value="Email">Email</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSendInvoiceDialog(false)} color="secondary">Cancel</Button>
          <Button onClick={handleConfirmSendInvoice} color="primary" variant="contained">Send Invoice</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Invoices;
