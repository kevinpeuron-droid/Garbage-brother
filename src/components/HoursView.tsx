import React, { useState } from "react";
import { WorkSession, EquipmentType, defaultEquipmentRates } from "../types";
import { Plus, Trash2, Clock, Calculator } from "lucide-react";

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
  const [isAdding, setIsAdding] = useState(false);
  const [newSession, setNewSession] = useState<Partial<WorkSession>>({
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "17:00",
    mission: "",
    equipment: "tracteur_perso",
    hourlyRate: defaultEquipmentRates["tracteur_perso"],
    customEquipment: "",
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newSession.date ||
      !newSession.startTime ||
      !newSession.endTime ||
      !newSession.mission
    )
      return;

    onAddSession({
      id: crypto.randomUUID(),
      date: newSession.date,
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      mission: newSession.mission,
      equipment: newSession.equipment as EquipmentType,
      customEquipment: newSession.customEquipment,
      hourlyRate: newSession.hourlyRate || 0,
    });

    setIsAdding(false);
    setNewSession({
      date: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      endTime: "17:00",
      mission: "",
      equipment: "tracteur_perso",
      hourlyRate: defaultEquipmentRates["tracteur_perso"],
      customEquipment: "",
    });
  };

  const calculateDurationHours = (start: string, end: string) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    let diff = endH * 60 + endM - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60;
    return diff / 60;
  };

  const totalAmount = sessions.reduce((sum, session) => {
    const duration = calculateDurationHours(session.startTime, session.endTime);
    return sum + duration * session.hourlyRate;
  }, 0);

  const totalHours = sessions.reduce((sum, session) => {
    return sum + calculateDurationHours(session.startTime, session.endTime);
  }, 0);

  return (
    <div className="flex-1 overflow-auto bg-[#F4F1EA] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#3C413A]">Mes Heures</h1>
            <p className="text-[#7A8275]">
              Récapitulatif de vos missions et temps de travail
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#6B8E63] text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-[#5a7a53] transition-colors"
          >
            <Plus size={18} /> Nouvelle Session
          </button>
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

        {isAdding && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E0D5]">
            <h2 className="text-lg font-bold text-[#4B6345] mb-4">
              Ajouter une session
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newSession.date}
                    onChange={(e) =>
                      setNewSession({ ...newSession, date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    required
                    value={newSession.startTime}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    required
                    value={newSession.endTime}
                    onChange={(e) =>
                      setNewSession({ ...newSession, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                  Mission
                </label>
                <input
                  type="text"
                  required
                  placeholder="Description de la mission..."
                  value={newSession.mission}
                  onChange={(e) =>
                    setNewSession({ ...newSession, mission: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                    Matériel utilisé
                  </label>
                  <select
                    value={newSession.equipment}
                    onChange={(e) => {
                      const eq = e.target.value as EquipmentType;
                      setNewSession({
                        ...newSession,
                        equipment: eq,
                        hourlyRate: defaultEquipmentRates[eq] || 0,
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                  >
                    {equipmentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                    Taux Horaire HT (€)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={newSession.hourlyRate}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        hourlyRate: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                  />
                </div>
              </div>

              {newSession.equipment === "autre" && (
                <div>
                  <label className="block text-xs font-bold text-[#7A8275] uppercase mb-1">
                    Préciser le matériel
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Matériel..."
                    value={newSession.customEquipment}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        customEquipment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D5] rounded-lg focus:ring-2 focus:ring-[#6B8E63] outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 font-bold text-[#7A8275] hover:bg-[#F4F1EA] rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4B6345] text-white font-bold rounded-lg hover:bg-[#3C413A] transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E0D5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F8F6] border-b border-[#E5E0D5] text-[#7A8275] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Horaires</th>
                  <th className="p-4 font-bold">Durée</th>
                  <th className="p-4 font-bold">Mission</th>
                  <th className="p-4 font-bold">Matériel</th>
                  <th className="p-4 font-bold">Taux/h</th>
                  <th className="p-4 font-bold">Total HT</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
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
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((session) => {
                      const duration = calculateDurationHours(
                        session.startTime,
                        session.endTime,
                      );
                      const total = duration * session.hourlyRate;

                      return (
                        <tr
                          key={session.id}
                          className="border-b border-[#E5E0D5] hover:bg-[#F9F8F6] transition-colors"
                        >
                          <td className="p-4 font-medium text-[#3C413A]">
                            {new Date(session.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="p-4 text-[#7A8275]">
                            {session.startTime} - {session.endTime}
                          </td>
                          <td className="p-4 font-medium text-[#4B6345]">
                            {duration.toFixed(1)}h
                          </td>
                          <td
                            className="p-4 text-[#3C413A] max-w-[200px] truncate"
                            title={session.mission}
                          >
                            {session.mission}
                          </td>
                          <td className="p-4 text-[#7A8275]">
                            {session.equipment === "autre"
                              ? session.customEquipment
                              : equipmentOptions.find(
                                  (o) => o.value === session.equipment,
                                )?.label}
                          </td>
                          <td className="p-4 text-[#7A8275]">
                            {session.hourlyRate.toFixed(2)}€
                          </td>
                          <td className="p-4 font-bold text-[#3C413A]">
                            {total.toFixed(2)}€
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => onDeleteSession(session.id)}
                              className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
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
    </div>
  );
}
