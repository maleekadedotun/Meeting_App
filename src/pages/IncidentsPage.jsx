// src/pages/IncidentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dbService } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Clock,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export const IncidentsPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // --- STATE ---
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  // Form Modal Toggle
  const [showReportForm, setShowReportForm] = useState(false);

  // New Incident Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Patient Safety',
    severity: 'Medium',
    description: '',
    actionsTaken: ''
  });

  // Workflow Transition inputs
  const [resolutionInput, setResolutionInput] = useState('');
  const [actionsTakenInput, setActionsTakenInput] = useState('');

  // --- DATA LOADING ---
  const loadIncidents = () => {
    const dbIncidents = dbService.getIncidents();
    setIncidents(dbIncidents);

    // Refresh selected incident details if open
    if (selectedIncident) {
      const refreshed = dbIncidents.find(i => i.id === selectedIncident.id);
      if (refreshed) {
        setSelectedIncident(refreshed);
        setResolutionInput(refreshed.resolution || '');
        setActionsTakenInput(refreshed.actionsTaken || '');
      }
    }
  };

  useEffect(() => {
    loadIncidents();
    
    // Quick action trigger from dashboard
    if (location.state?.openForm) {
      setShowReportForm(true);
    }
  }, [location]);

  // Set default selected incident
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncident) {
      setSelectedIncident(incidents[0]);
      setResolutionInput(incidents[0].resolution || '');
      setActionsTakenInput(incidents[0].actionsTaken || '');
    }
  }, [incidents]);

  // --- INCIDENT MUTATIONS ---
  const handleSubmitReport = (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      category: formData.category,
      severity: formData.severity,
      description: formData.description,
      actionsTaken: formData.actionsTaken,
      reporter: currentUser?.name || 'Staff'
    };

    const newInc = dbService.createIncident(payload);
    setSelectedIncident(newInc);
    setShowReportForm(false);
    setFormData({
      title: '',
      category: 'Patient Safety',
      severity: 'Medium',
      description: '',
      actionsTaken: ''
    });
    loadIncidents();
  };

  const handleUpdateWorkflow = (nextStatus) => {
    if (!selectedIncident) return;
    
    const updatePayload = {
      status: nextStatus,
      actionsTaken: actionsTakenInput,
      resolution: nextStatus === 'Resolved' ? resolutionInput : selectedIncident.resolution
    };

    dbService.updateIncident(selectedIncident.id, updatePayload);
    loadIncidents();
  };

  // --- FILTERS & SEARCH ---
  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || i.category === categoryFilter;
    const matchesSeverity = severityFilter === 'All' || i.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // --- STYLING HELPERS ---
  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-100 text-rose-800 border-rose-250 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900';
      case 'High': return 'bg-orange-100 text-orange-850 border-orange-250 dark:bg-orange-950/30 dark:text-orange-450 dark:border-orange-900';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-250 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-750';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Reported': return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800';
      case 'In Review': return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800';
      default: return 'bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            Patient Safety & Incident Log
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Clinical incident reports and safety audit registers.
          </p>
        </div>
        <button
          onClick={() => setShowReportForm(true)}
          className="flex items-center gap-2 bg-teal-650 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Report Safety Incident</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-850 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search incident logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 rounded-lg text-sm bg-zinc-50 dark:border-zinc-800 dark:bg-[#09090b] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Categories */}
        <div className="w-full md:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2 border border-zinc-200 rounded-lg text-xs bg-white dark:border-zinc-800 dark:bg-[#09090b] dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Categories</option>
            <option value="Patient Safety">Patient Safety</option>
            <option value="Medication">Medication</option>
            <option value="Facility/Equipment">Facility/Equipment</option>
            <option value="Staffing">Staffing</option>
            <option value="Information Security">Information Security</option>
          </select>
        </div>

        {/* Severity */}
        <div className="w-full md:w-48">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full p-2 border border-zinc-200 rounded-lg text-xs bg-white dark:border-zinc-800 dark:bg-[#09090b] dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)] overflow-hidden items-stretch">
        
        {/* Left Side: Incidents Table Card */}
        <div className={`bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-850 rounded-xl overflow-hidden shadow-sm flex flex-col h-full ${
          selectedIncident ? 'lg:col-span-7' : 'lg:col-span-12'
        } transition-all duration-300`}>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 text-zinc-500 dark:bg-[#09090b] dark:border-zinc-850 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Incident</th>
                  <th className="p-3.5 hidden md:table-cell">Category</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 hidden sm:table-cell">Date Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-zinc-450 italic">No incidents match the filters.</td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => {
                        setSelectedIncident(inc);
                        setResolutionInput(inc.resolution || '');
                        setActionsTakenInput(inc.actionsTaken || '');
                      }}
                      className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-850/60 cursor-pointer transition-colors ${
                        selectedIncident?.id === inc.id 
                          ? 'bg-teal-50/10 dark:bg-teal-950/10' 
                          : ''
                      }`}
                    >
                      <td className="p-3.5 pl-5">
                        <p className="font-bold text-zinc-950 dark:text-zinc-100 max-w-xs truncate">{inc.title}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Reporter: {inc.reporter}</p>
                      </td>
                      <td className="p-3.5 hidden md:table-cell font-medium text-zinc-500 dark:text-zinc-450">
                        {inc.category}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(inc.severity)}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(inc.status)}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 hidden sm:table-cell text-zinc-500 dark:text-zinc-400">
                        {format(new Date(inc.date), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Side: Investigation Workflow Side Panel */}
        {selectedIncident && (
          <div className="lg:col-span-5 bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-850 rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden animate-fade-in relative z-20">
            {/* Close button */}
            <button
              onClick={() => setSelectedIncident(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header info */}
            <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4 mb-4">
              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${getSeverityBadgeClass(selectedIncident.severity)} mb-2`}>
                {selectedIncident.severity} Severity
              </span>
              <h2 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50 pr-6">
                {selectedIncident.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-450 mt-2">
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Logged by: {selectedIncident.reporter}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(selectedIncident.date), 'MMM dd, yyyy h:mm a')}</span>
              </div>
            </div>

            {/* Description & Action scrolling container */}
            <div className="flex-1 overflow-y-auto space-y-5 text-xs pr-1">
              
              {/* Incident Details Text */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Detailed Description
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 border border-zinc-150 p-3 rounded-lg dark:bg-zinc-900/35 dark:border-zinc-850 whitespace-pre-line leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Immediate Actions Taken */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Immediate Actions Taken
                </h3>
                <textarea
                  value={actionsTakenInput}
                  onChange={(e) => setActionsTakenInput(e.target.value)}
                  disabled={selectedIncident.status === 'Resolved'}
                  placeholder="Record immediate counter-measures implemented..."
                  rows={2}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:disabled:bg-zinc-900/40"
                />
              </div>

              {/* Resolution block */}
              <div>
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Corrective & Preventive Action (CAPA) Resolution
                </h3>
                {selectedIncident.status === 'Resolved' ? (
                  <p className="text-zinc-700 dark:text-zinc-300 bg-emerald-50/20 border border-emerald-200/50 p-3 rounded-lg dark:bg-emerald-950/10 dark:border-emerald-900/30 leading-relaxed">
                    {selectedIncident.resolution}
                  </p>
                ) : (
                  <textarea
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="Document root cause, corrective actions, and prevention logs..."
                    rows={3}
                    className="w-full border border-zinc-200 rounded-lg p-2.5 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                )}
              </div>

              {/* Workflow Transitions */}
              {selectedIncident.status !== 'Resolved' && (
                <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Transition Workflow Status</p>
                  <div className="flex gap-2">
                    {selectedIncident.status === 'Reported' && (
                      <button
                        onClick={() => handleUpdateWorkflow('In Review')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 font-semibold shadow-sm transition-colors text-center"
                      >
                        Start Review
                      </button>
                    )}
                    {(selectedIncident.status === 'Reported' || selectedIncident.status === 'In Review') && (
                      <button
                        onClick={() => {
                          if (!resolutionInput.trim()) {
                            alert('Please fill out the resolution CAPA text before resolving.');
                            return;
                          }
                          handleUpdateWorkflow('Resolved');
                        }}
                        className="flex-1 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg py-2 font-semibold shadow-sm transition-colors text-center"
                      >
                        Mark Resolved (CAPA Complete)
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* --- REPORT INCIDENT MODAL DIALOG --- */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-zoom-in relative">
            <button
              onClick={() => setShowReportForm(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-3.5 mb-4">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50">Report Clinical Incident</h2>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              
              {/* Incident Title */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="Medication error bed 12, ventilator warning, patient fall..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Category & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-950 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="Patient Safety">Patient Safety</option>
                    <option value="Medication">Medication</option>
                    <option value="Facility/Equipment">Facility/Equipment</option>
                    <option value="Staffing">Staffing</option>
                    <option value="Information Security">Information Security</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full p-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-950 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Detailed Description</label>
                <textarea
                  required
                  placeholder="Record date/time, clinical impact, patient vitals, and actions taken..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-3 text-xs bg-white text-zinc-950 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Immediate Actions Taken */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Immediate Actions Taken</label>
                <textarea
                  placeholder="BioMed called, patient vitals checked, ICU notified..."
                  rows={2}
                  value={formData.actionsTaken}
                  onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-3 text-xs bg-white text-zinc-950 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="bg-white hover:bg-zinc-100 text-zinc-650 border border-zinc-200 rounded-lg px-4 py-2 font-semibold transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-650 hover:bg-teal-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm transition-colors"
                >
                  Log Report
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default IncidentsPage;
