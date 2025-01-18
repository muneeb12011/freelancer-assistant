import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Invoices.css'; // Ensure to style dynamically

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [client, setClient] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('Unpaid');
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [viewInvoice, setViewInvoice] = useState(null); // For viewing details
    const { id } = useParams();
    const navigate = useNavigate();

    // Simulate fetching invoice data
    useEffect(() => {
        const fetchedInvoices = [
            { id: 1, client: 'Client A', amount: 1200, dueDate: '2025-02-01', status: 'Paid' },
            { id: 2, client: 'Client B', amount: 800, dueDate: '2025-02-10', status: 'Pending' },
            { id: 3, client: 'Client C', amount: 1500, dueDate: '2025-01-30', status: 'Unpaid' },
            { id: 4, client: 'Client D', amount: 950, dueDate: '2025-02-05', status: 'Paid' },
        ];
        setInvoices(fetchedInvoices);

        if (id) {
            const invoiceToEdit = fetchedInvoices.find((invoice) => invoice.id === parseInt(id));
            if (invoiceToEdit) {
                setEditingInvoice(invoiceToEdit);
                setClient(invoiceToEdit.client);
                setAmount(invoiceToEdit.amount);
                setDueDate(invoiceToEdit.dueDate);
                setStatus(invoiceToEdit.status);
            }
        }
    }, [id]);

    const clearFields = () => {
        setClient('');
        setAmount('');
        setDueDate('');
        setStatus('Unpaid');
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!client || !amount || !dueDate) {
            alert('All fields are required!');
            return;
        }

        const newInvoice = { id: invoices.length + 1, client, amount, dueDate, status };

        setInvoices([...invoices, newInvoice]);
        clearFields();
        navigate('/invoices');
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!client || !amount || !dueDate) {
            alert('All fields are required!');
            return;
        }

        const updatedInvoice = { id: editingInvoice.id, client, amount, dueDate, status };

        const updatedInvoices = invoices.map((invoice) =>
            invoice.id === editingInvoice.id ? updatedInvoice : invoice
        );
        setInvoices(updatedInvoices);
        setEditingInvoice(null);
        clearFields();
        navigate('/invoices');
    };

    const handleDelete = (invoiceId) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            const updatedInvoices = invoices.filter((invoice) => invoice.id !== invoiceId);
            setInvoices(updatedInvoices);
            if (viewInvoice?.id === invoiceId) setViewInvoice(null);
        }
    };

    const handleView = (invoice) => {
        setViewInvoice(invoice);
    };

    return (
        <div className="invoices">
            <div className="invoices-header">
                <h2>Invoices</h2>
                {!editingInvoice && (
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingInvoice({});
                            setViewInvoice(null);
                            clearFields();
                        }}
                    >
                        Create New Invoice
                    </button>
                )}
            </div>

            {/* Display form for creating or editing invoice */}
            {(editingInvoice || !editingInvoice?.id) && (
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
            )}

            {/* View Invoice */}
            {viewInvoice && (
                <div className="view-invoice">
                    <h3>Invoice Details</h3>
                    <p>
                        <strong>Client:</strong> {viewInvoice.client}
                    </p>
                    <p>
                        <strong>Amount:</strong> ${viewInvoice.amount}
                    </p>
                    <p>
                        <strong>Due Date:</strong> {viewInvoice.dueDate}
                    </p>
                    <p>
                        <strong>Status:</strong> {viewInvoice.status}
                    </p>
                    <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>
                        Close
                    </button>
                </div>
            )}

            {/* Invoice Table */}
            {!editingInvoice && !viewInvoice && (
                <div className="invoices-table">
                    {invoices.length === 0 ? (
                        <p>No invoices available. Create one to get started!</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td>{invoice.id}</td>
                                        <td>{invoice.client}</td>
                                        <td>${invoice.amount}</td>
                                        <td>{invoice.dueDate}</td>
                                        <td>
                                            <span className={`invoice-status ${invoice.status.toLowerCase()}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-info" onClick={() => handleView(invoice)}>
                                                View
                                            </button>
                                            <button
                                                className="btn btn-warning"
                                                onClick={() => {
                                                    setEditingInvoice(invoice);
                                                    setViewInvoice(null);
                                                    setClient(invoice.client);
                                                    setAmount(invoice.amount);
                                                    setDueDate(invoice.dueDate);
                                                    setStatus(invoice.status);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDelete(invoice.id)}
                                            >
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
        </div>
    );
};

export default Invoices;
