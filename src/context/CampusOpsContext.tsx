import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Language,
  GatePass,
  Complaint,
  DeduplicatedTicket,
  DailyMessMenu,
  CafeteriaOrder,
  HostelRoom,
  RollCallRecord,
  BroadcastNotification,
  EmergencyAlert,
  ComplaintCategory,
} from '../types';
import {
  initialGatePasses,
  initialComplaints,
  initialDeduplicatedTickets,
  dailyMessMenu as initialMessMenu,
  initialOrders,
  hostelRooms as initialRooms,
  rollCallRoster as initialRoster,
  initialBroadcasts,
} from '../data/mockData';
import { emergencySound } from '../utils/audioAlert';

interface CampusOpsContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  lowDataMode: boolean;
  setLowDataMode: (enabled: boolean | ((prev: boolean) => boolean)) => void;

  // Gate Passes
  gatePasses: GatePass[];
  requestGatePass: (pass: Omit<GatePass, 'id' | 'passCode' | 'status'>) => GatePass;
  approveGatePass: (id: string, approverName?: string) => void;
  rejectGatePass: (id: string, reason: string) => void;
  logGateExit: (passCode: string) => { success: boolean; message: string; pass?: GatePass };
  logGateEntry: (passCode: string) => { success: boolean; message: string; pass?: GatePass };

  // Complaints & Deduplication
  complaints: Complaint[];
  deduplicatedTickets: DeduplicatedTicket[];
  createComplaint: (complaint: Omit<Complaint, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'upvotes'>) => Complaint;
  resolveComplaint: (id: string, notes: string) => void;
  resolveDeduplicatedTicket: (masterId: string, notes: string) => void;
  upvoteComplaint: (id: string) => void;
  simulateOutageSurge: () => void;

  // Mess & Cafeteria
  messMenu: DailyMessMenu;
  mealRatings: Record<string, { rating: number; count: number }>;
  rateMealItem: (mealId: string, rating: number) => void;
  cafeteriaOrders: CafeteriaOrder[];
  placeCafeteriaOrder: (items: CafeteriaOrder['items'], total: number) => CafeteriaOrder;
  updateOrderStatus: (orderId: string, status: CafeteriaOrder['status']) => void;
  messCheckIn: (rollNumber: string) => { success: boolean; studentName?: string };

  // Hostel Rooms
  rooms: HostelRoom[];
  bookBed: (roomId: string, bedLabel: 'A' | 'B', studentName: string, rollNumber: string, habits: string[]) => boolean;

  // Roll call
  rollCallRecords: RollCallRecord[];
  nightCurfewReportTime: string | null;
  triggerNightCurfewReport: () => void;

  // Broadcast & Emergency
  broadcasts: BroadcastNotification[];
  sendBroadcast: (broadcast: Omit<BroadcastNotification, 'id' | 'sentAt' | 'readCount'>) => void;
  activeEmergency: EmergencyAlert | null;
  triggerEmergencyAlert: (type: EmergencyAlert['type'], title: string, message: string, musterPoint: string) => void;
  dismissEmergencyAlert: () => void;
  checkInMuster: (studentName?: string) => void;

  // Reset to demo initial
  resetDemoData: () => void;
}

const CampusOpsContext = createContext<CampusOpsContextType | undefined>(undefined);

export const CampusOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [language, setLanguage] = useState<Language>('en');
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);

  // Data states with localStorage initialization
  const [gatePasses, setGatePasses] = useState<GatePass[]>(() => {
    const saved = localStorage.getItem('fretops_gatepasses');
    return saved ? JSON.parse(saved) : initialGatePasses;
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('fretops_complaints');
    return saved ? JSON.parse(saved) : initialComplaints;
  });

  const [deduplicatedTickets, setDeduplicatedTickets] = useState<DeduplicatedTicket[]>(() => {
    const saved = localStorage.getItem('fretops_dedup');
    return saved ? JSON.parse(saved) : initialDeduplicatedTickets;
  });

  const [messMenu] = useState<DailyMessMenu>(initialMessMenu);
  const [mealRatings, setMealRatings] = useState<Record<string, { rating: number; count: number }>>({
    'm-6': { rating: 4.6, count: 182 },
    'm-1': { rating: 4.3, count: 95 },
  });

  const [cafeteriaOrders, setCafeteriaOrders] = useState<CafeteriaOrder[]>(() => {
    const saved = localStorage.getItem('fretops_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [rooms, setRooms] = useState<HostelRoom[]>(() => {
    const saved = localStorage.getItem('fretops_rooms');
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [rollCallRecords, setRollCallRecords] = useState<RollCallRecord[]>(() => {
    const saved = localStorage.getItem('fretops_rollcall');
    return saved ? JSON.parse(saved) : initialRoster;
  });

  const [nightCurfewReportTime, setNightCurfewReportTime] = useState<string | null>('22:30');

  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>(() => {
    const saved = localStorage.getItem('fretops_broadcasts');
    return saved ? JSON.parse(saved) : initialBroadcasts;
  });

  const [activeEmergency, setActiveEmergency] = useState<EmergencyAlert | null>(null);

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('fretops_gatepasses', JSON.stringify(gatePasses));
  }, [gatePasses]);

  useEffect(() => {
    localStorage.setItem('fretops_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('fretops_dedup', JSON.stringify(deduplicatedTickets));
  }, [deduplicatedTickets]);

  useEffect(() => {
    localStorage.setItem('fretops_orders', JSON.stringify(cafeteriaOrders));
  }, [cafeteriaOrders]);

  useEffect(() => {
    localStorage.setItem('fretops_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('fretops_rollcall', JSON.stringify(rollCallRecords));
  }, [rollCallRecords]);

  useEffect(() => {
    localStorage.setItem('fretops_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  // Gate Pass Actions
  const requestGatePass = (passData: Omit<GatePass, 'id' | 'passCode' | 'status'>): GatePass => {
    const randomCode = `GP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPass: GatePass = {
      ...passData,
      id: `gp-${Date.now()}`,
      passCode: randomCode,
      status: 'pending',
    };
    setGatePasses((prev) => [newPass, ...prev]);
    return newPass;
  };

  const approveGatePass = (id: string, approverName: string = 'Dr. Sunita Rao (Chief Warden)') => {
    setGatePasses((prev) =>
      prev.map((pass) =>
        pass.id === id
          ? {
              ...pass,
              status: 'approved',
              approvedBy: approverName,
              approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : pass,
      ),
    );
  };

  const rejectGatePass = (id: string, reason: string) => {
    setGatePasses((prev) =>
      prev.map((pass) =>
        pass.id === id
          ? {
              ...pass,
              status: 'rejected',
              rejectionReason: reason,
            }
          : pass,
      ),
    );
  };

  const logGateExit = (passCode: string) => {
    const cleanCode = passCode.trim().toUpperCase();
    const pass = gatePasses.find((p) => p.passCode.toUpperCase() === cleanCode);

    if (!pass) {
      return { success: false, message: `Gate pass code ${passCode} not found in database.` };
    }
    if (pass.status !== 'approved') {
      return { success: false, message: `Pass is currently ${pass.status.toUpperCase()} and cannot be used for exit.` };
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setGatePasses((prev) =>
      prev.map((p) =>
        p.id === pass.id ? { ...p, status: 'checked_out', actualOutTime: timeStr } : p,
      ),
    );

    // Update Roll call roster
    setRollCallRecords((prev) =>
      prev.map((r) =>
        r.rollNumber === pass.rollNumber
          ? { ...r, status: 'on_gate_pass', lastSeenTime: `${timeStr} (Main Gate Exit)` }
          : r,
      ),
    );

    return { success: true, message: `Exit verified for ${pass.studentName} (${pass.rollNumber}). Expected return: ${pass.expectedInTime}`, pass };
  };

  const logGateEntry = (passCode: string) => {
    const cleanCode = passCode.trim().toUpperCase();
    const pass = gatePasses.find((p) => p.passCode.toUpperCase() === cleanCode);

    if (!pass) {
      return { success: false, message: `Pass code ${passCode} not found.` };
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setGatePasses((prev) =>
      prev.map((p) =>
        p.id === pass.id ? { ...p, status: 'completed', actualInTime: timeStr } : p,
      ),
    );

    // Update Roll call
    setRollCallRecords((prev) =>
      prev.map((r) =>
        r.rollNumber === pass.rollNumber
          ? { ...r, status: 'inside', lastSeenTime: `${timeStr} (Returned to Hostel)` }
          : r,
      ),
    );

    return { success: true, message: `Safe return logged for ${pass.studentName}. Pass completed.`, pass };
  };

  // Complaint Creation with Intelligent Deduplication
  const createComplaint = (
    data: Omit<Complaint, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'upvotes'>,
  ): Complaint => {
    const newId = `tc-${Date.now()}`;
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if an existing deduplicated ticket exists for this category & block
    const matchingMaster = deduplicatedTickets.find(
      (dt) => dt.category === data.category && dt.hostelBlock === data.hostelBlock && dt.status !== 'resolved',
    );

    let masterId = matchingMaster ? matchingMaster.id : undefined;

    // If there are already 2 complaints in this block and category without a master ticket, synthesize one
    if (!matchingMaster) {
      const similarOpen = complaints.filter(
        (c) => c.category === data.category && c.hostelBlock === data.hostelBlock && c.status !== 'resolved',
      );
      if (similarOpen.length >= 1) {
        // Auto-group into new master deduplicated ticket!
        const newMasterCode = `DT-${data.category.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
        const newMaster: DeduplicatedTicket = {
          id: `dt-${Date.now()}`,
          masterCode: newMasterCode,
          category: data.category,
          title: `Cluster Outage: ${data.category.toUpperCase()} in ${data.hostelBlock}`,
          hostelBlock: data.hostelBlock,
          affectedCount: similarOpen.length + 1,
          reportedRooms: Array.from(new Set([...similarOpen.map((c) => c.roomNumber), data.roomNumber])),
          complaintIds: [...similarOpen.map((c) => c.id), newId],
          assignedTechnician: getTechnicianForCategory(data.category),
          status: 'in_progress',
          detectedAt: `${timeStr} (Auto-grouped ${similarOpen.length + 1} recurring reports)`,
          rootCauseCandidate: `Repeated failure reported across multiple rooms (${data.roomNumber}, etc.). Common distribution line check recommended.`,
        };
        masterId = newMaster.id;
        setDeduplicatedTickets((prev) => [newMaster, ...prev]);

        // Mark previously open complaints with this master ID
        setComplaints((prev) =>
          prev.map((c) => (similarOpen.some((s) => s.id === c.id) ? { ...c, masterTicketId: newMaster.id } : c)),
        );
      }
    } else {
      // Update existing master ticket count & rooms
      setDeduplicatedTickets((prev) =>
        prev.map((dt) =>
          dt.id === matchingMaster.id
            ? {
                ...dt,
                affectedCount: dt.affectedCount + 1,
                reportedRooms: Array.from(new Set([...dt.reportedRooms, data.roomNumber])),
                complaintIds: [...dt.complaintIds, newId],
              }
            : dt,
        ),
      );
    }

    const newTicket: Complaint = {
      ...data,
      id: newId,
      ticketNumber,
      status: 'assigned',
      createdAt: timeStr,
      upvotes: 1,
      masterTicketId: masterId,
      assignedTrade: getTradeName(data.category),
      assignedTo: getTechnicianForCategory(data.category),
    };

    setComplaints((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const resolveComplaint = (id: string, notes: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'resolved',
              resolvedAt: timeStr,
              resolutionNotes: notes,
            }
          : c,
      ),
    );
  };

  const resolveDeduplicatedTicket = (masterId: string, notes: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = deduplicatedTickets.find((d) => d.id === masterId);
    if (!target) return;

    setDeduplicatedTickets((prev) =>
      prev.map((dt) => (dt.id === masterId ? { ...dt, status: 'resolved' } : dt)),
    );

    // Resolve all grouped child complaints simultaneously!
    setComplaints((prev) =>
      prev.map((c) =>
        c.masterTicketId === masterId || target.complaintIds.includes(c.id)
          ? {
              ...c,
              status: 'resolved',
              resolvedAt: timeStr,
              resolutionNotes: `[Group Resolution ${target.masterCode}] ${notes}`,
            }
          : c,
      ),
    );
  };

  const upvoteComplaint = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c)),
    );
  };

  // Simulate Surge Outage (Demonstration helper for hackathon & client PRD)
  const simulateOutageSurge = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sampleRooms = ['402', '405', '409', '414', '418', '422'];
    const newMasterCode = `DT-WIFI-${Math.floor(100 + Math.random() * 900)}`;

    const newComplaints: Complaint[] = sampleRooms.map((rm, idx) => ({
      id: `tc-surge-${Date.now()}-${idx}`,
      ticketNumber: `TKT-${8200 + idx}`,
      category: 'wifi',
      title: `Wi-Fi Dead Zone in Room ${rm}`,
      description: 'Hostel Wi-Fi signal not radiating. Cannot complete lab assignment.',
      studentName: `Student ${rm}`,
      rollNumber: `2024CS0${800 + idx}`,
      roomNumber: rm,
      hostelBlock: 'Ramanujan Block B',
      priority: 'high',
      status: 'in_progress',
      createdAt: timeStr,
      assignedTrade: 'Network',
      assignedTo: 'Suresh Menon (Network Admin)',
      upvotes: Math.floor(Math.random() * 5) + 1,
    }));

    const newMaster: DeduplicatedTicket = {
      id: `dt-surge-${Date.now()}`,
      masterCode: newMasterCode,
      category: 'wifi',
      title: `Surge Wi-Fi Disruption: Ramanujan Block B Wing 4`,
      hostelBlock: 'Ramanujan Block B',
      affectedCount: sampleRooms.length + 3,
      reportedRooms: ['401', '403', ...sampleRooms],
      complaintIds: newComplaints.map((c) => c.id),
      assignedTechnician: 'Suresh Menon (Network Admin)',
      status: 'in_progress',
      detectedAt: `${timeStr} (Grouped ${sampleRooms.length + 3} reports)`,
      rootCauseCandidate: 'AP Gateway B4-Switch POE Controller Trip - Grouped to prevent warden ticket spam.',
    };

    newComplaints.forEach((c) => (c.masterTicketId = newMaster.id));

    setDeduplicatedTickets((prev) => [newMaster, ...prev]);
    setComplaints((prev) => [...newComplaints, ...prev]);
  };

  // Mess & Cafeteria
  const rateMealItem = (mealId: string, rating: number) => {
    setMealRatings((prev) => {
      const current = prev[mealId] || { rating: 4.0, count: 1 };
      const newCount = current.count + 1;
      const newRating = Number(((current.rating * current.count + rating) / newCount).toFixed(1));
      return { ...prev, [mealId]: { rating: newRating, count: newCount } };
    });
  };

  const placeCafeteriaOrder = (
    items: CafeteriaOrder['items'],
    total: number,
  ): CafeteriaOrder => {
    const orderNumber = `CF-${Math.floor(1000 + Math.random() * 9000)}`;
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: CafeteriaOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      studentName: 'Aarav Sharma',
      roomNumber: '304',
      hostelBlock: 'Ramanujan Block A',
      items,
      totalAmount: total,
      status: 'received',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deliveryOtp: otp,
    };
    setCafeteriaOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: CafeteriaOrder['status']) => {
    setCafeteriaOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
  };

  const messCheckIn = (rollNumber: string) => {
    const student = rollCallRecords.find((r) => r.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase());
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (student) {
      setRollCallRecords((prev) =>
        prev.map((r) =>
          r.rollNumber === student.rollNumber
            ? { ...r, status: 'mess_checked_in', lastSeenTime: `${timeStr} (Dining Hall Token Validated)` }
            : r,
        ),
      );
      return { success: true, studentName: student.name };
    }
    return { success: false };
  };

  // Hostel Rooms
  const bookBed = (
    roomId: string,
    bedLabel: 'A' | 'B',
    studentName: string,
    rollNumber: string,
    habits: string[],
  ): boolean => {
    let success = false;
    setRooms((prev) =>
      prev.map((rm) => {
        if (rm.id !== roomId) return rm;
        const updatedBeds = rm.beds.map((b) => {
          if (b.bedLabel === bedLabel && !b.isOccupied) {
            success = true;
            return {
              ...b,
              isOccupied: true,
              occupant: {
                name: studentName,
                rollNumber,
                branch: 'Computer Science',
                year: '1st Year',
                habits,
              },
            };
          }
          return b;
        });
        return { ...rm, beds: updatedBeds };
      }),
    );
    return success;
  };

  // Roll Call & Curfew
  const triggerNightCurfewReport = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNightCurfewReportTime(timeStr);

    // Post broadcast notice to Wardens
    const insideCount = rollCallRecords.filter((r) => r.status === 'inside' || r.status === 'mess_checked_in').length;
    const gatePassCount = rollCallRecords.filter((r) => r.status === 'on_gate_pass').length;
    const overdueCount = rollCallRecords.filter((r) => r.status === 'overdue').length;

    const newBroadcast: BroadcastNotification = {
      id: `bc-curfew-${Date.now()}`,
      title: `10:30 PM Night Roll Call Automated Report (${timeStr})`,
      content: `Hostel safety audit complete: ${insideCount} students verified inside/mess, ${gatePassCount} students checked out on approved gate passes, ${overdueCount} students overdue past curfew. Wardens can rest assured.`,
      target: 'all',
      targetValue: 'All Wardens & Supervisors',
      sender: 'Automated Curfew Engine',
      sentAt: timeStr,
      priority: overdueCount > 0 ? 'urgent' : 'normal',
      readCount: 1,
      totalRecipients: 8,
    };
    setBroadcasts((prev) => [newBroadcast, ...prev]);
  };

  // Broadcast
  const sendBroadcast = (data: Omit<BroadcastNotification, 'id' | 'sentAt' | 'readCount'>) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newBc: BroadcastNotification = {
      ...data,
      id: `bc-${Date.now()}`,
      sentAt: timeStr,
      readCount: 0,
    };
    setBroadcasts((prev) => [newBc, ...prev]);
  };

  // Emergency Alert Override with Web Audio API Ambulance Siren!
  const triggerEmergencyAlert = (
    type: EmergencyAlert['type'],
    title: string,
    message: string,
    musterPoint: string,
  ) => {
    const alert: EmergencyAlert = {
      id: `em-${Date.now()}`,
      type,
      title,
      message,
      musterPoint,
      triggeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triggeredBy: 'Dr. Sunita Rao (Chief Proctor & Emergency Coordinator)',
      active: true,
      checkedInStudentsCount: 42,
    };
    setActiveEmergency(alert);

    // Play loud 3-second ambulance siren even if muted!
    emergencySound.playAmbulanceSiren(3);
  };

  const dismissEmergencyAlert = () => {
    emergencySound.stop();
    setActiveEmergency(null);
  };

  const checkInMuster = (studentName: string = 'Aarav Sharma') => {
    if (!activeEmergency) return;
    setActiveEmergency((prev) =>
      prev ? { ...prev, checkedInStudentsCount: prev.checkedInStudentsCount + 1 } : null,
    );
  };

  const resetDemoData = () => {
    localStorage.clear();
    setGatePasses(initialGatePasses);
    setComplaints(initialComplaints);
    setDeduplicatedTickets(initialDeduplicatedTickets);
    setCafeteriaOrders(initialOrders);
    setRooms(initialRooms);
    setRollCallRecords(initialRoster);
    setBroadcasts(initialBroadcasts);
    setActiveEmergency(null);
  };

  return (
    <CampusOpsContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        lowDataMode,
        setLowDataMode,
        gatePasses,
        requestGatePass,
        approveGatePass,
        rejectGatePass,
        logGateExit,
        logGateEntry,
        complaints,
        deduplicatedTickets,
        createComplaint,
        resolveComplaint,
        resolveDeduplicatedTicket,
        upvoteComplaint,
        simulateOutageSurge,
        messMenu,
        mealRatings,
        rateMealItem,
        cafeteriaOrders,
        placeCafeteriaOrder,
        updateOrderStatus,
        messCheckIn,
        rooms,
        bookBed,
        rollCallRecords,
        nightCurfewReportTime,
        triggerNightCurfewReport,
        broadcasts,
        sendBroadcast,
        activeEmergency,
        triggerEmergencyAlert,
        dismissEmergencyAlert,
        checkInMuster,
        resetDemoData,
      }}
    >
      {children}
    </CampusOpsContext.Provider>
  );
};

export const useCampusOps = () => {
  const context = useContext(CampusOpsContext);
  if (!context) {
    throw new Error('useCampusOps must be used within a CampusOpsProvider');
  }
  return context;
};

// Trade helpers
function getTradeName(cat: ComplaintCategory): string {
  switch (cat) {
    case 'electrical':
      return 'Electrical';
    case 'plumbing':
      return 'Plumbing';
    case 'wifi':
      return 'Network & IT';
    case 'carpentry':
      return 'Carpentry';
    case 'cleaning':
      return 'Housekeeping';
    case 'ac':
      return 'HVAC / Cooling';
  }
}

function getTechnicianForCategory(cat: ComplaintCategory): string {
  switch (cat) {
    case 'electrical':
      return 'Rajesh Kumar (Senior Electrician)';
    case 'plumbing':
      return 'Mohammed Arif (Plumber)';
    case 'wifi':
      return 'Suresh Menon (Network Admin)';
    case 'carpentry':
      return 'Hari Om (Carpenter)';
    case 'cleaning':
      return 'Radha Bai (Sanitation Supervisor)';
    case 'ac':
      return 'Manoj Verma (HVAC Tech)';
  }
}
