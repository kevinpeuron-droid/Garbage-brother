import React, { useState, useEffect } from "react";
import { WorkSession, EquipmentType, defaultEquipmentRates } from "../types";
import {
  Plus,
  Trash2,
  Clock,
  Calculator,
  Settings2,
  FileText,
} from "lucide-react";
import ReportModal from "./ReportModal";

interface HoursViewProps {
  sessions: WorkSession[];
  onAddSession: (session: WorkSession) => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, updates: Partial<WorkSession>) => void;
}

const equipmentOptions: { value: EquipmentType; label: string }[] = [
  { value: "tracteur_perso", label: "Tracteur perso" },
  { value: "tracteur_charrue", label: "Tracteur charrue" },
  { value: "tracteur_erwan_plateau", label: "Tracteur Erwan avec plateau" },
  { value: "autre", label: "Autre (à préciser)" },
];

export default function HoursView({
  sessions,
  onAddSession,
  onDeleteSession,
  onUpdateSession,
}: HoursViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [rates, setRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("vcp-rates");
    return saved ? JSON.parse(saved) : defaultEquipmentRates;
  });

  const [missionsList, setMissionsList] = useState<string[]>(() => {
    const saved = localStorage.getItem("vcp-missions");
    return saved ? JSON.parse(saved) : ["Collecte", "Broyage", "Entretien"];
  });

  useEffect(() => {
    localStorage.setItem("vcp-rates", JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem("vcp-missions", JSON.stringify(missionsList));
  }, [missionsList]);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<any>(null);

  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "17:00",
    breakMinutes: 60,
    mission: missionsList[0] || "",
    equipment: "tracteur_perso" as EquipmentType,
    customEquipment: "",
  });

  // Keep newSession.mission valid if missionsList changes
  useEffect(() => {
    if (missionsList.length > 0 && !missionsList.includes(newSession.mission)) {
      setNewSession((prev) => ({ ...prev, mission: missionsList[0] }));
    }
  }, [missionsList]);

  const handleInlineAdd = () => {
    if (
      !newSession.date ||
      !newSession.startTime ||
      !newSession.endTime ||
      !newSession.mission
    )
      return;
    const rate =
      newSession.equipment === "autre" ? 0 : rates[newSession.equipment] || 0;

    onAddSession({
      id: crypto.randomUUID(),
      date: newSession.date,
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      breakMinutes: newSession.breakMinutes || 0,
      mission: newSession.mission,
      equipment: newSession.equipment,
      customEquipment: newSession.customEquipment,
      hourlyRate: rate,
    });

    setNewSession((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
  };

  const handleSaveEdit = () => {
    if (!editSession || !editingSessionId) return;
    const rate =
      editSession.equipment === "autre" ? 0 : rates[editSession.equipment] || 0;
    onUpdateSession(editingSessionId, {
      ...editSession,
      hourlyRate: rate,
    });
    setEditingSessionId(null);
    setEditSession(null);
  };

  const calculateDurationHours = (start: string, end: string, breakMins: number = 0) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    let diff = endH * 60 + endM - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60;
    diff -= breakMins;
    if (diff < 0) diff = 0;
    return diff / 60;
  };

  const totalAmount = sessions.reduce((sum, session) => {
    const duration = calculateDurationHours(session.startTime, session.endTime, session.breakMinutes || 0);
    return sum + duration * session.hourlyRate;
  }, 0);

  const totalHours = sessions.reduce((sum, session) => {
    return sum + calculateDurationHours(session.startTime, session.endTime, session.breakMinutes || 0);
  }, 0);

  return (
    <div className="flex-1 overflow-auto bg-[#F4F1EA] p-6">
      <div className="max-w-6xl mx-auto space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3C413A]">Mes Heures</h1>
            <p className="text-[#7A8275]">
              Récapitulatif de vos missions et temps de travail
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#4B6345] border border-[#E5E0D5] rounded-lg font-bold shadow-sm hover:bg-[#F9F8F6] transition-colors"
            >
              <FileText size={18} /> Éditer un Récapitulatif
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors ${showSettings ? "bg-[#7A8275] text-white" : "bg-white text-[#4B6345] border border-[#E5E0D5] hover:bg-[#F9F8F6]"}`}
            >
              <Settings2 size={18} /> Paramètres
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E0D5] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#6B8E63]/20 flex items-center justify-center text-[#4B6345]">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#7A8275] uppercase tracking-wider">
                Total Heures
              </p>
              <p className="text-3xl font-bold text-[#3C413A]">
                {totalHours.toFixed(1)}h
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E0D5] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#4B6345]/20 flex items-center justify-center text-[#4B6345]">
              <Calculator size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#7A8275] uppercase tracking-wider">
                Total CA HT
              </p>
              <p className="text-3xl font-bold text-[#3C413A]">
                {totalAmount.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>

        {showSettings && (
          <div className="bg-[#EBE7DF] p-6 rounded-2xl shadow-inner border border-[#D9D3C7]">
            <h2 className="text-lg font-bold text-[#4B6345] mb-4 flex items-center gap-2">
              <Settings2 size={20} /> Paramétrage des Taux et Missions
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {equipmentOptions
                  .filter((o) => o.value !== "autre")
                  .map((opt) => (
                    <div key={opt.value}>
                      <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                        Taux {opt.label} (€/h)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={rates[opt.value] || 0}
                        onChange={(e) =>
                          setRates({
                            ...rates,
                            [opt.value]: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#D9D3C7] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                      />
                    </div>
                  ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                  Missions disponibles (séparées par des virgules)
                </label>
                <input
                  type="text"
                  value={missionsList.join(", ")}
                  onChange={(e) => {
                    const list = e.target.value
                      .split(",")
                      .map((m) => m.trim())
                      .filter((m) => m !== "");
                    setMissionsList(list);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#D9D3C7] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                  placeholder="Collecte, Broyage, Entretien..."
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F8F6] border-b border-[#E5E0D5] text-[#7A8275] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold text-center" colSpan={3}>
                    Horaires (Début - Fin - Pause)
                  </th>
                  <th className="p-4 font-bold">Mission</th>
                  <th className="p-4 font-bold">Matériel</th>
                  <th className="p-4 font-bold">Total HT</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Formulaire d'ajout rapide (première ligne) */}
                <tr className="bg-[#F4F1EA] border-b-2 border-[#D9D3C7]">
                  <td className="p-2">
                    <input
                      type="date"
                      value={newSession.date}
                      onChange={(e) =>
                        setNewSession({ ...newSession, date: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded focus:ring-2 focus:ring-[#6B8E63] outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="time"
                      value={newSession.startTime}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded focus:ring-2 focus:ring-[#6B8E63] outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="time"
                      value={newSession.endTime}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          endTime: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded focus:ring-2 focus:ring-[#6B8E63] outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center bg-white border border-[#D9D3C7] rounded px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="15"
                        value={newSession.breakMinutes}
                        onChange={(e) => setNewSession({...newSession, breakMinutes: parseInt(e.target.value) || 0})}
                        className="w-12 text-sm focus:outline-none"
                        title="Pause (minutes)"
                      />
                      <span className="text-xs text-[#7A8275]">min</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <select
                      value={newSession.mission}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          mission: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded focus:ring-2 focus:ring-[#6B8E63] outline-none"
                    >
                      {missionsList.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <select
                        value={newSession.equipment}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            equipment: e.target.value as EquipmentType,
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded focus:ring-2 focus:ring-[#6B8E63] outline-none"
                      >
                        {equipmentOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {newSession.equipment === "autre" && (
                        <input
                          type="text"
                          placeholder="Préciser..."
                          value={newSession.customEquipment}
                          onChange={(e) =>
                            setNewSession({
                              ...newSession,
                              customEquipment: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-[#D9D3C7] rounded focus:ring-2 focus:ring-[#6B8E63] outline-none"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-[#7A8275] text-sm font-medium">
                    {/* Auto-calculated preview */}
                    {(() => {
                      const dur = calculateDurationHours(
                        newSession.startTime,
                        newSession.endTime,
                      );
                      const r =
                        newSession.equipment === "autre"
                          ? 0
                          : rates[newSession.equipment] || 0;
                      return `${(dur * r).toFixed(2)}€`;
                    })()}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={handleInlineAdd}
                      disabled={
                        !newSession.date ||
                        !newSession.startTime ||
                        !newSession.endTime ||
                        !newSession.mission
                      }
                      className="p-1.5 bg-[#6B8E63] text-white rounded hover:bg-[#5a7a53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Ajouter la session"
                    >
                      <Plus size={18} />
                    </button>
                  </td>
                </tr>

                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#7A8275]">
                      Aucune session enregistrée.
                    </td>
                  </tr>
                ) : (
                  sessions
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                          new Date(a.date).getTime() ||
                        b.startTime.localeCompare(a.startTime),
                    )
                    .map((session) => {
                      const duration = calculateDurationHours(
                        session.startTime,
                        session.endTime,
                        session.breakMinutes || 0
                      );
                      const total = duration * session.hourlyRate;

                      if (editingSessionId === session.id) {
                        return (
                          <tr key={session.id} className="bg-[#F4F1EA] border-b border-[#E5E0D5]">
                            <td className="p-2">
                              <input
                                type="date"
                                value={editSession.date}
                                onChange={(e) => setEditSession({...editSession, date: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="time"
                                value={editSession.startTime}
                                onChange={(e) => setEditSession({...editSession, startTime: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="time"
                                value={editSession.endTime}
                                onChange={(e) => setEditSession({...editSession, endTime: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex items-center bg-white border border-[#D9D3C7] rounded px-2 py-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="15"
                                  value={editSession.breakMinutes}
                                  onChange={(e) => setEditSession({...editSession, breakMinutes: parseInt(e.target.value) || 0})}
                                  className="w-12 text-sm focus:outline-none"
                                />
                                <span className="text-xs text-[#7A8275]">min</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <select
                                value={editSession.mission}
                                onChange={(e) => setEditSession({...editSession, mission: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded outline-none"
                              >
                                {missionsList.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={editSession.equipment}
                                onChange={(e) => setEditSession({...editSession, equipment: e.target.value as EquipmentType})}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-[#D9D3C7] rounded outline-none"
                              >
                                {equipmentOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-[#7A8275] text-sm">
                              {(calculateDurationHours(editSession.startTime, editSession.endTime, editSession.breakMinutes || 0) * (editSession.equipment === "autre" ? 0 : rates[editSession.equipment] || 0)).toFixed(2)}€
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={handleSaveEdit}
                                  className="p-1.5 text-white bg-[#6B8E63] hover:bg-[#5a7a53] rounded-lg transition-colors"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setEditingSessionId(null)}
                                  className="p-1.5 text-[#7A8275] bg-white hover:bg-[#E5E0D5] rounded-lg transition-colors border border-[#D9D3C7]"
                                >
                                  Annuler
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={session.id}
                          className="border-b border-[#E5E0D5] hover:bg-[#F9F8F6] transition-colors"
                        >
                          <td className="p-4 font-medium text-[#3C413A] whitespace-nowrap">
                            {new Date(session.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td
                            className="p-4 text-[#7A8275] whitespace-nowrap text-center"
                            colSpan={3}
                          >
                            {session.startTime} - {session.endTime}
                            {session.breakMinutes ? ` (pause ${session.breakMinutes}m)` : ""}{" "}
                            <span className="text-[#4B6345] ml-2 font-medium text-xs bg-[#EBE7DF] px-2 py-1 rounded">
                              ({duration.toFixed(1)}h)
                            </span>
                          </td>
                          <td
                            className="p-4 text-[#3C413A] max-w-[200px] truncate"
                            title={session.mission}
                          >
                            {session.mission}
                          </td>
                          <td className="p-4 text-[#7A8275]">
                            <div className="flex flex-col">
                              <span>
                                {session.equipment === "autre"
                                  ? session.customEquipment
                                  : equipmentOptions.find(
                                      (o) => o.value === session.equipment,
                                    )?.label}
                              </span>
                              <span className="text-xs text-[#A3A8A0]">
                                {session.hourlyRate.toFixed(2)}€/h
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-[#3C413A]">
                            {total.toFixed(2)}€
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingSessionId(session.id);
                                  setEditSession({ ...session });
                                }}
                                className="p-1.5 text-[#4B6345] hover:bg-[#EBE7DF] rounded-lg transition-colors"
                                title="Modifier"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => onDeleteSession(session.id)}
                                className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showReportModal && (
        <ReportModal
          sessions={sessions}
          onClose={() => setShowReportModal(false)}
          equipmentOptions={equipmentOptions}
        />
      )}
    </div>
  );
}
