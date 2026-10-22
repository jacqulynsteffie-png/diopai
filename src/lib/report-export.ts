"use client";

// Real client-side report file generation: CSV, Excel (SpreadsheetML), PDF (jsPDF).
// All values come from the in-memory demo data — clearly research-use.

import type { ResearchCase, ReportRecord } from "./types";
import { STUDY_META } from "./types";

type ReportType = ReportRecord["type"];

function reportRows(type: ReportType, cases: ResearchCase[]) {
  switch (type) {
    case "Study Dataset Summary":
      return {
        headers: ["Case ID", "Age", "Sex", "Implant Site", "CBCT Quality", "Eligibility", "Prediction", "Probability", "Outcome", "Follow-up (mo)"],
        body: cases.map((c) => [
          c.caseId, c.age, c.sex, c.implantSite, c.cbctQuality, c.eligibility,
          c.prediction?.predictedOutcome ?? "—",
          c.prediction ? `${Math.round(c.prediction.probability * 100)}%` : "—",
          c.outcome?.documentedOutcome ?? "Pending",
          c.outcome?.followUpMonths ?? "—",
        ]),
      };
    case "Model Performance Report":
      return {
        headers: ["Algorithm", "Version", "Status", "ROC-AUC", "Accuracy", "Sensitivity", "Specificity", "F1"],
        body: [
          ["XGBoost", "1.0", "Validated", "0.82", "0.81", "0.78", "0.83", "0.77"],
          ["Random Forest", "1.0", "Development", "0.77", "0.76", "0.72", "0.79", "0.71"],
          ["Logistic Regression", "1.0", "Development", "0.71", "0.71", "0.66", "0.75", "0.65"],
        ],
      };
    case "Prediction Analysis":
      return {
        headers: ["Case ID", "Predicted Outcome", "Probability", "Documented Outcome", "Agreement"],
        body: cases
          .filter((c) => c.prediction && c.outcome?.documentedOutcome)
          .map((c) => [
            c.caseId,
            c.prediction!.predictedOutcome,
            `${Math.round(c.prediction!.probability * 100)}%`,
            c.outcome!.documentedOutcome,
            c.prediction!.predictedOutcome === c.outcome!.documentedOutcome ? "Yes" : "No",
          ]),
      };
    case "Feature Analysis":
      return {
        headers: ["Feature", "Contribution", "Direction"],
        body: [
          ["Bone Density (HU)", "0.31", "Positive"],
          ["Bone Quality", "0.24", "Positive"],
          ["Cortical Thickness", "0.19", "Positive"],
          ["Smoking Status", "0.17", "Negative"],
          ["Diabetes Status", "0.13", "Negative"],
          ["Implant Length", "0.10", "Positive"],
          ["Loading Protocol", "0.07", "Negative"],
          ["Buccolingual Width", "0.06", "Positive"],
        ],
      };
    case "Data Quality Report":
      return {
        headers: ["Metric", "Value"],
        body: [
          ["Total records", String(cases.length)],
          ["Eligible records", String(cases.filter((c) => c.eligibility === "Eligible").length)],
          ["Excluded records", String(cases.filter((c) => c.eligibility === "Excluded").length)],
          ["Missing values", String(cases.filter((c) => c.cbct.assessmentStatus !== "Entered").length)],
          ["Invalid values", String(cases.filter((c) => !c.cbctAvailable).length)],
          ["Outcome available", String(cases.filter((c) => c.outcome?.documentedOutcome).length)],
        ],
      };
    case "Final Research Summary":
    default:
      return {
        headers: ["Section", "Summary"],
        body: [
          ["Study", STUDY_META.shortTitle],
          ["Design", STUDY_META.design],
          ["Total cases", String(cases.length)],
          ["Eligible cases", String(cases.filter((c) => c.eligibility === "Eligible").length)],
          ["Predictions generated", String(cases.filter((c) => c.prediction).length)],
          ["Current model", "XGBoost v1.0"],
          ["ROC-AUC", "0.82"],
          ["Disclaimer", STUDY_META.disclaimer],
        ],
      };
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function esc(s: string) {
  return String(s).replace(/"/g, '""');
}

export function downloadCSV(type: ReportType, cases: ResearchCase[]) {
  const { headers, body } = reportRows(type, cases);
  const lines = [
    headers.map((h) => `"${esc(h)}"`).join(","),
    ...body.map((row) => row.map((c) => `"${esc(String(c))}"`).join(",")),
  ];
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${type.replace(/\s+/g, "_")}.csv`);
}

export function downloadExcel(type: ReportType, cases: ResearchCase[]) {
  const { headers, body } = reportRows(type, cases);
  const rowsXml = [headers, ...body]
    .map(
      (row) =>
        `<Row>${row.map((c) => `<Cell><Data ss:Type="String">${String(c).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>`).join("")}</Row>`
    )
    .join("");
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${type.replace(/[^\w]/g, "").slice(0, 28) || "Report"}">
<Table>${rowsXml}</Table>
</Worksheet>
</Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  triggerDownload(blob, `${type.replace(/\s+/g, "_")}.xls`);
}

export async function downloadPDF(type: ReportType, cases: ResearchCase[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const { headers, body } = reportRows(type, cases);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header band
  doc.setFillColor(11, 18, 32);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 4, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Diop AI Research", margin, 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("AI-Powered Dental Implant Outcome Research Platform", margin, 45);
  doc.text("Retrospective study", margin, 56);

  y = 90;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(type, margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  doc.text(`Dataset: ${cases.length} records`, margin, y + 12);
  y += 30;

  // Table
  autoTable(doc, {
    head: [headers],
    body: body.map((r) => r.map((c) => String(c))),
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    theme: "grid",
  });

  // Disclaimer + footer
  const finalY = (doc as any).lastAutoTable.finalY + 24;
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text("Research-use only. Not a clinical diagnostic device.", margin, finalY);
  doc.setTextColor(100, 116, 139);
  const disclaimerLines = doc.splitTextToSize(STUDY_META.disclaimer, pageW - margin * 2);
  doc.text(disclaimerLines, margin, finalY + 12);
  doc.setTextColor(148, 163, 184);
  doc.text("Research-use only. v1.0", margin, finalY + 12 + disclaimerLines.length * 10 + 8);

  doc.save(`${type.replace(/\s+/g, "_")}.pdf`);
}
