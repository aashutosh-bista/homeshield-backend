import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../database/index.js";
import { ServiceCategory } from "../models/serviceCategory.model.js";
import { Service } from "../models/service.model.js";
import { Faq } from "../models/faq.model.js";
import { About } from "../models/about.model.js";
import { ServiceArea } from "../models/serviceArea.model.js";
import { slugify } from "./slugify.js";

const CATEGORIES = [
  {
    name: "Consulting",
    icon: "FileText",
    description: "Independent, engineer-led advice before you sign a contract or spend a dollar on your renovation.",
    services: [
      {
        title: "Contract & Quote Audit",
        price: "$500–$1,000 CAD",
        ideal: "Before signing a renovation contract",
        description: "A thorough, line-by-line review of your contractor's quote and contract to protect you before any money changes hands.",
        includes: [
          "Full quote breakdown analysis for inflated or missing line items",
          "Contract clause review (payment terms, scope, liability, warranty)",
          "CCDC compliance check and recommendations",
          "Written report with suggested contract amendments",
          "30-minute debrief call with our engineer",
        ],
      },
      {
        title: "Pre-Purchase Consultation",
        price: "$400 CAD",
        ideal: "Before buying a property that needs renovation",
        description: "A candid assessment of renovation scope and likely costs before you commit to a purchase.",
        includes: [
          "Walkthrough of the property with a licensed engineer",
          "Rough renovation scope and cost range",
          "Red-flag structural or code issues identified",
        ],
      },
    ],
  },
  {
    name: "Construction",
    icon: "ClipboardCheck",
    description: "On-site verification during active construction to make sure work matches the contract and the Ontario Building Code.",
    services: [
      {
        title: "Milestone Verification",
        price: "$350/visit CAD",
        ideal: "During active construction",
        description: "On-site inspections at critical stages of your build to verify quality, code compliance, and scope alignment.",
        includes: [
          "Scheduled site visit at agreed milestone (demo, rough-in, drywall, etc.)",
          "Ontario Building Code (OBC) compliance spot check",
          "Photo-documented inspection report",
          "Deficiency tracking with contractor notification",
          "Holdback compliance guidance",
        ],
      },
      {
        title: "Deficiency Resolution",
        price: "$1,500–$2,500 CAD",
        ideal: "At substantial completion or when disputes arise",
        description: "Comprehensive final inspection and deficiency documentation with negotiation support for holdback release.",
        includes: [
          "Full-property deficiency walkthrough",
          "Formal Construction Deficiency Report (CDR)",
          "OBC cross-reference for each deficiency",
          "Holdback release recommendation",
          "Contractor negotiation support (up to 3 meetings)",
        ],
      },
    ],
  },
  {
    name: "Renovation",
    icon: "Hammer",
    description: "Specialized audits for common renovation trades, so every part of the job is checked by someone who isn't the contractor.",
    services: [
      {
        title: "Flooring",
        price: "$300 CAD",
        ideal: "Before and after flooring installation",
        description: "Verification of subfloor prep, material grade, and installation quality for hardwood, tile, or laminate flooring.",
        includes: ["Subfloor moisture and levelness check", "Material and finish verification against quote", "Post-install quality inspection"],
      },
      {
        title: "Kitchen Renovation",
        price: "$450 CAD",
        ideal: "Mid-renovation kitchen projects",
        description: "Checks plumbing rough-in, electrical, cabinetry install, and code compliance for kitchen remodels.",
        includes: ["Plumbing and electrical rough-in review", "Cabinetry and countertop install check", "Ventilation and code compliance"],
      },
      {
        title: "Bathroom Renovation",
        price: "$400 CAD",
        ideal: "Mid-renovation bathroom projects",
        description: "Waterproofing, ventilation, and fixture installation verification for bathroom remodels.",
        includes: ["Waterproofing membrane inspection", "Ventilation (exhaust fan) compliance", "Fixture and tile install check"],
      },
    ],
  },
];

const FAQS = [
  {
    question: "Do you work for the contractor or for me?",
    answer: "Strictly for you. We're an independent third party — we don't accept referral fees from contractors and have no financial stake in your renovation decisions.",
  },
  {
    question: "When should I bring you in?",
    answer: "Ideally before you sign a contract. That said, we're also commonly brought in mid-project for milestone checks, or at the end for a deficiency walkthrough before holdback release.",
  },
  {
    question: "Are you licensed?",
    answer: "Yes. Our audits and inspections are led by a licensed civil engineer with experience in Ontario Building Code compliance.",
  },
  {
    question: "What areas do you serve?",
    answer: "We currently serve the Greater Toronto Area — see our Service Areas section for the full list of cities we cover.",
  },
  {
    question: "How quickly can I get a report?",
    answer: "Most written reports are delivered within 2–3 business days of the site visit or document review.",
  },
];

const ABOUT = {
  heading: "About HomeShield Consulting",
  description:
    "HomeShield Consulting was founded to solve one problem: homeowners have no independent, technical advocate during a renovation. Contractors write the contracts, inspect their own work, and control the information homeowners see. We exist to change that. Led by a licensed civil engineer, we audit contracts, verify milestones on-site, and document deficiencies — giving Toronto homeowners the same level of technical oversight that commercial construction projects have always had.",
  highlights: [
    "Licensed Civil Engineer-led",
    "100% independent — no contractor referral fees",
    "Ontario Building Code specialists",
    "Serving the Greater Toronto Area",
  ],
};

const SERVICE_AREAS = [
  { name: "Toronto", description: "Downtown, North York, Scarborough, and Etobicoke." },
  { name: "Mississauga" },
  { name: "Brampton" },
  { name: "Vaughan" },
  { name: "Markham" },
  { name: "Richmond Hill" },
  { name: "Oakville" },
  { name: "Ajax & Pickering" },
];

async function ensureUniqueSlugLocal(Model, base) {
  let candidate = base;
  let n = 2;
  while (await Model.findOne({ slug: candidate })) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

async function seed() {
  await connectDB();

  // --- Service categories + services ---
  const categoryCount = await ServiceCategory.countDocuments();
  if (categoryCount === 0) {
    for (let i = 0; i < CATEGORIES.length; i++) {
      const { services, ...categoryData } = CATEGORIES[i];
      const slug = await ensureUniqueSlugLocal(ServiceCategory, slugify(categoryData.name));
      const category = await ServiceCategory.create({ ...categoryData, slug, order: i });

      for (let j = 0; j < services.length; j++) {
        const svcSlug = await ensureUniqueSlugLocal(Service, slugify(services[j].title));
        await Service.create({ ...services[j], slug: svcSlug, category: category._id, order: j });
      }
    }
    console.log(`Seeded ${CATEGORIES.length} service categories with their services.`);
  } else {
    console.log(`Service categories already exist (${categoryCount}), skipping.`);
  }

  // --- FAQs ---
  const faqCount = await Faq.countDocuments();
  if (faqCount === 0) {
    await Faq.insertMany(FAQS.map((f, i) => ({ ...f, order: i })));
    console.log(`Seeded ${FAQS.length} FAQs.`);
  } else {
    console.log(`FAQs already exist (${faqCount}), skipping.`);
  }

  // --- About (singleton) ---
  const aboutExists = await About.findOne();
  if (!aboutExists) {
    await About.create(ABOUT);
    console.log("Seeded About content.");
  } else {
    console.log("About content already exists, skipping.");
  }

  // --- Service areas ---
  const areaCount = await ServiceArea.countDocuments();
  if (areaCount === 0) {
    await ServiceArea.insertMany(SERVICE_AREAS.map((a, i) => ({ ...a, order: i })));
    console.log(`Seeded ${SERVICE_AREAS.length} service areas.`);
  } else {
    console.log(`Service areas already exist (${areaCount}), skipping.`);
  }

  await mongoose.connection.close();
  console.log("Content seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
