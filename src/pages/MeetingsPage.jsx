// src/pages/MeetingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dbService } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Trash2, 
  Edit, 
  ArrowLeft, 
  Check,
  AlertTriangle,
  ShieldAlert,
  Link2,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

export const MeetingsPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // --- STATE ---
  const [meetings, setMeetings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [risks, setRisks] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Form Mode: 'view' | 'create' | 'edit'
  const [mode, setMode] = useState('view');
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'Clinical Review',
    department: 'Cardiology',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: 'Boardroom A',
    agendaItem: '',
    agenda: [],
    status: 'Scheduled'
  });

  // Editor states
  const [minutesInput, setMinutesInput] = useState('');
  const [editingMinutes, setEditingMinutes] = useState(false);
  
  // Action Item states
  const [newTask, setNewTask] = useState({
    title: '',
    assignee: '',
    dueDate: '',
    priority: 'Medium'
  });

  // Link Dialog states
  const [linkIncidentId, setLinkIncidentId] = useState('');
  const [linkRiskId, setLinkRiskId] = useState('');

  // --- DATA LOADING ---
  const loadData = () => {
    const dbMeetings = dbService.getMeetings();
    setMeetings(dbMeetings);
    setIncidents(dbService.getIncidents());
    setRisks(dbService.getRisks());

    // Sync selected meeting if viewing details
    if (selectedMeeting) {
      const refreshed = dbMeetings.find(m => m.id === selectedMeeting.id);
      if (refreshed) {
        setSelectedMeeting(refreshed);
        setMinutesInput(refreshed.minutes || '');
      }
    }
  };

  useEffect(() => {
    loadData();
    
    // Check if redirecting from dashboard with quick action to open form
    if (location.state?.openForm) {
      handleOpenCreate();
    }
  }, [location]);

  // Set initial selected meeting
  useEffect(() => {
    if (meetings.length > 0 && !selectedMeeting && mode === 'view') {
      setSelectedMeeting(meetings[0]);
      setMinutesInput(meetings[0].minutes || '');
    }
  }, [meetings]);

  // --- FORM HANDLERS ---
  const handleOpenCreate = () => {
    setMode('create');
    setFormData({
      title: '',
      type: 'Clinical Review',
      department: currentUser?.department || 'Cardiology',
      description: '',
      startDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDateTime: format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      location: 'Boardroom A',
      agendaItem: '',
      agenda: [],
      status: 'Scheduled'
    });
  };

  const handleOpenEdit = (meeting) => {
    setMode('edit');
    setFormData({
      title: meeting.title,
      type: meeting.type,
      department: meeting.department,
      description: meeting.description,
      startDateTime: meeting.schedule.startDateTime ? meeting.schedule.startDateTime.substring(0, 16) : '',
      endDateTime: meeting.schedule.endDateTime ? meeting.schedule.endDateTime.substring(0, 16) : '',
      location: meeting.schedule.location,
      agendaItem: '',
      agenda: meeting.agenda || [],
      status: meeting.status
    });
  };

  const handleAddAgenda = (e) => {
    e.preventDefault();
    if (!formData.agendaItem.trim()) return;
    setFormData({
      ...formData,
      agenda: [...formData.agenda, formData.agendaItem.trim()],
      agendaItem: ''
    });
  };

  const handleRemoveAgenda = (index) => {
    setFormData({
      ...formData,
      agenda: formData.agenda.filter((_, i) => i !== index)
    });
  };

  const handleSaveMeeting = (e) => {
    e.preventDefault();
    const meetingPayload = {
      title: formData.title,
      type: formData.type,
      department: formData.department,
      description: formData.description,
      schedule: {
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString(),
        location: formData.location
      },
      status: formData.status,
      agenda: formData.agenda
    };

    if (mode === 'create') {
      // Add default attendees (mock data: current user and others)
      const allUsers = dbService.getUsers();
      meetingPayload.attendees = allUsers.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        status: u.id === currentUser?.id ? 'Confirmed' : 'Invited'
      }));

      const newMeeting = dbService.createMeeting(meetingPayload);
      setSelectedMeeting(newMeeting);
    } else if (mode === 'edit' && selectedMeeting) {
      dbService.updateMeeting(selectedMeeting.id, meetingPayload);
    }

    setMode('view');
    loadData();
  };

  const handleDeleteMeeting = (id) => {
    if (window.confirm('Are you sure you want to delete this meeting? This action is irreversible.')) {
      dbService.deleteMeeting(id);
      setSelectedMeeting(null);
      setMode('view');
      loadData();
    }
  };

  // --- INTERACTIVE SECTION WORKERS ---
  const handleToggleAttendance = (userId) => {
    if (!selectedMeeting) return;
    
    const statuses = ['Invited', 'Confirmed', 'Absent', 'On-Call'];
    const currentAttendee = selectedMeeting.attendees.find(a => a.id === userId);
    if (!currentAttendee) return;

    const currentIdx = statuses.indexOf(currentAttendee.status);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];

    const updatedAttendees = selectedMeeting.attendees.map(a => {
      if (a.id === userId) {
        return { ...a, status: nextStatus };
      }
      return a;
    });

    dbService.updateMeeting(selectedMeeting.id, { attendees: updatedAttendees });
    loadData();
  };

  const handleSaveMinutes = () => {
    if (!selectedMeeting) return;
    dbService.updateMeeting(selectedMeeting.id, { 
      minutes: minutesInput,
      status: selectedMeeting.status === 'Scheduled' ? 'Ongoing' : selectedMeeting.status 
    });
    setEditingMinutes(false);
    loadData();
  };

  const handleCompleteMeeting = () => {
    if (!selectedMeeting) return;
    if (window.confirm('Do you want to finalize this meeting? This will mark it as Completed.')) {
      dbService.updateMeeting(selectedMeeting.id, { status: 'Completed' });
      loadData();
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assignee) return;

    const taskObject = {
      id: `act-${Date.now()}`,
      title: newTask.title.trim(),
      assignee: newTask.assignee,
      dueDate: newTask.dueDate || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'Pending',
      priority: newTask.priority
    };

    const updatedTasks = [...(selectedMeeting.actionItems || []), taskObject];
    dbService.updateMeeting(selectedMeeting.id, { actionItems: updatedTasks });
    
    setNewTask({
      title: '',
      assignee: '',
      dueDate: '',
      priority: 'Medium'
    });
    loadData();
  };

  const handleToggleTaskStatus = (taskId) => {
    const updatedTasks = selectedMeeting.actionItems.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: t.status === 'Completed' ? 'Pending' : 'Completed'
        };
      }
      return t;
    });

    dbService.updateMeeting(selectedMeeting.id, { actionItems: updatedTasks });
    loadData();
  };

  const handleLinkIncident = () => {
    if (!linkIncidentId || !selectedMeeting) return;
    const currentLinks = selectedMeeting.linkedIncidents || [];
    if (currentLinks.includes(Number(linkIncidentId))) return;

    const updatedLinks = [...currentLinks, Number(linkIncidentId)];
    dbService.updateMeeting(selectedMeeting.id, { linkedIncidents: updatedLinks });
    setLinkIncidentId('');
    loadData();
  };

  const handleLinkRisk = () => {
    if (!linkRiskId || !selectedMeeting) return;
    const currentLinks = selectedMeeting.linkedRisks || [];
    if (currentLinks.includes(Number(linkRiskId))) return;

    const updatedLinks = [...currentLinks, Number(linkRiskId)];
    dbService.updateMeeting(selectedMeeting.id, { linkedRisks: updatedLinks });
    setLinkRiskId('');
    loadData();
  };

  // --- FILTERS & SEARCH ---
  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesDept = deptFilter === 'All' || m.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'Ongoing': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      default: return 'bg-zinc-50 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-400';
    }
  };

  const getAttendanceLabelColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Absent': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      case 'On-Call': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-112px)] overflow-hidden">
      
      {/* --- LEFT SIDEBAR: MEETINGS LIST --- */}
      <div className="w-full lg:w-1/3 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-[#0c0c0f] p-4 flex flex-col h-full overflow-hidden shadow-sm">
        
        {/* Header & Schedule Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Staff Meetings</h2>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50 dark:border-zinc-800 dark:bg-[#09090b] dark:text-zinc-100 dark:focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-1.5 border border-zinc-200 rounded-lg text-xs bg-white dark:border-zinc-850 dark:bg-[#09090b] dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full p-1.5 border border-zinc-200 rounded-lg text-xs bg-white dark:border-zinc-850 dark:bg-[#09090b] dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="All">All Depts</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Nursing">Nursing</option>
              <option value="Administration">Administration</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </div>

        {/* Meeting Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredMeetings.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">No meetings found.</p>
          ) : (
            filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setMinutesInput(meeting.minutes || '');
                  setEditingMinutes(false);
                  setMode('view');
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedMeeting?.id === meeting.id
                    ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/10'
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/20 dark:text-teal-400 px-1.5 py-0.5 rounded">
                    {meeting.department}
                  </span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getStatusColor(meeting.status)}`}>
                    {meeting.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-100 mt-2 leading-snug">
                  {meeting.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(meeting.schedule.startDateTime), 'MMM dd')} @ {format(new Date(meeting.schedule.startDateTime), 'h:mm a')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT PANEL: MEETING VIEW / EDITOR --- */}
      <div className="flex-1 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-[#0c0c0f] flex flex-col h-full overflow-hidden shadow-sm">
        
        {/* --- VIEW MODE --- */}
        {mode === 'view' && selectedMeeting && (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header toolbar */}
            <div className="border-b border-zinc-200 dark:border-zinc-850 p-4 flex items-center justify-between bg-zinc-50/50 dark:bg-[#09090b]/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 px-2 py-0.5 rounded">
                    {selectedMeeting.type}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(selectedMeeting.status)}`}>
                    {selectedMeeting.status}
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 mt-2">
                  {selectedMeeting.title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedMeeting)}
                  className="p-2 border border-zinc-250 rounded-lg text-zinc-650 hover:bg-zinc-100 dark:border-zinc-750 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                  title="Edit Info"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                  className="p-2 border border-rose-250 rounded-lg text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-950/20 transition-colors"
                  title="Delete Meeting"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrolling Body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
              
              {/* Core metadata: Time, Room */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-150 p-4 rounded-xl dark:bg-[#09090b] dark:border-zinc-850">
                <div className="flex items-center gap-2.5 text-sm text-zinc-650 dark:text-zinc-300">
                  <Calendar className="h-4.5 w-4.5 text-teal-500" />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {format(new Date(selectedMeeting.schedule.startDateTime), 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {format(new Date(selectedMeeting.schedule.startDateTime), 'h:mm a')} - {format(new Date(selectedMeeting.schedule.endDateTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-zinc-650 dark:text-zinc-300">
                  <MapPin className="h-4.5 w-4.5 text-teal-500" />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Location</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{selectedMeeting.schedule.location}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedMeeting.description && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 p-3 rounded-lg dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-850">
                    {selectedMeeting.description}
                  </p>
                </div>
              )}

              {/* Grid 2-columns: Agenda & Attendees */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Agenda */}
                <div className="md:col-span-7 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    <span>Meeting Agenda</span>
                  </h3>
                  <div className="border border-zinc-150 rounded-xl p-4 dark:border-zinc-850">
                    {selectedMeeting.agenda?.length === 0 ? (
                      <p className="text-xs text-zinc-400">No agenda items added.</p>
                    ) : (
                      <ul className="space-y-2.5 text-xs text-zinc-750 dark:text-zinc-300">
                        {selectedMeeting.agenda.map((item, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-bold text-teal-600 dark:text-teal-400">{idx + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Attendees Checklist */}
                <div className="md:col-span-5 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>Attendance Checklist</span>
                  </h3>
                  <div className="border border-zinc-150 rounded-xl p-3 dark:border-zinc-850 space-y-2 max-h-56 overflow-y-auto">
                    {selectedMeeting.attendees?.map((att) => (
                      <button
                        key={att.id}
                        onClick={() => handleToggleAttendance(att.id)}
                        className="flex items-center justify-between w-full p-2 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg text-left transition-colors group"
                        title="Click to cycle status: Invited -> Confirmed -> Absent -> On-Call"
                      >
                        <div className="text-[11px]">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">{att.name}</p>
                          <p className="text-[9px] text-zinc-450 dark:text-zinc-500">{att.role}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${getAttendanceLabelColor(att.status)}`}>
                          {att.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Minutes of Meeting (MoM) Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>Minutes of Meeting (MoM)</span>
                  </h3>
                  
                  {selectedMeeting.status !== 'Completed' && (
                    <button
                      onClick={() => setEditingMinutes(!editingMinutes)}
                      className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                    >
                      {editingMinutes ? 'Cancel' : selectedMeeting.minutes ? 'Edit Minutes' : 'Write Minutes'}
                    </button>
                  )}
                </div>

                {editingMinutes ? (
                  <div className="space-y-3">
                    <textarea
                      value={minutesInput}
                      onChange={(e) => setMinutesInput(e.target.value)}
                      placeholder="Type details, clinical notes, decision results..."
                      rows={5}
                      className="w-full border border-zinc-250 rounded-lg p-3 text-xs bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveMinutes}
                        className="bg-teal-650 hover:bg-teal-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" /> Save Minutes
                      </button>
                      <button
                        onClick={() => {
                          setMinutesInput(selectedMeeting.minutes || '');
                          setEditingMinutes(false);
                        }}
                        className="bg-white hover:bg-zinc-100 text-zinc-650 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-750"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-zinc-150 rounded-xl p-4 bg-zinc-50/20 dark:border-zinc-850 dark:bg-[#0c0c0f]">
                    {selectedMeeting.minutes ? (
                      <p className="text-xs text-zinc-750 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                        {selectedMeeting.minutes}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-450 italic dark:text-zinc-500 text-center py-4">
                        Minutes have not been documented yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Items Panel */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4" />
                  <span>Action Items & Assignments</span>
                </h3>
                
                {/* List action items */}
                <div className="border border-zinc-150 rounded-xl p-4 dark:border-zinc-850 space-y-3">
                  {selectedMeeting.actionItems?.length === 0 ? (
                    <p className="text-xs text-zinc-450 italic dark:text-zinc-500">No action items assigned to this meeting.</p>
                  ) : (
                    selectedMeeting.actionItems.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-850 pb-2.5 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => selectedMeeting.status !== 'Completed' && handleToggleTaskStatus(task.id)}
                            className={`mt-0.5 ${selectedMeeting.status === 'Completed' ? 'cursor-not-allowed opacity-70' : 'hover:text-teal-600'} text-zinc-400 transition-colors`}
                            disabled={selectedMeeting.status === 'Completed'}
                          >
                            {task.status === 'Completed' ? (
                              <CheckCircle className="h-4.5 w-4.5 text-teal-650" />
                            ) : (
                              <div className="h-4.5 w-4.5 border border-zinc-300 dark:border-zinc-700 rounded" />
                            )}
                          </button>
                          <div>
                            <p className={`text-xs font-semibold ${task.status === 'Completed' ? 'line-through text-zinc-450' : 'text-zinc-800 dark:text-zinc-200'}`}>
                              {task.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              Assignee: <span className="font-medium text-zinc-650 dark:text-zinc-300">{task.assignee}</span> • Due: {task.dueDate}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          task.priority === 'High' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' : 
                          task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20' : 
                          'bg-zinc-50 text-zinc-600 dark:bg-zinc-850'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add task form */}
                {selectedMeeting.status !== 'Completed' && (
                  <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Task Title</label>
                      <input
                        type="text"
                        required
                        placeholder="Update clinical SOPs..."
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Assignee</label>
                      <select
                        required
                        value={newTask.assignee}
                        onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                        className="w-full p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        <option value="">Assign To...</option>
                        {selectedMeeting.attendees.map(a => (
                          <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-teal-650 hover:bg-teal-700 text-white rounded-lg py-1.5 text-xs font-semibold transition-colors shadow-sm"
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Linked Governance: Incidents & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
                
                {/* Linked Incidents */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Linked Incidents</span>
                  </h3>
                  
                  <div className="border border-zinc-150 rounded-xl p-3.5 dark:border-zinc-850 space-y-2">
                    {selectedMeeting.linkedIncidents?.length === 0 ? (
                      <p className="text-xs text-zinc-450 italic dark:text-zinc-500">No incidents linked.</p>
                    ) : (
                      selectedMeeting.linkedIncidents.map(incId => {
                        const inc = incidents.find(i => i.id === incId);
                        if (!inc) return null;
                        return (
                          <div key={incId} className="p-2 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center text-xs">
                            <span className="font-semibold text-zinc-850 dark:text-zinc-200 line-clamp-1">{inc.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/20">{inc.severity}</span>
                          </div>
                        );
                      })
                    )}
                    
                    {selectedMeeting.status !== 'Completed' && (
                      <div className="flex gap-1.5 pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-850">
                        <select
                          value={linkIncidentId}
                          onChange={(e) => setLinkIncidentId(e.target.value)}
                          className="flex-1 p-1 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                          <option value="">Link Incident...</option>
                          {incidents.map(i => (
                            <option key={i.id} value={i.id}>{i.title}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleLinkIncident}
                          className="p-1.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg border border-zinc-250 dark:border-zinc-750"
                          title="Link Incident"
                        >
                          <Link2 className="h-3.5 w-3.5 text-zinc-650 dark:text-zinc-300" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Risks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Linked Risks</span>
                  </h3>
                  
                  <div className="border border-zinc-150 rounded-xl p-3.5 dark:border-zinc-850 space-y-2">
                    {selectedMeeting.linkedRisks?.length === 0 ? (
                      <p className="text-xs text-zinc-455 italic dark:text-zinc-500">No risks linked.</p>
                    ) : (
                      selectedMeeting.linkedRisks.map(riskId => {
                        const rsk = risks.find(r => r.id === riskId);
                        if (!rsk) return null;
                        return (
                          <div key={riskId} className="p-2 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center text-xs">
                            <span className="font-semibold text-zinc-855 dark:text-zinc-200 line-clamp-1">{rsk.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              rsk.level === 'Critical' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                              rsk.level === 'High' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20' :
                              'bg-zinc-50 text-zinc-600 dark:bg-zinc-850'
                            }`}>{rsk.level}</span>
                          </div>
                        );
                      })
                    )}
                    
                    {selectedMeeting.status !== 'Completed' && (
                      <div className="flex gap-1.5 pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-850">
                        <select
                          value={linkRiskId}
                          onChange={(e) => setLinkRiskId(e.target.value)}
                          className="flex-1 p-1 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-955 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                          <option value="">Link Risk...</option>
                          {risks.map(r => (
                            <option key={r.id} value={r.id}>{r.title}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleLinkRisk}
                          className="p-1.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg border border-zinc-250 dark:border-zinc-750"
                          title="Link Risk"
                        >
                          <Link2 className="h-3.5 w-3.5 text-zinc-655 dark:text-zinc-300" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Complete meeting button */}
              {selectedMeeting.status !== 'Completed' && (
                <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end">
                  <button
                    onClick={handleCompleteMeeting}
                    className="bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-sm"
                  >
                    Finalize & Complete Meeting
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* --- FORM MODE (CREATE/EDIT) --- */}
        {(mode === 'create' || mode === 'edit') && (
          <form onSubmit={handleSaveMeeting} className="flex flex-col h-full overflow-hidden">
            
            {/* Header toolbar */}
            <div className="border-b border-zinc-200 dark:border-zinc-850 p-4 flex items-center justify-between bg-zinc-50/50 dark:bg-[#09090b]/20">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg text-zinc-600 dark:text-zinc-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  {mode === 'create' ? 'Schedule Staff Meeting' : 'Edit Meeting Details'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="bg-teal-650 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors"
                >
                  Save Meeting
                </button>
              </div>
            </div>

            {/* Form Fields Scrolling Area */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
              
              {/* Meeting Title */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Pediatric Ward ICU Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              {/* Type and Dept */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Meeting Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 border border-zinc-200 rounded-lg text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="Clinical Review">Clinical Review</option>
                    <option value="Departmental">Departmental</option>
                    <option value="Board Meeting">Board Meeting</option>
                    <option value="General Staff Meeting">General Staff Meeting</option>
                    <option value="Emergency Response">Emergency Response</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 border border-zinc-200 rounded-lg text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Administration">Administration</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Location & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Boardroom A / MS Teams"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border border-zinc-200 rounded-lg text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  placeholder="Explain meeting objectives, reports to prepare..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-3 text-sm bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              {/* Agenda Builder */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Construct Agenda Items</label>
                
                {/* Agenda list */}
                <div className="border border-zinc-150 rounded-lg p-3 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-950/20">
                  {formData.agenda.length === 0 ? (
                    <p className="text-xs text-zinc-450 italic">No agenda items added yet.</p>
                  ) : (
                    formData.agenda.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 px-3 py-1.5 rounded-lg">
                        <span className="text-xs text-zinc-800 dark:text-zinc-200">{idx + 1}. {item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAgenda(idx)}
                          className="text-xs text-rose-500 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add agenda input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type an agenda item..."
                    value={formData.agendaItem}
                    onChange={(e) => setFormData({ ...formData, agendaItem: e.target.value })}
                    className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddAgenda}
                    className="bg-zinc-100 dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-750 px-3 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Add Item
                  </button>
                </div>
              </div>

            </div>
          </form>
        )}

        {/* --- EMPTY STATE --- */}
        {!selectedMeeting && mode === 'view' && (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-zinc-500">
            <Calendar className="h-12 w-12 text-zinc-300 mb-3" />
            <h3 className="font-bold text-zinc-700 dark:text-zinc-400">No Meeting Selected</h3>
            <p className="text-xs text-zinc-450 mt-1">Select a meeting from the list or click "Schedule" to create a new one.</p>
          </div>
        )}

      </div>

    </div>
  );
};

export default MeetingsPage;
