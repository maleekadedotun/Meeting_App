// src/pages/RisksPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dbService } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

export const RisksPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // --- STATE ---
  const [risks, setRisks] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null); // { likelihood, impact } or null
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Form Dialog
  const [showLogForm, setShowLogForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Clinical Compliance',
    description: '',
    mitigation: '',
    likelihood: 3,
    impact: 3
  });

  // --- DATA LOADING ---
  const loadRisks = () => {
    setRisks(dbService.getRisks());
  };

  useEffect(() => {
    loadRisks();
    if (location.state?.openForm) {
      setShowLogForm(true);
    }
  }, [location]);

  // --- RISK MUTATIONS ---
  const handleSubmitRisk = (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      mitigation: formData.mitigation,
      likelihood: Number(formData.likelihood),
      impact: Number(formData.impact),
      reporter: currentUser?.name || 'Staff'
    };

    dbService.createRisk(payload);
    setShowLogForm(false);
    setFormData({
      title: '',
      category: 'Clinical Compliance',
      description: '',
      mitigation: '',
      likelihood: 3,
      impact: 3
    });
    loadRisks();
  };

  const handleToggleMitigated = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Mitigated' ? 'Identified' : 'Mitigated';
    dbService.updateRisk(id, { status: nextStatus });
    loadRisks();
  };

  // --- HEATMAP MATRIX CALCULATOR ---
  // Create a 5x5 matrix mapping [impact][likelihood] -> count of risks
  // Impact is row (5 down to 1), Likelihood is col (1 to 5)
  const getMatrixCounts = () => {
    const counts = {};
    for (let imp = 1; imp <= 5; imp++) {
      counts[imp] = {};
      for (let lkh = 1; lkh <= 5; lkh++) {
        counts[imp][lkh] = 0;
      }
    }
    risks.forEach(r => {
      const imp = Number(r.impact);
      const lkh = Number(r.likelihood);
      if (counts[imp] && counts[imp][lkh] !== undefined) {
        counts[imp][lkh]++;
      }
    });
    return counts;
  };

  const matrixCounts = getMatrixCounts();

  // --- FILTERS & SEARCH ---
  const filteredRisks = risks.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
    
    // Matrix click filtering
    let matchesMatrix = true;
    if (selectedCell) {
      matchesMatrix = Number(r.impact) === selectedCell.impact && 
                      Number(r.likelihood) === selectedCell.likelihood;
    }
    
    return matchesSearch && matchesCategory && matchesMatrix;
  });

  // --- STYLE HELPERS ---
  const getCellColorClass = (impact, likelihood, count) => {
    const score = impact * likelihood;
    const isSelected = selectedCell && selectedCell.impact === impact && selectedCell.likelihood === likelihood;
    const selectionBorder = isSelected ? 'ring-4 ring-zinc-950 dark:ring-white z-10 scale-105' : 'hover:scale-[1.03]';

    let color = '';
    if (score >= 15) {
      color = 'bg-rose-500/80 text-rose-50 border-rose-600 dark:bg-rose-900/60 dark:text-rose-100'; // Critical
    } else if (score >= 8) {
      color = 'bg-orange-400/80 text-orange-950 border-orange-500 dark:bg-orange-800/60 dark:text-orange-100'; // High
    } else if (score >= 4) {
      color = 'bg-amber-300 text-amber-950 border-amber-400 dark:bg-amber-700/60 dark:text-amber-100'; // Medium
    } else {
      color = 'bg-emerald-400/70 text-emerald-950 border-emerald-500 dark:bg-emerald-900/60 dark:text-emerald-100'; // Low
    }

    const fadeClass = count === 0 ? 'opacity-40' : 'font-bold';

    return `h-11 sm:h-14 flex items-center justify-center rounded-lg border text-xs cursor-pointer shadow-sm transition-all ${color} ${selectionBorder} ${fadeClass}`;
  };

  const getRiskLevelBadge = (level) => {
    switch (level) {
      case 'Critical': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
      case 'High': return 'bg-orange-100 text-orange-850 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200 dark:border-orange-900';
      case 'Medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
      default: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
    }
  };

  const getLikelihoodLabel = (val) => {
    const labels = { 1: 'Rare', 2: 'Unlikely', 3: 'Possible', 4: 'Likely', 5: 'Almost Certain' };
    return `${val} - ${labels[val]}`;
  };

  const getImpactLabel = (val) => {
    const labels = { 1: 'Negligible', 2: 'Minor', 3: 'Moderate', 4: 'Major', 5: 'Catastrophic' };
    return `${val} - ${labels[val]}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            Clinical Risk Register
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Identify, assess, and monitor risks in healthcare delivery and compliance.
          </p>
        </div>
        <button
          onClick={() => setShowLogForm(true)}
          className="flex items-center gap-2 bg-teal-650 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Identify Clinical Risk</span>
        </button>
      </div>

      {/* Main Grid: Heatmap (5-col width on desktop) & Table (7-col width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: 5x5 Heatmap matrix */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-850 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Interactive Risk Heatmap
            </h2>
            {selectedCell && (
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-655"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-2">
            
            {/* Impact label y-axis */}
            <div className="flex items-stretch gap-2.5">
              
              {/* Vertical Impact Axis Text label */}
              <div className="w-6 flex items-center justify-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest -rotate-90 origin-center whitespace-nowrap">
                  Impact (Severity) →
                </span>
              </div>

              {/* 5x5 Matrix box grid */}
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                
                {/* Headers column label descriptions */}
                {/* Render from Impact 5 (top) down to 1 (bottom) */}
                {[5, 4, 3, 2, 1].map((imp) => (
                  <React.Fragment key={`imp-${imp}`}>
                    {/* Render Likelihood 1 (left) to 5 (right) */}
                    {[1, 2, 3, 4, 5].map((lkh) => {
                      const count = matrixCounts[imp][lkh];
                      return (
                        <div
                          key={`cell-${imp}-${lkh}`}
                          onClick={() => {
                            if (selectedCell && selectedCell.impact === imp && selectedCell.likelihood === lkh) {
                              setSelectedCell(null); // Toggle off
                            } else {
                              setSelectedCell({ impact: imp, likelihood: lkh });
                            }
                          }}
                          className={getCellColorClass(imp, lkh, count)}
                          title={`Impact ${imp} x Likelihood ${lkh} (${count} risks)`}
                        >
                          {count > 0 ? (
                            <span className="text-sm font-extrabold">{count}</span>
                          ) : (
                            <span className="opacity-10 text-[9px] font-medium">{imp}x{lkh}</span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}

              </div>
            </div>

            {/* Likelihood x-axis label */}
            <div className="pl-8 flex justify-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-2">
              Likelihood (Probability) →
            </div>

            {/* Matrix Legend info box */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 mt-4 text-[10px] text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-rose-500" /> Critical (&ge; 15)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-orange-400" /> High (8-12)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-amber-300" /> Medium (4-6)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-400" /> Low (&lt; 4)</span>
            </div>

          </div>
        </div>

        {/* Right Side: Risk Table register */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-855 rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Table filtering toolbar */}
          <div className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search risk registers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50 dark:border-zinc-800 dark:bg-[#09090b] focus:outline-none"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-1.5 border border-zinc-200 rounded-lg text-xs bg-white dark:border-zinc-800 dark:bg-[#09090b] dark:text-zinc-200 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Clinical Compliance">Clinical Compliance</option>
                <option value="Staffing">Staffing</option>
                <option value="Facility/Equipment">Facility/Equipment</option>
                <option value="Infection Control">Infection Control</option>
                <option value="Information Security">Information Security</option>
              </select>
            </div>
          </div>

          {/* Table records */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-150 text-zinc-500 dark:bg-[#09090b] dark:border-zinc-850 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Risk Context</th>
                  <th className="p-3.5 text-center">Score</th>
                  <th className="p-3.5">Level</th>
                  <th className="p-3.5">Mitigation Strategy</th>
                  <th className="p-3.5 pr-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-zinc-450 italic">No risks match current parameters.</td>
                  </tr>
                ) : (
                  filteredRisks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                      <td className="p-3.5 pl-5 max-w-xs">
                        <p className="font-bold text-zinc-950 dark:text-zinc-100">{risk.title}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{risk.category} • Identified on {risk.date}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">{risk.description}</p>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                        {risk.likelihood} &times; {risk.impact} = {risk.likelihood * risk.impact}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getRiskLevelBadge(risk.level)}`}>
                          {risk.level}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs text-zinc-600 dark:text-zinc-400">
                        <p className="line-clamp-3">{risk.mitigation}</p>
                      </td>
                      <td className="p-3.5 pr-5 text-center">
                        <button
                          onClick={() => handleToggleMitigated(risk.id, risk.status)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${
                            risk.status === 'Mitigated'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                              : 'bg-zinc-50 text-zinc-650 border-zinc-250 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-350 dark:border-zinc-800'
                          }`}
                          title="Click to toggle status"
                        >
                          {risk.status === 'Mitigated' ? <ShieldCheck className="h-3 w-3" /> : null}
                          <span>{risk.status}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* --- IDENTIFY RISK FORM DIALOG --- */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-zoom-in relative">
            <button
              onClick={() => setShowLogForm(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-3.5 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50">Log Clinical Risk</h2>
            </div>

            <form onSubmit={handleSubmitRisk} className="space-y-4 text-xs">
              
              {/* Risk Title */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Risk Description Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Overdue servicing of critical hemodialysis machines..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-955 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-955 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="Clinical Compliance">Clinical Compliance</option>
                  <option value="Staffing">Staffing</option>
                  <option value="Facility/Equipment">Facility/Equipment</option>
                  <option value="Infection Control">Infection Control</option>
                  <option value="Information Security">Information Security</option>
                </select>
              </div>

              {/* Range sliders: Likelihood & Impact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Likelihood */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                  <div className="flex justify-between font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1.5">
                    <span>Likelihood</span>
                    <span className="text-teal-655 font-extrabold">{formData.likelihood}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.likelihood}
                    onChange={(e) => setFormData({ ...formData, likelihood: e.target.value })}
                    className="w-full h-1 bg-zinc-250 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:bg-zinc-700"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1">
                    Value: {getLikelihoodLabel(formData.likelihood)}
                  </span>
                </div>

                {/* Impact */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                  <div className="flex justify-between font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1.5">
                    <span>Impact (Severity)</span>
                    <span className="text-teal-655 font-extrabold">{formData.impact}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    className="w-full h-1 bg-zinc-250 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:bg-zinc-700"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1">
                    Value: {getImpactLabel(formData.impact)}
                  </span>
                </div>

              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Details & Context</label>
                <textarea
                  required
                  placeholder="Elaborate on current operations, how it affects patient safety or regulatory audits..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs bg-white text-zinc-950 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Mitigation strategy */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Mitigation Strategy Plan</label>
                <textarea
                  required
                  placeholder="Outline the safety measures, training, audits or equipment acquisitions scheduled..."
                  rows={2}
                  value={formData.mitigation}
                  onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs bg-white text-zinc-955 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Submit buttons */}
              <div className="flex gap-2.5 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="bg-white hover:bg-zinc-100 text-zinc-650 border border-zinc-200 rounded-lg px-4 py-2 font-semibold transition-colors dark:bg-zinc-800 dark:border-zinc-750 dark:text-zinc-300 dark:hover:bg-zinc-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-650 hover:bg-teal-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm transition-colors"
                >
                  Log Risk Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RisksPage;
