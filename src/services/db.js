// src/services/db.js

const INITIAL_USERS = [
  { id: 1, name: 'Dr. Kunle Cole', email: 'k.cole@isalu.org', role: 'Chief Medical Officer', department: 'Cardiology', avatar: 'KC' },
  { id: 2, name: 'Nurse Sarah Benson', email: 's.benson@isalu.org', role: 'Head of Nursing', department: 'Nursing', avatar: 'SB' },
  { id: 3, name: 'Dr. Amara Nwosu', email: 'a.nwosu@isalu.org', role: 'Resident Physician', department: 'Pediatrics', avatar: 'AN' },
  { id: 4, name: 'Admin Chief Victor', email: 'v.ogba@isalu.org', role: 'Hospital Administrator', department: 'Administration', avatar: 'VO' }
];

const INITIAL_MEETINGS = [
  {
    id: 1,
    title: 'Monthly Clinical Audit & Case Review',
    type: 'Clinical Review',
    department: 'Cardiology',
    description: 'Review of post-op cardiac arrest incidents and validation of ICU cardiology guidelines.',
    schedule: {
      startDateTime: '2026-06-24T09:00:00.000Z',
      endDateTime: '2026-06-24T10:30:00.000Z',
      location: 'Boardroom A / Zoom'
    },
    status: 'Completed',
    attendees: [
      { id: 1, name: 'Dr. Kunle Cole', role: 'Chief Medical Officer', status: 'Confirmed' },
      { id: 2, name: 'Nurse Sarah Benson', role: 'Head of Nursing', status: 'Confirmed' },
      { id: 3, name: 'Dr. Amara Nwosu', role: 'Resident Physician', status: 'Absent' }
    ],
    agenda: [
      'Review of ICU Cardiac Alarm silencing incident (#1)',
      'Equipment calibration backlog status',
      'Approval of new cardiology nursing guidelines'
    ],
    minutes: 'The committee analyzed the Cardiac Monitor Alarm Silence incident (#1). Dr. Cole highlighted the risk of alarms being muted during overnight shifts. Nurse Sarah reported that shift transition guidelines have been updated to ensure clinical alarm audits. Recommended locking monitor options. Facility maintenance backlog for ventilators is also being tracked as an active clinical risk.',
    actionItems: [
      { id: 'act-1', title: 'Draft new ICU Cardiac Monitor protocols and lock policies', assignee: 'Dr. Kunle Cole', dueDate: '2026-07-02', status: 'Completed', priority: 'High' },
      { id: 'act-2', title: 'Conduct training on alarm lock features for pediatric staff', assignee: 'Nurse Sarah Benson', dueDate: '2026-07-05', status: 'Pending', priority: 'Medium' }
    ],
    linkedIncidents: [1],
    linkedRisks: [2, 3]
  },
  {
    id: 2,
    title: 'Pediatric Department Daily Handovers',
    type: 'Departmental',
    department: 'Pediatrics',
    description: 'Morning briefing and staff alignment for ward handovers and bed occupancy.',
    schedule: {
      startDateTime: '2026-06-25T08:00:00.000Z',
      endDateTime: '2026-06-25T08:30:00.000Z',
      location: 'Ward 4B Conference Room'
    },
    status: 'Scheduled',
    attendees: [
      { id: 3, name: 'Dr. Amara Nwosu', role: 'Resident Physician', status: 'Confirmed' },
      { id: 2, name: 'Nurse Sarah Benson', role: 'Head of Nursing', status: 'Confirmed' }
    ],
    agenda: [
      'Overnight patient updates and critical admissions',
      'Discharge planning for clinical optimization',
      'Pediatric ICU occupancy report'
    ],
    minutes: '',
    actionItems: [],
    linkedIncidents: [],
    linkedRisks: []
  },
  {
    id: 3,
    title: 'Quarterly Governance and Compliance Review',
    type: 'Board Meeting',
    department: 'Administration',
    description: 'Review of hospital compliance, clinical risk registers, and NHIS audit preparation.',
    schedule: {
      startDateTime: '2026-06-26T14:00:00.000Z',
      endDateTime: '2026-06-26T16:00:00.000Z',
      location: 'Executive Conference Room'
    },
    status: 'Scheduled',
    attendees: [
      { id: 1, name: 'Dr. Kunle Cole', role: 'Chief Medical Officer', status: 'Confirmed' },
      { id: 4, name: 'Admin Chief Victor', role: 'Hospital Administrator', status: 'Confirmed' },
      { id: 2, name: 'Nurse Sarah Benson', role: 'Head of Nursing', status: 'Invited' }
    ],
    agenda: [
      'Review of Q2 Risk registers & critical staffing shortages',
      'Incident log trends and equipment safety audits',
      'NHIS compliance certification updates'
    ],
    minutes: '',
    actionItems: [],
    linkedIncidents: [],
    linkedRisks: [1, 2]
  }
];

const INITIAL_INCIDENTS = [
  {
    id: 1,
    title: 'Cardiac Monitor Alarm Silence Incident',
    category: 'Patient Safety',
    severity: 'High',
    status: 'In Review',
    date: '2026-06-20T11:45:00.000Z',
    reporter: 'Nurse Sarah Benson',
    description: 'Cardiac monitor alarm on Bed 4, ICU, was found silenced. Patient experienced a brief tachycardic episode which went unnoticed for 3 minutes before manual nurse observation. Patient is currently stable.',
    actionsTaken: 'Monitor alarms un-silenced, verified, and alarm setting permissions locked. Incident logged for Clinical Audit review.',
    resolution: ''
  },
  {
    id: 2,
    title: 'Pediatric Medication Ward Delivery Delay',
    category: 'Medication',
    severity: 'Medium',
    status: 'Resolved',
    date: '2026-06-21T15:20:00.000Z',
    reporter: 'Dr. Amara Nwosu',
    description: 'Delivery of IV antibiotics to Pediatric Ward B was delayed by 4.5 hours due to a pharmacy dispatch transmission error in the legacy portal.',
    actionsTaken: 'Direct phone confirmation initiated for all pediatric stat orders. Legacy queue rebooted.',
    resolution: 'Technical issue logged. Temporary guidelines implemented requiring verbal confirmation of critical prescriptions.'
  },
  {
    id: 3,
    title: 'ICU Ventilator Backup Battery Failure',
    category: 'Facility/Equipment',
    severity: 'Critical',
    status: 'Reported',
    date: '2026-06-23T18:10:00.000Z',
    reporter: 'Dr. Kunle Cole',
    description: 'During a brief 2-minute power generator switchover, the backup battery of Ventilator V-09 in ICU failed to engage. Ventilator powered down. Staff immediately applied manual ventilation. Patient stable.',
    actionsTaken: 'Ventilator V-09 removed from clinical service immediately and sent to BioMed engineering. Backup unit deployed.',
    resolution: ''
  }
];

const INITIAL_RISKS = [
  {
    id: 1,
    title: 'ICU Critical Nursing Staff Shortage',
    category: 'Staffing',
    likelihood: 4,
    impact: 5,
    level: 'Critical', // Calculated: Likelihood * Impact >= 15 is Critical, 8-12 High, 4-6 Medium, <4 Low
    status: 'Identified',
    date: '2026-06-15',
    reporter: 'Nurse Sarah Benson',
    description: 'Increased turnover and burnout among ICU nurses is leaving several shifts below the required 1:1 nurse-to-patient ICU ratio.',
    mitigation: 'Implement temporary shift premiums, hire registry nurses, and review shift limits.'
  },
  {
    id: 2,
    title: 'Legacy Pharmacy Order Portal Downtime',
    category: 'Information Security',
    likelihood: 3,
    impact: 4,
    level: 'High',
    status: 'Identified',
    date: '2026-06-18',
    reporter: 'Admin Chief Victor',
    description: 'The legacy pharmacy order system operates on outdated local hardware experiencing intermittent crashes during peak hours.',
    mitigation: 'Accelerate the migration plan to the new cloud-based electronic health record (EHR) prescription system by Q3.'
  },
  {
    id: 3,
    title: 'Ventilator Preventive Maintenance Backlog',
    category: 'Facility/Equipment',
    likelihood: 2,
    impact: 5,
    level: 'High',
    status: 'Mitigated',
    date: '2026-06-22',
    reporter: 'Dr. Kunle Cole',
    description: 'Routine 6-month calibration and battery replacement checks for 4 backup ICU ventilators are overdue by 3 weeks due to technician scheduling backlogs.',
    mitigation: 'BioMed engineering technician scheduled for complete equipment checks on June 28, 2026.'
  }
];

// Helper to initialize database if empty
const initDB = () => {
  if (!localStorage.getItem('isalu_initialized')) {
    localStorage.setItem('isalu_users', JSON.stringify(INITIAL_USERS));
    localStorage.setItem('isalu_meetings', JSON.stringify(INITIAL_MEETINGS));
    localStorage.setItem('isalu_incidents', JSON.stringify(INITIAL_INCIDENTS));
    localStorage.setItem('isalu_risks', JSON.stringify(INITIAL_RISKS));
    localStorage.setItem('isalu_initialized', 'true');
  }
};

initDB();

const getFromStorage = (key) => JSON.parse(localStorage.getItem(key));
const setToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const dbService = {
  // --- USERS ---
  getUsers: () => getFromStorage('isalu_users'),
  
  // --- MEETINGS ---
  getMeetings: () => {
    return getFromStorage('isalu_meetings');
  },
  
  getMeetingById: (id) => {
    const meetings = getFromStorage('isalu_meetings');
    return meetings.find(m => m.id === Number(id));
  },
  
  createMeeting: (meetingData) => {
    const meetings = getFromStorage('isalu_meetings');
    const newMeeting = {
      ...meetingData,
      id: meetings.length > 0 ? Math.max(...meetings.map(m => m.id)) + 1 : 1,
      status: meetingData.status || 'Scheduled',
      attendees: meetingData.attendees || [],
      agenda: meetingData.agenda || [],
      minutes: meetingData.minutes || '',
      actionItems: meetingData.actionItems || [],
      linkedIncidents: meetingData.linkedIncidents || [],
      linkedRisks: meetingData.linkedRisks || []
    };
    meetings.push(newMeeting);
    setToStorage('isalu_meetings', meetings);
    return newMeeting;
  },
  
  updateMeeting: (id, meetingData) => {
    const meetings = getFromStorage('isalu_meetings');
    const index = meetings.findIndex(m => m.id === Number(id));
    if (index === -1) throw new Error('Meeting not found');
    
    meetings[index] = { ...meetings[index], ...meetingData };
    setToStorage('isalu_meetings', meetings);
    return meetings[index];
  },
  
  deleteMeeting: (id) => {
    let meetings = getFromStorage('isalu_meetings');
    meetings = meetings.filter(m => m.id !== Number(id));
    setToStorage('isalu_meetings', meetings);
    return true;
  },

  // --- INCIDENTS ---
  getIncidents: () => getFromStorage('isalu_incidents'),
  
  getIncidentById: (id) => {
    const incidents = getFromStorage('isalu_incidents');
    return incidents.find(i => i.id === Number(id));
  },
  
  createIncident: (incidentData) => {
    const incidents = getFromStorage('isalu_incidents');
    const newIncident = {
      ...incidentData,
      id: incidents.length > 0 ? Math.max(...incidents.map(i => i.id)) + 1 : 1,
      status: 'Reported',
      date: new Date().toISOString()
    };
    incidents.push(newIncident);
    setToStorage('isalu_incidents', incidents);
    return newIncident;
  },
  
  updateIncident: (id, incidentData) => {
    const incidents = getFromStorage('isalu_incidents');
    const index = incidents.findIndex(i => i.id === Number(id));
    if (index === -1) throw new Error('Incident not found');
    
    incidents[index] = { ...incidents[index], ...incidentData };
    setToStorage('isalu_incidents', incidents);
    return incidents[index];
  },

  // --- RISKS ---
  getRisks: () => getFromStorage('isalu_risks'),
  
  getRiskById: (id) => {
    const risks = getFromStorage('isalu_risks');
    return risks.find(r => r.id === Number(id));
  },
  
  createRisk: (riskData) => {
    const risks = getFromStorage('isalu_risks');
    const score = Number(riskData.likelihood) * Number(riskData.impact);
    let level = 'Low';
    if (score >= 15) level = 'Critical';
    else if (score >= 8) level = 'High';
    else if (score >= 4) level = 'Medium';

    const newRisk = {
      ...riskData,
      id: risks.length > 0 ? Math.max(...risks.map(r => r.id)) + 1 : 1,
      level,
      status: 'Identified',
      date: new Date().toISOString().split('T')[0]
    };
    risks.push(newRisk);
    setToStorage('isalu_risks', risks);
    return newRisk;
  },
  
  updateRisk: (id, riskData) => {
    const risks = getFromStorage('isalu_risks');
    const index = risks.findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error('Risk not found');
    
    const likelihood = riskData.likelihood !== undefined ? Number(riskData.likelihood) : risks[index].likelihood;
    const impact = riskData.impact !== undefined ? Number(riskData.impact) : risks[index].impact;
    const score = likelihood * impact;
    let level = 'Low';
    if (score >= 15) level = 'Critical';
    else if (score >= 8) level = 'High';
    else if (score >= 4) level = 'Medium';

    risks[index] = { ...risks[index], ...riskData, level };
    setToStorage('isalu_risks', risks);
    return risks[index];
  }
};
