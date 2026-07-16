import React, { useState } from "react";
import { WorkSession, EquipmentConfig } from "../types";
import { Printer, X } from "lucide-react";

interface ReportModalProps {
  sessions: WorkSession[];
  onClose: () => void;
  equipments: EquipmentConfig[];
}

export default function ReportModal({
  sessions,
  onClose,
  equipments,
}: ReportModalProps) {
  const [reportType, setReportType] = useState<"mission" | "details_facturation" | "synthese">(
    "mission",
  );

  // Tri par date
  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime() ||
      a.startTime.localeCompare(b.startTime),
  );

  const calculateDurationHours = (start: string, end: string, breakMinutes = 0) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    let diff = endH * 60 + endM - (startH * 60 + startM) - breakMinutes;
    if (diff < 0) diff += 24 * 60; // handle overnight slightly if applicable
    return Math.max(0, diff / 60);
  };

  const getEq = (id: string) => equipments.find(e => e.id === id);

  // Synthèse par matériel pour facturation
  const summaryByEquipment = sortedSessions.reduce(
    (acc, session) => {
      let mainEqLabel = "Inconnu";
      let mainRate = 0;
      const mainEq = getEq(session.equipmentId);
      if (mainEq) {
        mainEqLabel = mainEq.label;
        mainRate = mainEq.hourlyRate;
      }
      
      let mainHours = calculateDurationHours(session.startTime, session.endTime, session.breakMinutes);
      
      // Handle secondary mission
      if (session.secondaryMission) {
        const secHours = calculateDurationHours(session.secondaryMission.startTime, session.secondaryMission.endTime);
        mainHours -= secHours; // Deduct secondary time from main time
        
        let secEqLabel = "Inconnu";
        let secRate = 0;
        const secEq = getEq(session.secondaryMission.equipmentId);
        if (secEq) {
          secEqLabel = secEq.label;
          secRate = secEq.hourlyRate;
        }
        
        if (!acc[secEqLabel]) acc[secEqLabel] = { hours: 0, amount: 0 };
        acc[secEqLabel].hours += secHours;
        acc[secEqLabel].amount += secHours * secRate;
      }

      if (!acc[mainEqLabel]) acc[mainEqLabel] = { hours: 0, amount: 0 };
      acc[mainEqLabel].hours += mainHours;
      acc[mainEqLabel].amount += mainHours * mainRate;
      
      return acc;
    },
    {} as Record<string, { hours: number; amount: number }>,
  );

  const totalAmount = Object.values(summaryByEquipment).reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-black/50 md:flex md:items-center md:justify-center print:static print:bg-white">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-2xl shadow-xl flex flex-col overflow-hidden print:shadow-none print:w-full print:h-auto print:block">
        {/* Header non imprimé */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E0D5] print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[#3C413A]">
              Éditer un Récapitulatif
            </h2>
            <div className="flex bg-[#F4F1EA] p-1 rounded-lg">
              <button
                onClick={() => setReportType("mission")}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${reportType === "mission" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275]"}`}
              >
                Missions (sans taux)
              </button>
              <button
                onClick={() => setReportType("details_facturation")}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${reportType === "details_facturation" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275]"}`}
              >
                Détail (avec taux)
              </button>
              <button
                onClick={() => setReportType("synthese")}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${reportType === "synthese" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275]"}`}
              >
                Synthèse
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[#6B8E63] text-white rounded-lg font-bold hover:bg-[#5a7a53] transition-colors"
            >
              <Printer size={18} /> Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#7A8275] hover:bg-[#F4F1EA] rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Zone imprimable */}
        <div className="flex-1 overflow-auto p-8 print:p-0 print-area bg-white">
          <div className="print:hidden mb-6">
            <p className="text-[#7A8275] text-sm">
              Aperçu avant impression. Cliquez sur Imprimer pour générer le
              document.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-[#3C413A] mb-8 text-center uppercase tracking-wider">
              {reportType === "mission" && "Récapitulatif des Missions"}
              {reportType === "details_facturation" && "Détail de Facturation"}
              {reportType === "synthese" && "Synthèse de Facturation"}
            </h1>

            {reportType === "mission" && (
              <table className="w-full text-left border-collapse border border-[#E5E0D5]">
                <thead>
                  <tr className="bg-[#F9F8F6] text-[#7A8275] text-sm uppercase tracking-wider">
                    <th className="p-3 border border-[#E5E0D5] font-bold">
                      Date
                    </th>
                    <th className="p-3 border border-[#E5E0D5] font-bold">
                      Horaires
                    </th>
                    <th className="p-3 border border-[#E5E0D5] font-bold">
                      Matériel
                    </th>
                    <th className="p-3 border border-[#E5E0D5] font-bold">
                      Mission (Détails)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map((session) => (
                    <React.Fragment key={session.id}>
                      <tr>
                        <td className="p-3 border border-[#E5E0D5] font-medium text-[#3C413A]" rowSpan={session.secondaryMission ? 2 : 1}>
                          {new Date(session.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                          {session.startTime} - {session.endTime}
                        </td>
                        <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                          {getEq(session.equipmentId)?.label || "Inconnu"}
                        </td>
                        <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                          Matin {session.breakMinutes ? `(Pause ${session.breakMinutes} min)` : ""}
                          {session.mission ? ` - ${session.mission}` : ""}
                        </td>
                      </tr>
                      {session.secondaryMission && (
                        <tr className="bg-[#F4F1EA]/50 text-sm">
                          <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                            {session.secondaryMission.startTime} - {session.secondaryMission.endTime}
                          </td>
                          <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                            {getEq(session.secondaryMission.equipmentId)?.label || "Inconnu"}
                          </td>
                          <td className="p-3 border border-[#E5E0D5] text-[#7A8275] italic">
                            Après-midi
                            {session.secondaryMission.mission ? ` - ${session.secondaryMission.mission}` : ""}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "details_facturation" && (
              <div className="space-y-8">
                <table className="w-full text-left border-collapse border border-[#E5E0D5]">
                  <thead>
                    <tr className="bg-[#F9F8F6] text-[#7A8275] text-sm uppercase tracking-wider">
                      <th className="p-3 border border-[#E5E0D5] font-bold">
                        Date
                      </th>
                      <th className="p-3 border border-[#E5E0D5] font-bold">
                        Horaires
                      </th>
                      <th className="p-3 border border-[#E5E0D5] font-bold">
                        Durée (Facturée)
                      </th>
                      <th className="p-3 border border-[#E5E0D5] font-bold">
                        Matériel
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSessions.map((session) => (
                      <React.Fragment key={session.id}>
                        <tr>
                          <td className="p-3 border border-[#E5E0D5] font-medium text-[#3C413A]" rowSpan={session.secondaryMission ? 2 : 1}>
                            {new Date(session.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                            {session.startTime} - {session.endTime}
                          </td>
                          <td className="p-3 border border-[#E5E0D5] text-[#3C413A] font-medium">
                            {calculateDurationHours(
                              session.startTime,
                              session.endTime,
                              session.breakMinutes
                            ).toFixed(1)}
                            h
                          </td>
                          <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                            {getEq(session.equipmentId)?.label || "Inconnu"}
                          </td>
                        </tr>
                        {session.secondaryMission && (
                          <tr className="bg-[#F4F1EA]/50 text-sm">
                            <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                              {session.secondaryMission.startTime} - {session.secondaryMission.endTime}
                            </td>
                            <td className="p-3 border border-[#E5E0D5] text-[#3C413A] font-medium">
                              {calculateDurationHours(
                                session.secondaryMission.startTime,
                                session.secondaryMission.endTime,
                                0
                              ).toFixed(1)}
                              h
                            </td>
                            <td className="p-3 border border-[#E5E0D5] text-[#3C413A]">
                              {getEq(session.secondaryMission.equipmentId)?.label || "Inconnu"}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === "synthese" && (
              <div className="bg-white border-y border-[#E5E0D5] py-4 print:border-none">
                <div className="bg-[#F9F8F6] p-6 border border-[#E5E0D5] rounded-xl break-inside-avoid">
                  <h3 className="text-lg font-bold text-[#3C413A] mb-4 uppercase tracking-wider">
                    Synthèse de facturation
                  </h3>
                  <table className="w-full text-left border-collapse mb-4">
                    <thead>
                      <tr className="text-[#7A8275] text-sm border-b border-[#D9D3C7]">
                        <th className="py-2 font-bold">Matériel</th>
                        <th className="py-2 font-bold text-right">
                          Volume Horaire
                        </th>
                        <th className="py-2 font-bold text-right">
                          Montant HT
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summaryByEquipment).map(([eq, data]) => (
                        <tr key={eq} className="border-b border-[#E5E0D5]">
                          <td className="py-3 font-medium text-[#3C413A]">
                            {eq}
                          </td>
                          <td className="py-3 text-right text-[#3C413A]">
                            {data.hours.toFixed(1)}h
                          </td>
                          <td className="py-3 text-right font-medium text-[#3C413A]">
                            {data.amount.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#D9D3C7]">
                        <td className="py-4 font-bold text-lg text-[#3C413A] uppercase">
                          Total Général
                        </td>
                        <td className="py-4 text-right font-bold text-lg text-[#3C413A]">
                          {Object.values(summaryByEquipment)
                            .reduce((s, d) => s + d.hours, 0)
                            .toFixed(1)}
                          h
                        </td>
                        <td className="py-4 text-right font-bold text-2xl text-[#4B6345]">
                          {totalAmount.toFixed(2)} €
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {sortedSessions.length === 0 && (
              <p className="text-center text-[#7A8275] py-8">
                Aucune session enregistrée à imprimer.
              </p>
            )}

            <div className="mt-12 text-center text-sm text-[#A3A8A0] print:block">
              <p>
                Édité le {new Date().toLocaleDateString("fr-FR")} par Big
                Garbage is cleaning you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
