"use client";

import { useState } from "react";

export function CheckoutClient({ premium = false }: { premium?: boolean }) {
  const [method, setMethod] = useState("upi");
  const methods = [
    { id: "upi", name: "UPI", detail: "Pay with any UPI app", recommended: true },
    { id: "card", name: "Card", detail: "Debit or credit card via Razorpay", recommended: false },
    { id: "netbanking", name: "Netbanking", detail: "Choose your bank in hosted checkout", recommended: false },
    ...(premium ? [{ id: "emi", name: "EMI", detail: "Eligibility and terms shown by Razorpay", recommended: false }] : []),
  ];

  return (
    <div>
      <div className="payment-options" role="radiogroup" aria-label="Payment method">
        {methods.map((item) => (
          <label className="payment-option" key={item.id}>
            <input
              type="radio"
              name="payment-method"
              value={item.id}
              checked={method === item.id}
              onChange={() => setMethod(item.id)}
            />
            <span><b>{item.name}</b><small>{item.detail}</small></span>
            {item.recommended ? <span className="recommended-tag">RECOMMENDED</span> : null}
          </label>
        ))}
      </div>
      <button className="checkout-button" type="button" disabled aria-describedby="checkout-preview-note">
        Continue securely with Razorpay
      </button>
      <p className="preview-notice" id="checkout-preview-note">
        Preview mode — payment remains disabled until Razorpay, GST, seller identity, and refund terms are connected.
      </p>
    </div>
  );
}
