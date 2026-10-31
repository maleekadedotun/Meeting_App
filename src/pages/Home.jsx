// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  CheckSquare, 
  ArrowRight, 
  Plus, 
  CheckCircle, 
  Clock, 
  CheckSquare as CheckedIcon
} from 'lucide-react';
import { format } from 'date-fns';

export const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    upcomingMeetings: 0,
    activeRisks: 0,
    openIncidents: 0,
    myPendingTasks: 0,
  });

  const [upcomingMeetingsList, setUpcomingMeetingsList] = useState([]);
  const [myTasksList, setMyTasksList] = useState([]);
  const [timelineItems, setTimelineItems] = useState([]);

  // Load Dashboard Data
  const loadDashboardData = () => {
    const meetings = dbService.getMeetings();
    const incidents = dbService.getIncidents();
    const risks = dbService.getRisks();

    // 1. Calculate Metrics
    const upcoming = meetings.filter(m => m.status === 'Scheduled' || m.status === 'Ongoing');
    const openIncs = incidents.filter(i => i.status !== 'Resolved');
    const activeRsks = risks.filter(r => r.status === 'Identified');
    
    // Find action items assigned to the current user
    let myTasks = [];
    meetings.forEach(m => {
      if (m.actionItems && m.actionItems.length > 0) {
        m.actionItems.forEach(item => {
          if (item.assignee === currentUser?.name) {
            myTasks.push({
              ...item,
              meetingId: m.id,
              meetingTitle: m.title
            });
          }
        });
      }
    });
    
    const pendingTasksCount = myTasks.filter(t => t.status !== 'Completed').length;

    setMetrics({
      upcomingMeetings: upcoming.length,
      activeRisks: activeRsks.length,
      openIncidents: openIncs.length,
      myPendingTasks: pendingTasksCount,
    });

    // 2. Set List Data
    // Get next 3 upcoming meetings sorted by date
    const sortedUpcoming = [...upcoming].sort((a, b) => 
      new Date(a.schedule.startDateTime) - new Date(b.schedule.startDateTime)
    ).slice(0, 3);
    setUpcomingMeetingsList(sortedUpcoming);

    // Set user's tasks
    setMyTasksList(myTasks.slice(0, 5));

    // 3. Assemble Timeline of Recent Governance Activities
    const items = [];
    
    // Add completed meetings
    meetings.filter(m => m.status === 'Completed').forEach(m => {
      items.push({
        id: `m-${m.id}`,
        type: 'meeting',
        title: `Minutes Drafted: ${m.title}`,
        time: new Date(m.schedule.startDateTime),
        description: `Meeting finalized with ${m.actionItems.length} action items.`,
        tag: m.department,
        tagColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
      });
    });

    // Add incidents
    incidents.forEach(i => {
      items.push({
        id: `i-${i.id}`,
        type: 'incident',
        title: `Incident Safety Logged: ${i.title}`,
        time: new Date(i.date),
        description: `Logged by ${i.reporter}. Status: ${i.status} (${i.severity} Severity)`,
        tag: i.category,
        tagColor: i.severity === 'Critical' || i.severity === 'High'
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
      });
    });

    // Add risks
    risks.forEach(r => {
      items.push({
        id: `r-${r.id}`,
        type: 'risk',
        title: `Clinical Risk Identified: ${r.title}`,
        time: new Date(r.date),
        description: `Risk Level set to ${r.level}. Mitigation strategies mapped.`,
        tag: r.category,
        tagColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
      });
    });

    // Sort timeline items newest first
    const sortedTimeline = items.sort((a, b) => b.time - a.time).slice(0, 6);
    setTimelineItems(sortedTimeline);
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  // Handle task completion toggle
  const handleToggleTask = (meetingId, taskId) => {
    const meeting = dbService.getMeetingById(meetingId);
    if (!meeting) return;

    const updatedActionItems = meeting.actionItems.map(item => {
      if (item.id === taskId) {
        return {
          ...item,
          status: item.status === 'Completed' ? 'Pending' : 'Completed'
        };
      }
      return item;
    });

    dbService.updateMeeting(meetingId, { actionItems: updatedActionItems });
    loadDashboardData(); // Refresh UI metrics
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-rose-600 dark:text-rose-400';
      case 'Medium': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-zinc-500 dark:text-zinc-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome header banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {currentUser?.name} 👋
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Clinical Governance dashboard for {currentUser?.department} department.
          </p>
        </div>
        <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-lg px-4 py-2 text-sm shadow-sm flex items-center gap-2 text-zinc-500 dark:text-zinc-400 self-start md:self-auto font-medium">
          <Clock className="h-4.5 w-4.5 text-teal-500" />
          <span>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Upcoming Meetings */}
        <div 
          onClick={() => navigate('/meetings')}
          className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Scheduled Meetings</span>
            <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{metrics.upcomingMeetings}</span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Go to Hub <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Patient Safety Incidents */}
        <div 
          onClick={() => navigate('/incidents')}
          className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Open Incidents</span>
            <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{metrics.openIncidents}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Review log <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* KPI 3: Active Risks */}
        <div 
          onClick={() => navigate('/risks')}
          className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Risks</span>
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{metrics.activeRisks}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Inspect register <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: Pending Action Items */}
        <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">My Pending Tasks</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center justify-center">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{metrics.myPendingTasks}</span>
            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">assigned to you</span>
          </div>
        </div>

      </div>

      {/* Quick Governance Actions */}
      <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
          Quick Portal Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/meetings', { state: { openForm: true } })}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Schedule Meeting</span>
          </button>
          <button
            onClick={() => navigate('/incidents', { state: { openForm: true } })}
            className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-250 rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-sm dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-750 dark:hover:bg-zinc-750"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Report Patient Incident</span>
          </button>
          <button
            onClick={() => navigate('/risks', { state: { openForm: true } })}
            className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-250 rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-sm dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-750 dark:hover:bg-zinc-750"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Log Clinical Risk</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid: Clinical Governance Activity Feed */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-5">
            Recent Governance & Meeting Activity
          </h3>
          
          <div className="relative pl-6 border-l border-zinc-100 dark:border-zinc-800 space-y-6">
            {timelineItems.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No activities logged yet.</p>
            ) : (
              timelineItems.map((item) => (
                <div key={item.id} className="relative">
                  {/* Timeline point */}
                  <span className="absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-[#0c0c0f]">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                  </span>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {format(item.time, 'MMM dd, h:mm a')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${item.tagColor} mt-1`}>
                      {item.tag}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Grid: Scheduled Meetings & Active Tasks */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Section A: Upcoming Meetings */}
          <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Today & Upcoming Meetings
              </h3>
              <button 
                onClick={() => navigate('/meetings')}
                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                View Hub
              </button>
            </div>

            <div className="space-y-3">
              {upcomingMeetingsList.length === 0 ? (
                <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-[#09090b]">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">No upcoming meetings scheduled.</p>
                </div>
              ) : (
                upcomingMeetingsList.map((meeting) => (
                  <div 
                    key={meeting.id}
                    onClick={() => navigate('/meetings')}
                    className="group border border-zinc-150 dark:border-zinc-800 rounded-lg p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400">
                        {meeting.type}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {format(new Date(meeting.schedule.startDateTime), 'MMM dd')} @ {format(new Date(meeting.schedule.startDateTime), 'h:mm a')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 group-hover:text-teal-600 dark:text-zinc-100 dark:group-hover:text-teal-400 mt-2">
                      {meeting.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">
                      📍 {meeting.schedule.location} • {meeting.attendees.length} Attendees
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section B: User Tasks Panel */}
          <div className="bg-white border border-zinc-200 dark:bg-[#0c0c0f] dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              My Action Items
            </h3>

            <div className="space-y-3">
              {myTasksList.length === 0 ? (
                <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-[#09090b]">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">You have no tasks assigned to you.</p>
                </div>
              ) : (
                myTasksList.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2.5 max-w-[80%]">
                      <button
                        onClick={() => handleToggleTask(task.meetingId, task.id)}
                        className="mt-0.5 text-zinc-400 hover:text-teal-600 transition-colors"
                        title={task.status === 'Completed' ? "Mark Pending" : "Mark Completed"}
                      >
                        {task.status === 'Completed' ? (
                          <CheckCircle className="h-4.5 w-4.5 text-teal-600 dark:text-teal-500" />
                        ) : (
                          <div className="h-4.5 w-4.5 border border-zinc-300 dark:border-zinc-700 rounded" />
                        )}
                      </button>
                      <div>
                        <p className={`text-xs font-semibold ${task.status === 'Completed' ? 'line-through text-zinc-450 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Assigned during: <span className="italic">{task.meetingTitle}</span>
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Due: {task.dueDate}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default Home;
