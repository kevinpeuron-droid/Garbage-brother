import React, { useState } from "react";
import { EquipmentConfig, WorkSession } from "../types";
import { Plus, Trash2, Edit2, Save, X, Settings2, Printer } from "lucide-react";
import ReportModal from "./ReportModal";

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
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <div className="flex-1 bg-white overflow-auto flex flex-col relative w-full h-full text-[#3C413A]">
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gestion des heures</h2>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 bg-[#F4F1EA] hover:bg-[#E5E0D5] text-[#3C413A] px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-[#D9D3C7]"
          >
            <Printer size={18} />
            Éditer les récapitulatifs
          </button>
        </div>
        
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
      {showReportModal && (
        <ReportModal
          sessions={sessions}
          equipments={equipments}
          onClose={() => setShowReportModal(false)}
        />
      )}
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Matin
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [mission, setMission] = useState("");
  
  // Après-midi
  const [hasAfternoon, setHasAfternoon] = useState(false);
  const [sameAsMorning, setSameAsMorning] = useState(true);
  const [secStartTime, setSecStartTime] = useState("");
  const [secEndTime, setSecEndTime] = useState("");
  const [secEquipmentId, setSecEquipmentId] = useState("");
  const [secMission, setSecMission] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setStartTime("");
    setEndTime("");
    setEquipmentId(equipments[0]?.id || "");
    setMission("");
    setHasAfternoon(false);
    setSameAsMorning(true);
    setSecStartTime("");
    setSecEndTime("");
    setSecEquipmentId("");
    setSecMission("");
  };

  const handleEdit = (session: WorkSession) => {
    setEditingId(session.id);
    setDate(session.date);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setEquipmentId(session.equipmentId);
    setMission(session.mission || "");

    if (session.secondaryMission) {
      setHasAfternoon(true);
      setSecStartTime(session.secondaryMission.startTime);
      setSecEndTime(session.secondaryMission.endTime);
      
      const isSame = session.secondaryMission.equipmentId === session.equipmentId && session.secondaryMission.mission === session.mission;
      setSameAsMorning(isSame);
      setSecEquipmentId(session.secondaryMission.equipmentId);
      setSecMission(session.secondaryMission.mission || "");
    } else {
      setHasAfternoon(false);
      setSameAsMorning(true);
      setSecStartTime("");
      setSecEndTime("");
      setSecEquipmentId("");
      setSecMission("");
    }
    
    // scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || !equipmentId) return;

    const newSession: WorkSession = {
      id: editingId || `session_${Date.now()}`,
      date,
      startTime,
      endTime,
      equipmentId,
      mission,
    };

    if (hasAfternoon && secStartTime && secEndTime) {
      newSession.secondaryMission = {
        equipmentId: sameAsMorning ? equipmentId : secEquipmentId,
        startTime: secStartTime,
        endTime: secEndTime,
        mission: sameAsMorning ? mission : secMission,
      };
    }

    if (editingId) {
      onUpdateSessions(sessions.map(s => s.id === editingId ? newSession : s));
    } else {
      onUpdateSessions([newSession, ...sessions]);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer ce pointage ?")) {
      onUpdateSessions(sessions.filter(s => s.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const getEqLabel = (id: string) => equipments.find(e => e.id === id)?.label || "Inconnu";

  const calculateDurationHours = (start: string, end: string, breakMinutes = 0) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    let diff = endH * 60 + endM - (startH * 60 + startM) - breakMinutes;
    if (diff < 0) diff += 24 * 60;
    return Math.max(0, diff / 60);
  };

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="bg-[#F4F1EA] p-4 md:p-6 rounded-xl border border-[#D9D3C7] space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-[#3C413A]">
            {editingId ? "Modifier le pointage" : "Nouveau pointage"}
          </h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm font-bold text-[#7A8275] hover:text-[#3C413A]">
              Annuler
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#D9D3C7] pb-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7A8275]">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm bg-white" />
          </div>
        </div>

        {/* MATIN */}
        <div className="space-y-4">
          <h4 className="font-bold text-[#6B8E63]">Matin</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#7A8275]">Heure de début</label>
              <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#7A8275]">Heure de fin</label>
              <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#7A8275]">Engin principal / Mode de travail</label>
              <select required value={equipmentId} onChange={e => setEquipmentId(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm bg-white">
                <option value="" disabled>Sélectionner un engin</option>
                {equipments.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.label} ({eq.hourlyRate}€/h)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#7A8275]">Détail de la mission (optionnel)</label>
              <input type="text" value={mission} onChange={e => setMission(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm bg-white" placeholder="ex: Ramassage zone VIP" />
            </div>
          </div>
        </div>

        {/* APRES MIDI */}
        <div className="pt-4 border-t border-[#D9D3C7]">
          <label className="flex items-center gap-2 text-sm font-bold text-[#3C413A] cursor-pointer mb-4">
            <input type="checkbox" checked={hasAfternoon} onChange={e => setHasAfternoon(e.target.checked)} className="rounded text-[#D4A373] w-4 h-4" />
            Ajouter un pointage l'après-midi
          </label>
          
          {hasAfternoon && (
            <div className="bg-white p-4 rounded-lg border border-[#D9D3C7] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7A8275]">Heure de début (après-midi)</label>
                  <input type="time" required value={secStartTime} onChange={e => setSecStartTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7A8275]">Heure de fin (après-midi)</label>
                  <input type="time" required value={secEndTime} onChange={e => setSecEndTime(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-[#3C413A] cursor-pointer">
                <input type="checkbox" checked={sameAsMorning} onChange={e => setSameAsMorning(e.target.checked)} className="rounded text-[#D4A373] w-4 h-4" />
                Même mission et même engin que le matin
              </label>

              {!sameAsMorning && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7A8275]">Engin après-midi</label>
                    <select required value={secEquipmentId} onChange={e => setSecEquipmentId(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm bg-white">
                      <option value="" disabled>Sélectionner un engin</option>
                      {equipments.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7A8275]">Détail mission après-midi</label>
                    <input type="text" value={secMission} onChange={e => setSecMission(e.target.value)} className="w-full border border-[#D9D3C7] rounded px-3 py-2 text-sm bg-white" placeholder="ex: Rangement" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-[#D4A373] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#c39162] transition-colors flex items-center gap-2">
            {editingId ? <Save size={16} /> : <Plus size={16} />}
            {editingId ? "Enregistrer les modifications" : "Enregistrer le pointage"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#3C413A]">Historique des pointages</h3>
        {sessions.length === 0 && <p className="text-sm text-[#7A8275]">Aucun pointage enregistré.</p>}
        
        <div className="space-y-3">
          {sortedSessions.map(session => {
            const mainHours = calculateDurationHours(session.startTime, session.endTime, session.breakMinutes || 0);
            const secHours = session.secondaryMission ? calculateDurationHours(session.secondaryMission.startTime, session.secondaryMission.endTime, 0) : 0;
            const totalHours = mainHours + secHours;
            
            return (
            <div key={session.id} className="bg-white border border-[#D9D3C7] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 space-y-1">
                <div className="font-bold text-[#3C413A] flex items-center gap-2">
                  {new Date(session.date).toLocaleDateString("fr-FR")}
                  <span className="bg-[#D4A373] text-white px-2 py-0.5 rounded text-xs">
                    {totalHours.toFixed(1)}h
                  </span>
                </div>
                <div className="text-sm text-[#7A8275]">
                  <span className="font-medium text-[#3C413A]">Matin: {session.startTime} - {session.endTime}</span>
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
                  <div className="font-bold text-[#7A8275] mb-1">Après-midi: {session.secondaryMission.startTime} - {session.secondaryMission.endTime}</div>
                  <div className="font-medium">{getEqLabel(session.secondaryMission.equipmentId)}</div>
                  {session.secondaryMission.mission && (
                    <div className="text-[#7A8275] italic mt-1">{session.secondaryMission.mission}</div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleEdit(session)} className="text-[#6B8E63] hover:bg-[#F4F1EA] p-2 rounded transition-colors" title="Modifier">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(session.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Supprimer">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );})} 
        </div>
      </div>
    </div>
  );
}