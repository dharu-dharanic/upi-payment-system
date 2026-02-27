import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount, currency = '₹') => {
  if (amount == null) return `${currency}0.00`;
  return `${currency}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a'); }
  catch { return dateStr; }
};

export const formatRelative = (dateStr) => {
  if (!dateStr) return '—';
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return dateStr; }
};

export const generateIdempotencyKey = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

export const maskUpiId = (upiId) => {
  if (!upiId) return '—';
  const [local, domain] = upiId.split('@');
  if (!local) return upiId;
  return `${local.slice(0, 3)}***@${domain}`;
};

export const getStatusBadge = (status) => {
  switch (status) {
    case 'SUCCESS':  return 'badge-success';
    case 'FAILED':   return 'badge-danger';
    case 'PENDING':  return 'badge-warning';
    case 'FLAGGED':  return 'badge-warning';
    case 'REVERSED': return 'badge-info';
    default:         return 'badge-muted';
  }
};

export const getRiskBadge = (level) => {
  switch (level) {
    case 'LOW':      return 'badge-success';
    case 'MEDIUM':   return 'badge-warning';
    case 'HIGH':     return 'badge-danger';
    case 'CRITICAL': return 'badge-danger';
    default:         return 'badge-muted';
  }
};

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';
