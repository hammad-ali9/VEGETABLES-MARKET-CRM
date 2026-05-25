/* Mock data for Mandi-CRM prototype */
window.MOCK = (() => {
  const suppliers = [
    { id: 'S001', name: 'Haji Saleem', city: 'Quetta', phone: '0301-2345678', balance: -125000, advance: 50000 },
    { id: 'S002', name: 'Muhammad Aslam', city: 'Pishin', phone: '0322-1234567', balance: -287500, advance: 0 },
    { id: 'S003', name: 'Wali Khan', city: 'Mastung', phone: '0345-9876543', balance: -45000, advance: 25000 },
    { id: 'S004', name: 'Ghulam Rasool', city: 'Kalat', phone: '0301-1112233', balance: 0, advance: 100000 },
    { id: 'S005', name: 'Sher Ali', city: 'Khuzdar', phone: '0312-4445566', balance: -198750, advance: 0 },
    { id: 'S006', name: 'Karim Bakhsh', city: 'Sibi', phone: '0333-7778899', balance: -67200, advance: 15000 },
  ];
  const customers = [
    { id: 'C001', name: 'Ahmed Khan', city: 'Karachi', phone: '0321-5556677', balance: 245800 },
    { id: 'C002', name: 'Bashir Sabzi', city: 'Lahore', phone: '0301-8889900', balance: 156000 },
    { id: 'C003', name: 'Zubair Traders', city: 'Faisalabad', phone: '0345-1112233', balance: 78900 },
    { id: 'C004', name: 'Iqbal & Sons', city: 'Karachi', phone: '0322-4445566', balance: 312500 },
    { id: 'C005', name: 'Naseer Shah', city: 'Multan', phone: '0312-9990011', balance: 0 },
    { id: 'C006', name: 'Rahim Brothers', city: 'Hyderabad', phone: '0333-3334455', balance: 198450 },
  ];
  const entries = [
    { id: 'TRK-1042', date: '2026-04-26', vehicle: 'LES-1842', supplier: 'Haji Saleem', city: 'Quetta', crates: 320, gross: 768000, laga: 3200, labour: 3200, fare: 28000, customers: 4, status: 'cleared' },
    { id: 'TRK-1041', date: '2026-04-25', vehicle: 'QTA-2934', supplier: 'Muhammad Aslam', city: 'Pishin', crates: 410, gross: 942500, laga: 4100, labour: 4100, fare: 32000, customers: 6, status: 'partial' },
    { id: 'TRK-1040', date: '2026-04-25', vehicle: 'KHI-7782', supplier: 'Wali Khan', city: 'Mastung', crates: 280, gross: 672000, laga: 2800, labour: 2800, fare: 24000, customers: 3, status: 'pending' },
    { id: 'TRK-1039', date: '2026-04-24', vehicle: 'LES-1842', supplier: 'Sher Ali', city: 'Khuzdar', crates: 350, gross: 805000, laga: 3500, labour: 3500, fare: 30000, customers: 5, status: 'cleared' },
    { id: 'TRK-1038', date: '2026-04-24', vehicle: 'BLN-4421', supplier: 'Ghulam Rasool', city: 'Kalat', crates: 290, gross: 696000, laga: 2900, labour: 2900, fare: 26000, customers: 4, status: 'cleared' },
    { id: 'TRK-1037', date: '2026-04-23', vehicle: 'QTA-2934', supplier: 'Karim Bakhsh', city: 'Sibi', crates: 220, gross: 528000, laga: 2200, labour: 2200, fare: 19000, customers: 3, status: 'partial' },
    { id: 'TRK-1036', date: '2026-04-23', vehicle: 'LES-9920', supplier: 'Haji Saleem', city: 'Quetta', crates: 380, gross: 912000, laga: 3800, labour: 3800, fare: 33000, customers: 5, status: 'cleared' },
    { id: 'TRK-1035', date: '2026-04-22', vehicle: 'KHI-7782', supplier: 'Muhammad Aslam', city: 'Pishin', crates: 300, gross: 720000, laga: 3000, labour: 3000, fare: 25000, customers: 4, status: 'pending' },
  ];
  const advances = [
    { id: 'AD-201', supplier: 'Haji Saleem', given: 50000, used: 25000, remaining: 25000, date: '2026-04-15', notes: 'Crop advance, 3 trucks' },
    { id: 'AD-202', supplier: 'Wali Khan', given: 25000, used: 0, remaining: 25000, date: '2026-04-22', notes: 'Bardana advance' },
    { id: 'AD-203', supplier: 'Ghulam Rasool', given: 100000, used: 65000, remaining: 35000, date: '2026-04-10', notes: 'Bulk pre-pay' },
    { id: 'AD-204', supplier: 'Karim Bakhsh', given: 15000, used: 15000, remaining: 0, date: '2026-04-18', notes: 'Cleared this week' },
  ];
  const expenses = {
    labour: [
      { id: 'L1', name: 'Shafique', role: 'Loader', amount: 28000, date: '2026-04-26', period: 'monthly' },
      { id: 'L2', name: 'Ramzan', role: 'Helper', amount: 22000, date: '2026-04-26', period: 'monthly' },
      { id: 'L3', name: 'Yousuf', role: 'Sorter', amount: 25000, date: '2026-04-26', period: 'monthly' },
      { id: 'L4', name: 'Ghani', role: 'Loader', amount: 28000, date: '2026-04-26', period: 'monthly' },
    ],
    utility: [
      { id: 'U1', name: 'K-Electric', amount: 18420, date: '2026-04-12', period: 'monthly' },
      { id: 'U2', name: 'SSGC Gas', amount: 6100, date: '2026-04-08', period: 'monthly' },
      { id: 'U3', name: 'KWSB Water', amount: 2400, date: '2026-04-10', period: 'monthly' },
    ],
    food: [
      { id: 'F1', name: 'Daily lunch — staff', amount: 12000, date: '2026-04-26', period: 'monthly' },
      { id: 'F2', name: 'Tea & snacks', amount: 4800, date: '2026-04-26', period: 'monthly' },
    ],
    rent: [{ id: 'R1', name: 'Mandi shop rent', amount: 75000, date: '2026-04-01', period: 'monthly' }],
    parking: [{ id: 'P1', name: 'Mandi parking fees', amount: 8400, date: '2026-04-26', period: 'monthly' }],
    salary: [
      { id: 'SAL1', name: 'Khalid (Manager)', amount: 65000, date: '2026-04-26', period: 'monthly' },
      { id: 'SAL2', name: 'Faisal (Accountant)', amount: 45000, date: '2026-04-26', period: 'monthly' },
    ],
    other: [
      { id: 'O1', name: 'Charity / Khairat', amount: 15000, date: '2026-04-15', period: 'monthly' },
      { id: 'O2', name: 'Shop maintenance', amount: 8200, date: '2026-04-19', period: 'monthly' },
    ],
  };
  const messages = [
    { id: 'M1', name: 'Daily Rate Update', sent: 1240, delivered: 1198, read: 942, replied: 84, ratio: 7.8 },
    { id: 'M2', name: 'Eid Greetings 2026', sent: 856, delivered: 834, read: 712, replied: 56, ratio: 6.7 },
    { id: 'M3', name: 'New Stock Alert', sent: 412, delivered: 401, read: 298, replied: 32, ratio: 8.0 },
  ];
  const users = [
    { id: 'U1', name: 'Khalid Abbasi', role: 'Admin', email: 'khalid@yourmandi.pk', last: '2 min ago', status: 'active' },
    { id: 'U2', name: 'Faisal Ahmed', role: 'Accountant', email: 'faisal@yourmandi.pk', last: '14 min ago', status: 'active' },
    { id: 'U3', name: 'Imran Khan', role: 'Salesman', email: 'imran@yourmandi.pk', last: 'Yesterday', status: 'active' },
  ];
  return { suppliers, customers, entries, advances, expenses, messages, users };
})();
