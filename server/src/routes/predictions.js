import { Router } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Prediction from '../models/Prediction.js';
import { protect } from '../middleware/auth.js';
import { runPython } from '../services/ml.js';
import { summarize } from '../services/gemini.js';

const router = Router();
router.use(protect);
const REQUIRED = ['age', 'bp', 'sc', 'hemo'];

router.post('/', async (req, res) => {
  const { patientName, record } = req.body;
  if (!patientName?.trim() || !record) return res.status(400).json({ message: 'Patient name and clinical values are required' });
  const missing = REQUIRED.filter((k) => record[k] === undefined || record[k] === '' || isNaN(Number(record[k])));
  if (missing.length) return res.status(400).json({ message: `Required values missing: ${missing.join(', ')}` });

  const ml = await runPython([], record);
  const summary = await summarize({ patientName, probability: ml.probability, risk: ml.risk, explanation: ml.explanation, record });
  const doc = await Prediction.create({
    user: req.user.id, patientName: patientName.trim(), record, probability: ml.probability, risk: ml.risk, flagged: ml.flagged,
    threshold: ml.threshold, modelName: ml.model, dataSource: ml.source, explanation: ml.explanation, summary,
  });
  res.status(201).json(doc);
});

router.get('/', async (req, res) => {
  const { q = '', risk = '', page = 1, limit = 10 } = req.query;
  const filter = { user: req.user.id };
  if (q) filter.patientName = { $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (['LOW', 'MODERATE', 'HIGH'].includes(risk)) filter.risk = risk;
  const lim = Math.min(Number(limit) || 10, 50), skip = (Math.max(Number(page), 1) - 1) * lim;
  const [items, total] = await Promise.all([
    Prediction.find(filter).select('-record -explanation').sort({ createdAt: -1 }).skip(skip).limit(lim),
    Prediction.countDocuments(filter),
  ]);
  res.json({ items, total, pages: Math.ceil(total / lim) || 1 });
});

router.get('/stats', async (req, res) => {
  const user = new mongoose.Types.ObjectId(req.user.id);
  const since = new Date(Date.now() - 14 * 864e5);
  const [byRisk, daily, totals, recent] = await Promise.all([
    Prediction.aggregate([{ $match: { user } }, { $group: { _id: '$risk', count: { $sum: 1 } } }]),
    Prediction.aggregate([{ $match: { user, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Prediction.aggregate([{ $match: { user } }, { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$probability' }, flagged: { $sum: { $cond: ['$flagged', 1, 0] } } } }]),
    Prediction.find({ user }).select('patientName probability risk createdAt').sort({ createdAt: -1 }).limit(5),
  ]);
  const t = totals[0] || { total: 0, avg: 0, flagged: 0 };
  res.json({ total: t.total, flagged: t.flagged, avgProbability: t.avg, byRisk, daily, recent });
});

const find = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Prediction.findOne({ _id: req.params.id, user: req.user.id });
};

router.get('/:id', async (req, res) => {
  const doc = await find(req);
  doc ? res.json(doc) : res.status(404).json({ message: 'Not found' });
});

router.delete('/:id', async (req, res) => {
  const doc = await find(req);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await doc.deleteOne();
  res.json({ ok: true });
});

router.get('/:id/report', async (req, res) => {
  const d = await find(req);
  if (!d) return res.status(404).json({ message: 'Not found' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="CKD-report-${d.patientName.replace(/\W+/g, '_')}.pdf"`);


  const pdf = new PDFDocument({
  size: 'A4',
  margin: 42,
  bufferPages: true
});
  pdf.pipe(res);
  pdf.on('error', (err) => {
  console.error('PDF generation error:', err);

  if (!res.headersSent) {
    res.status(500).json({ message: 'Failed to generate PDF report' });
  } else {
    res.destroy(err);
  }
});



 const PAGE_WIDTH = 595;
const LEFT = 42;
const RIGHT = 553;
const WIDTH = RIGHT - LEFT;

const color = {
  LOW: '#16a34a',
  MODERATE: '#d97706',
  HIGH: '#dc2626'
}[d.risk] || '#64748b';

// Reusable section heading
function sectionTitle(title, y = pdf.y) {
  pdf.fillColor('#0f766e')
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(title, LEFT, y);

  pdf.moveTo(LEFT, pdf.y + 5)
    .lineTo(RIGHT, pdf.y + 5)
    .strokeColor('#dbe5e7')
    .stroke();

  pdf.moveDown(0.8);
}

// Reusable page header
function pageHeader(subtitle) {
  pdf.rect(0, 0, PAGE_WIDTH, 95).fill('#0f766e');

  pdf.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(23)
    .text('NephroAI', LEFT, 25);

  pdf.font('Helvetica')
    .fontSize(11)
    .text(subtitle, LEFT, 58);

  pdf.fontSize(8)
    .text(`Generated: ${new Date().toLocaleString()}`, LEFT, 76);

  pdf.y = 115;
}

// Footer
function pageFooter(page) {
  pdf.save();

  pdf.moveTo(LEFT, 770)
    .lineTo(RIGHT, 770)
    .strokeColor('#cbd5e1')
    .stroke();

  pdf.fillColor('#64748b')
    .font('Helvetica')
    .fontSize(8)
    .text(
      'NephroAI | Research Prototype',
      LEFT,
      780,
      { lineBreak: false }
    );

  pdf.text(
    `Page ${page} of 2`,
    RIGHT - 65,
    780,
    { lineBreak: false }
  );

  pdf.restore();
}
// =====================================
// PAGE 1: SCREENING ASSESSMENT
// =====================================

pageHeader('SCREENING ASSESSMENT REPORT');

sectionTitle('PATIENT INFORMATION');

pdf.fillColor('#334155')
  .font('Helvetica')
  .fontSize(12)
  .text(`Patient Name: ${d.patientName}`);

pdf.text(`Model: ${d.modelName}`);
pdf.text(`Dataset: ${d.dataSource}`);

pdf.moveDown(1);

// Risk card
const cardY = pdf.y;

pdf.roundedRect(LEFT, cardY, WIDTH, 105, 10)
  .fill('#f1f5f9');

pdf.fillColor(color)
  .font('Helvetica-Bold')
  .fontSize(29)
  .text(`${(d.probability * 100).toFixed(1)}%`, LEFT + 18, cardY + 16);

pdf.fontSize(16)
  .text(`${d.risk} RISK`, LEFT + 145, cardY + 25);

pdf.fillColor('#475569')
  .font('Helvetica')
  .fontSize(10)
  .text(
    d.flagged
      ? 'Screening flag: Referral threshold reached'
      : 'Screening flag: Below referral threshold',
    LEFT + 18,
    cardY + 68
  );

pdf.y = cardY + 125;

// Contributing factors
sectionTitle('TOP CONTRIBUTING FACTORS');

(d.explanation || []).slice(0, 8).forEach((e, index) => {
  const direction = e.impact > 0 ? 'Raises' : 'Lowers';

  pdf.fillColor('#334155')
    .font('Helvetica')
    .fontSize(12)
    .text(
      `${index + 1}. ${e.label}: ${direction} model output (${Math.abs(e.impact * 100).toFixed(1)} points)`,
      { width: WIDTH, lineGap: 2 }
    );

  pdf.moveDown(0.65);
});

pageFooter(1);

// =====================================
// PAGE 2: CLINICAL DETAILS
// =====================================

pdf.addPage();

pageHeader('CLINICAL DETAILS AND OBSERVATIONS');

sectionTitle('ENTERED CLINICAL VALUES');

const entries = Object.entries(d.record || {})
  .filter(([, value]) =>
    value !== '' && value !== null && value !== undefined
  );

const columnGap = 25;
const columnWidth = (WIDTH - columnGap) / 2;
const startY = pdf.y;

entries.forEach(([key, value], index) => {
  const column = index % 2;
  const row = Math.floor(index / 2);

  const x = LEFT + column * (columnWidth + columnGap);
  const y = startY + row * 27;

  pdf.roundedRect(x, y, columnWidth, 22, 4)
    .fill('#f1f5f9');

  pdf.fillColor('#64748b')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(key.toUpperCase(), x + 8, y + 4, {
      width: columnWidth - 16,
      lineBreak: false
    });

  pdf.fillColor('#0f172a')
    .font('Helvetica')
    .fontSize(9)
    .text(String(value), x + 8, y + 13, {
      width: columnWidth - 16,
      lineBreak: false
    });
});

const rows = Math.ceil(entries.length / 2);

pdf.y = startY + rows * 27 + 20;

// AI summary
if (d.summary) {
  sectionTitle('AI-GENERATED SUMMARY');

  pdf.fillColor('#334155')
    .font('Helvetica')
    .fontSize(10)
    .text(d.summary, LEFT, pdf.y, {
      width: WIDTH,
      lineGap: 4
    });

  pdf.moveDown(1);
}

// Disclaimer
sectionTitle('IMPORTANT INFORMATION');

pdf.fillColor('#64748b')
  .font('Helvetica')
  .fontSize(9)
  .text(
    'This report is generated by a machine-learning research prototype. It is NOT a medical diagnosis. Model probabilities are not clinically calibrated estimates. Results must be reviewed by a qualified healthcare professional.',
    LEFT,
    pdf.y,
    {
      width: WIDTH,
      align: 'justify',
      lineGap: 3
    }
  );

pageFooter(2);

pdf.end();
});

export default router;
