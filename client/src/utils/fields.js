const yn = ['no', 'yes'];
export const GROUPS = [
  { title: 'Vitals', fields: [
    { k: 'age', l: 'Age', u: 'years', req: true, min: 1, max: 100 },
    { k: 'bp', l: 'Blood pressure', u: 'mm Hg (diastolic)', req: true, min: 40, max: 200 },
  ]},
  { title: 'Blood tests', fields: [
    { k: 'sc', l: 'Serum creatinine', u: 'mg/dL', req: true, min: 0.1, max: 25, step: 0.1 },
    { k: 'hemo', l: 'Hemoglobin', u: 'g/dL', req: true, min: 3, max: 20, step: 0.1 },
    { k: 'bgr', l: 'Blood glucose (random)', u: 'mg/dL', min: 40, max: 600 },
    { k: 'bu', l: 'Blood urea', u: 'mg/dL', min: 1, max: 400 },
    { k: 'sod', l: 'Sodium', u: 'mEq/L', min: 90, max: 180 },
    { k: 'pot', l: 'Potassium', u: 'mEq/L', min: 1.5, max: 10, step: 0.1 },
    { k: 'pcv', l: 'Packed cell volume', u: '%', min: 5, max: 60 },
    { k: 'wc', l: 'WBC count', u: 'cells/cumm', min: 1000, max: 30000 },
    { k: 'rc', l: 'RBC count', u: 'millions/cmm', min: 1, max: 9, step: 0.1 },
  ]},
  { title: 'Urine tests', fields: [
    { k: 'sg', l: 'Specific gravity', type: 'select', options: ['1.005', '1.010', '1.015', '1.020', '1.025'] },
    { k: 'al', l: 'Albumin (0-5)', type: 'select', options: ['0', '1', '2', '3', '4', '5'] },
    { k: 'su', l: 'Sugar (0-5)', type: 'select', options: ['0', '1', '2', '3', '4', '5'] },
    { k: 'rbc', l: 'Red blood cells', type: 'select', options: ['normal', 'abnormal'] },
    { k: 'pc', l: 'Pus cells', type: 'select', options: ['normal', 'abnormal'] },
    { k: 'pcc', l: 'Pus cell clumps', type: 'select', options: ['notpresent', 'present'] },
    { k: 'ba', l: 'Bacteria', type: 'select', options: ['notpresent', 'present'] },
  ]},
  { title: 'History & symptoms', fields: [
    { k: 'htn', l: 'Hypertension', type: 'select', options: yn },
    { k: 'dm', l: 'Diabetes mellitus', type: 'select', options: yn },
    { k: 'cad', l: 'Coronary artery disease', type: 'select', options: yn },
    { k: 'appet', l: 'Appetite', type: 'select', options: ['good', 'poor'] },
    { k: 'pe', l: 'Pedal edema', type: 'select', options: yn },
    { k: 'ane', l: 'Anemia', type: 'select', options: yn },
  ]},
];

export const SAMPLE_HIGH = { age: 62, bp: 90, sc: 4.2, hemo: 9.5, bgr: 180, bu: 80, sod: 134, pot: 5.2, pcv: 29, wc: 9800, rc: 3.4,
  sg: '1.010', al: '3', su: '1', rbc: 'abnormal', pc: 'abnormal', pcc: 'present', ba: 'notpresent',
  htn: 'yes', dm: 'yes', cad: 'no', appet: 'poor', pe: 'yes', ane: 'yes' };
export const SAMPLE_LOW = { age: 35, bp: 70, sc: 0.9, hemo: 15, bgr: 100, bu: 28, sod: 141, pot: 4.3, pcv: 46, wc: 7500, rc: 5.2,
  sg: '1.020', al: '0', su: '0', rbc: 'normal', pc: 'normal', pcc: 'notpresent', ba: 'notpresent',
  htn: 'no', dm: 'no', cad: 'no', appet: 'good', pe: 'no', ane: 'no' };

export const RISK_COLOR = { LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#ef4444' };
