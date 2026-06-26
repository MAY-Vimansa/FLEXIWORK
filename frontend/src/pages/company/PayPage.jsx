import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api';

// Simulated card payment page for a pending commission.
export default function PayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '', nameOnCard: '' });
  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function fe(n) { return fieldErrors[n] && <div className="field-error">{fieldErrors[n]}</div>; }

  const CARD_RE = /^\d{13,19}$/;
  const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;
  const CVV_RE = /^\d{3,4}$/;
  const valid = card.nameOnCard && CARD_RE.test(card.cardNumber) && EXPIRY_RE.test(card.expiry) && CVV_RE.test(card.cvv);

  async function pay(e) {
    e.preventDefault(); setErr(null); setFieldErrors({}); setBusy(true);
    try {
      await api.post(`/api/company/payments/${id}/pay`, card);
      navigate('/company/payments');
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) setFieldErrors(e.fieldErrors);
      setErr(e instanceof ApiError ? e.message : 'Payment failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="page page-narrow">
      <h1>Pay commission</h1>
      <p className="muted">Simulated gateway — no real charge is made.</p>
      {err && <div className="form-error mt-16">{err}</div>}
      <form className="card mt-16" onSubmit={pay}>
        <div className="field"><label>Name on card</label>
          <input className="input" autoComplete="cc-name" value={card.nameOnCard} onChange={(e) => setCard({ ...card, nameOnCard: e.target.value })} required />{fe('nameOnCard')}</div>
        <div className="field"><label>Card number</label>
          <input className="input" placeholder="4111111111111111" maxLength={19} autoComplete="cc-number" inputMode="numeric"
            value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: e.target.value.replace(/\D/g, '') })} required />{fe('cardNumber')}</div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Expiry</label>
            <input className="input" placeholder="MM/YY" maxLength={5} autoComplete="cc-exp"
              value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} required />{fe('expiry')}</div>
          <div className="field" style={{ flex: 1 }}><label>CVV</label>
            <input className="input" placeholder="123" maxLength={4} autoComplete="cc-csc" inputMode="numeric"
              value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} required />{fe('cvv')}</div>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy || !valid}>{busy ? 'Processing…' : 'Pay now'}</button>
      </form>
    </div>
  );
}
