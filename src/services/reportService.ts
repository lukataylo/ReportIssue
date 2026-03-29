import { Report } from '../types';

const STORAGE_KEY = 'reportse_reports';

export const reportService = {
  getReports: (): Report[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveReport: (report: Report) => {
    const reports = reportService.getReports();
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  },

  generateReference: (prefix: string): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${random}`;
  },

  submitReport: async (reportData: Partial<Report>): Promise<Report> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const categoryId = reportData.categoryId!;
    let prefix = 'FMS';
    let routingService = 'FixMyStreet (Southwark)';
    let explainer = 'Southwark Council will investigate and update this report within 10 working days.';

    if (categoryId === 'rough-sleeping') {
      prefix = 'SR';
      routingService = 'StreetLink';
      explainer = "StreetLink will alert St Mungo's outreach team who will try to locate the individual within 24 hours. You'll receive a follow-up within 14 days.";
    } else if (categoryId === 'noise' || categoryId === 'asb') {
      prefix = 'ASB';
      routingService = 'Southwark ASB Unit';
      explainer = 'The Anti-Social Behaviour unit has received your report. Tier 1 issues are responded to within 24 hours.';
    } else if (categoryId === 'flooding') {
      prefix = 'FLD';
      routingService = reportData.details?.floodType === 'sewer' ? 'Thames Water' : 'Southwark Council';
      explainer = routingService === 'Thames Water' 
        ? 'Thames Water have been notified of the sewer issue. Emergency teams aim to respond within 4 hours.'
        : 'Southwark Council drainage teams will investigate the surface water flooding.';
    }

    const report: Report = {
      id: Math.random().toString(36).substr(2, 9),
      reference: reportService.generateReference(prefix),
      categoryId: categoryId as any,
      status: 'submitted',
      timestamp: Date.now(),
      location: reportData.location || { lat: 51.4944, lng: -0.0687 }, // Bermondsey
      description: reportData.description || '',
      photo: reportData.photo,
      details: reportData.details || {},
      routingService,
      explainer
    };

    reportService.saveReport(report);
    return report;
  }
};
