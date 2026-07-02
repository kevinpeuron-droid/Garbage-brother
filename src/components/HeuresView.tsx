import React, { useState } from "react";
import { EquipmentConfig, WorkSession } from "../types";
import { Plus, Trash2, Edit2, Save, X, Settings2 } from "lucide-react";

interface HeuresViewProps {
  equipments: EquipmentConfig[];
  onUpdateEquipments: (equipments: EquipmentConfig[]) => void;
  sessions: WorkSession[];
  onUpdateSessions: (sessions: WorkSession[]) => void;
}

export default function HeuresView({
  equipments,
  onUpdateEquipments,
  sessions,
  onUpdateSessions,
}: HeuresViewProps) {
  const [activeTab, setActiveTab] = useState<"sessions" | "equipments">("sessions");

  return (
    <div className="flex-1 bg-white overflow-auto flex flex-col relative w-full h-full text-[#3C413A]">
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6">Gestion des heures</h2>
        
        <div className="flex border-b border-[#D9D3C7] mb-6">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === "sessions" ? "border-[#D4A373] text-[#D4A373]" : "border-transparent text-[#7A8275] hover:text-[#3C413A]"}`}
          >
            Pointages
          </button>
          <button
            onClick={() => setActiveTab("equipments")}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "equipments" ? "border-[#D4A373] text-[#D4A373]" : "border-transparent text-[#7A8275] hover:text-[#3C413A]"}`}
          >
            <Settings2 size={16} /> Engins & Taux
          </button>
        </div>

        {activeTab === "sessions" && (
          <SessionsTab
            equipments={equipments}
            sessions={sessions}
            onUpdateSessions={onUpdateSessions}
          />
        )}
        
        {activeTab === "equipments" && (
          <EquipmentsTab
            equipments={equipments}
            onUpdateEquipments={onUpdateEquipments}
          />
        )}
      </div>
    </div>
  );
}

function EquipmentsTab({ equipments, onUpdateEquipments }: { equipments: EquipmentConfig[], onUpdateEquipments: (eq: EquipmentConfig[]) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editRate, setEditRate] = useState(0);

  const [newLabel, setNewLabel] = useState("");
  const [newRate, setNewRate] = useState("");

  const handleAdd = () => {
    if (!newLabel || !newRate) return;
    onUpdateEquipments([
      ...equipments,
      {
        id: `eq_${Date.now()}`,
        label: newLabel,
        hourlyRate: parseFloat(newRate),
      }
    ]);
    setNewLabel("");
    setNewRate("");
  };

  const handleEdit = (eq: EquipmentConfig) => {
    setEditingId(eq.id);
    setEditLabel(eq.label);
    setEditRate(eq.hourlyRate);
  };

  const handleSave = () => {
    if (!editingId) return;
    onUpdateEquipments(equipments.map(eq => eq.id === editingId ? { ...eq, label: editLabel, hourlyRate: editRate } : eq));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet engin ?")) {
      onUpdateEquipments(equipments.filter(eq => eq.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#F4F1EA] p-4 rounded-xl border border-[#D9D3C7]">
        <h3 className="font-bold mb-4 text-sm text-[#3C413A]">Ajouter un engin</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Nom / Mode de travail</label>
            <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" placeholder="ex: Deutz" />
          </div>
          <div className="w-32 space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Taux horaire (€)</label>
            <input type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" placeholder="ex: 50" min="0" step="0.5" />
          </div>
          <button onClick={handleAdd} className="bg-[#6B8E63] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[#5a7a52]">
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-[#3C413A]">Engins existants</h3>
        {equipments.length === 0 && <p className="text-sm text-[#7A8275]">Aucun engin configuré.</p>}
        {equipments.map(eq => (
          <div key={eq.id} className="flex items-center gap-4 bg-white border border-[#D9D3C7] p-3 rounded-lg">
            {editingId === eq.id ? (
              <>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="flex-1 border border-[#D9D3C7] rounded px-2 py-1 text-sm" />
                <input type="number" value={editRate} onChange={(e) => setEditRate(parseFloat(e.target.value))} className="w-24 border border-[#D9D3C7] rounded px-2 py-1 text-sm" min="0" step="0.5" />
                <button onClick={handleSave} className="text-[#6B8E63] hover:bg-[#F4F1EA] p-2 rounded"><Save size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-[#7A8275] hover:bg-[#F4F1EA] p-2 rounded"><X size={16} /></button>
              </>
            ) : (
              <>
                <div className="flex-1 font-medium text-sm">{eq.label}</div>
                <div className="w-24 text-sm font-bold text-[#D4A373]">{eq.hourlyRate} € / h</div>
                <button onClick={() => handleEdit(eq)} className="text-[#7A8275] hover:bg-[#F4F1EA] p-2 rounded"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(eq.id)} className="text-red-500 hover:bg-[#F4F1EA] p-2 rounded"><Trash2 size={16} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionsTab({ equipments, sessions, onUpdateSessions }: { equipments: EquipmentConfig[], sessions: WorkSession[], onUpdateSessions: (s: WorkSession[]) => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("0");
  const [equipmentId, setEquipmentId] = useState(equipments[0]?.id || "");
  const [mission, setMission] = useState("");
  
  const [hasSecondary, setHasSecondary] = useState(false);
  const [secEquipmentId, setSecEquipmentId] = useState("");
  const [secStartTime, setSecStartTime] = useState("");
  const [secEndTime, setSecEndTime] = useState("");
  const [secMission, setSecMission] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || !equipmentId) return;

    const newSession: WorkSession = {
      id: `session_${Date.now()}`,
      date,
      startTime,
      endTime,
      breakMinutes: parseInt(breakMinutes) || 0,
      equipmentId,
      mission,
    };

    if (hasSecondary && secEquipmentId && secStartTime && secEndTime) {
      newSession.secondaryMission = {
        equipmentId: secEquipmentId,
        startTime: secStartTime,
        endTime: secEndTime,
        mission: secMission,
      };
    }

    onUpdateSessions([newSession, ...sessions]);

    // reset
    setStartTime("");
    setEndTime("");
    setBreakMinutes("0");
    setMission("");
    setHasSecondary(false);
    setSecEquipmentId("");
    setSecStartTime("");
    setSecEndTime("");
    setSecMission("");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer ce pointage ?")) {
      onUpdateSessions(sessions.filter(s => s.id !== id));
    }
  };

  const getEqLabel = (id: string) => equipments.find(e => e.id === id)?.label || "Inconnu";

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="bg-[#F4F1EA] p-4 md:p-6 rounded-xl border border-[#D9D3C7] space-y-4">
        <h3 className="font-bold text-sm text-[#3C413A] mb-4">Nouveau pointage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Heure de début</label>
            <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Heure de fin</label>
            <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Pause (minutes)</label>
            <input type="number" value={breakMinutes} onChange={e => setBreakMinutes(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" min="0" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Engin principal / Mode de travail</label>
            <select required value={equipmentId} onChange={e => setEquipmentId(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm">
              <option value="" disabled>Sélectionner un engin</option>
              {equipments.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.label} ({eq.hourlyRate}€/h)</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Détail de la mission (optionnel)</label>
            <input type="text" value={mission} onChange={e => setMission(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" placeholder="ex: Ramassage zone VIP" />
          </div>
        </div>

        <div className="pt-4 border-t border-[#D9D3C7]">
          <label className="flex items-center gap-2 text-sm font-bold text-[#3C413A] cursor-pointer">
            <input type="checkbox" checked={hasSecondary} onChange={e => setHasSecondary(e.target.checked)} className="rounded text-[#D4A373]" />
            Mission annexe (changement d'engin)
          </label>
          
          {hasSecondary && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded border border-[#D9D3C7]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7A8275]">Heure de début (annexe)</label>
                <input type="time" required value={secStartTime} onChange={e => setSecStartTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7A8275]">Heure de fin (annexe)</label>
                <input type="time" required value={secEndTime} onChange={e => setSecEndTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7A8275]">Engin annexe</label>
                <select required value={secEquipmentId} onChange={e => setSecEquipmentId(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm">
                  <option value="" disabled>Sélectionner un engin</option>
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7A8275]">Détail mission annexe</label>
                <input type="text" value={secMission} onChange={e => setSecMission(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" placeholder="ex: Rangement" />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-[#D4A373] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#c39162] transition-colors flex items-center gap-2">
            <Plus size={16} /> Enregistrer le pointage
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#3C413A]">Historique des pointages</h3>
        {sessions.length === 0 && <p className="text-sm text-[#7A8275]">Aucun pointage enregistré.</p>}
        
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} className="bg-white border border-[#D9D3C7] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 space-y-1">
                <div className="font-bold text-[#3C413A]">{session.date}</div>
                <div className="text-sm text-[#7A8275]">
                  <span className="font-medium text-[#3C413A]">{session.startTime} - {session.endTime}</span>
                  {session.breakMinutes ? ` (Pause: ${session.breakMinutes} min)` : ""}
                </div>
              </div>
              <div className="flex-1">
                <span className="inline-block bg-[#F4F1EA] text-[#4B6345] px-2 py-1 rounded text-xs font-bold border border-[#D9D3C7] mb-1">
                  {getEqLabel(session.equipmentId)}
                </span>
                {session.mission && (
                  <div className="text-sm text-[#7A8275] italic">{session.mission}</div>
                )}
              </div>
              {session.secondaryMission && (
                <div className="flex-1 bg-gray-50 p-2 rounded text-xs border border-gray-100">
                  <div className="font-bold text-[#7A8275] mb-1">Mission annexe</div>
                  <div>{session.secondaryMission.startTime} - {session.secondaryMission.endTime}</div>
                  <div className="font-medium">{getEqLabel(session.secondaryMission.equipmentId)}</div>
                  {session.secondaryMission.mission && (
                    <div className="text-[#7A8275] italic mt-1">{session.secondaryMission.mission}</div>
                  )}
                </div>
              )}
              <div>
                <button onClick={() => handleDelete(session.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
