import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const initialRFQs = [
    {
        code: "RFQ-9021",
        title: "Office Furniture Procurement Q2",
        category: "Furniture & Fixtures",
        deadline: "2025-06-15",
        description: "Procurement of ergonomic chairs and standing desks for the new office layout.",
        priority: "High",
        budget: "$35,000",
        items: [
            { name: "Ergonomic chair", quantity: 25 },
            { name: "standing desk", quantity: 10 }
        ],
        status: "Open",
        statusTone: "open",
        invitedVendors: ["sarah.jenkins@vendorbridge.com", "vendor@company.com", "jane.doe@company.com"]
    },
    {
        code: "RFQ-9022",
        title: "Server Rack Upgrade - Data Center Alpha",
        category: "IT Hardware",
        deadline: "2025-06-20",
        description: "Upgrading core server cabinets and enclosures in Data Center Alpha.",
        priority: "Medium",
        budget: "$15,000",
        items: [
            { name: "Server Rack 42U Cabinet", quantity: 5 }
        ],
        status: "Draft",
        statusTone: "draft",
        invitedVendors: []
    },
    {
        code: "RFQ-9023",
        title: "Janitorial Services FY2026",
        category: "Facilities Management",
        deadline: "2025-07-01",
        description: "Annual contract for facilities cleaning and janitorial maintenance.",
        priority: "Urgent",
        budget: "$60,000",
        items: [
            { name: "Monthly Janitorial Cleaning Service", quantity: 12 }
        ],
        status: "Evaluating",
        statusTone: "evaluating",
        invitedVendors: ["cleanpro@company.com", "vendor@company.com"]
    }
];

const initialQuotations = [
    {
        id: "QT-9021-01",
        rfqCode: "RFQ-9021",
        vendorEmail: "sarah.jenkins@vendorbridge.com",
        vendorName: "Sarah Jenkins",
        items: [
            { name: "Ergonomic chair", quantity: 25, unitPrice: 3500, total: 87500, deliveryDays: 7 },
            { name: "standing desk", quantity: 10, unitPrice: 8200, total: 82000, deliveryDays: 14 }
        ],
        taxPercent: 18,
        subtotal: 169500,
        taxAmount: 30510,
        grandTotal: 200010,
        notes: "Payment terms: 20 days net. Shipping and placement included.",
        status: "Submitted",
        submittedAt: "2025-06-05T10:00:00Z"
    }
];

export const useRFQStore = create(
    persist(
        (set, get) => ({
            rfqs: initialRFQs,
            quotations: initialQuotations,

            addRFQ: (rfq) => set((state) => {
                const year = new Date().getFullYear();
                const code = `RFQ-${Math.floor(9000 + Math.random() * 999)}`;
                const newRfq = {
                    ...rfq,
                    code,
                    status: rfq.status || "Open",
                    statusTone: rfq.status === "Draft" ? "draft" : "open"
                };
                return { rfqs: [...state.rfqs, newRfq] };
            }),

            updateRFQ: (code, updates) => set((state) => ({
                rfqs: state.rfqs.map(r => r.code === code ? { ...r, ...updates } : r)
            })),

            saveQuotation: (quotation) => set((state) => {
                // If the quotation exists, update it, otherwise insert new
                const exists = state.quotations.some(
                    q => q.rfqCode === quotation.rfqCode && q.vendorEmail === quotation.vendorEmail
                );
                
                const updatedQuotations = exists
                    ? state.quotations.map(q => 
                        q.rfqCode === quotation.rfqCode && q.vendorEmail === quotation.vendorEmail
                            ? { ...q, ...quotation, id: q.id || `QT-${quotation.rfqCode.split('-')[1]}-${Math.floor(10 + Math.random() * 89)}` }
                            : q
                      )
                    : [...state.quotations, { 
                        ...quotation, 
                        id: `QT-${quotation.rfqCode.split('-')[1]}-${Math.floor(10 + Math.random() * 89)}` 
                      }];

                return { quotations: updatedQuotations };
            })
        }),
        {
            name: "rfq-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
);
