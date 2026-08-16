import { Contact } from "../models/contact.model.js";
import { Service } from "../models/service.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/sendEmail.js";

// Create Contact (Public)
export const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, projectType, message, service } = req.body;

  if (!name || !email || !phone || !message) {
    throw new ApiError(400, "All required fields must be provided.");
  }

  let serviceDoc = null;
  if (service) {
    serviceDoc = await Service.findById(service);
    if (!serviceDoc) {
      throw new ApiError(400, "That service doesn't exist.");
    }
  }

  const contact = await Contact.create({
    name,
    email,
    phone,
    projectType,
    message,
    service: serviceDoc?._id || null,
  });

  // Notify the site owner by email. This is best-effort: if SMTP isn't
  // configured or the send fails, we still return success to the visitor —
  // their message is safely saved either way.
  const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_FROM;
  if (ownerEmail) {
    const subject = `New contact form submission from ${name}`;
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Project Type:</strong> ${projectType || "Not specified"}</p>
      <p><strong>Service Requested:</strong> ${serviceDoc ? serviceDoc.title : "Not specified"}</p>
      <p><strong>Message:</strong></p>
      <p>${String(message).replace(/\n/g, "<br/>")}</p>
    `;
    sendEmail(ownerEmail, subject, html).catch((err) =>
      console.error("Failed to send contact notification email:", err.message)
    );
  } else {
    console.warn("OWNER_EMAIL / EMAIL_FROM not set — skipping contact notification email.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, contact, "Contact message sent successfully."));
});

// Get All Contacts (Admin)
export const getAllContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find().populate("service", "title slug").sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, contacts, "Contacts fetched successfully."));
});

// Get Single Contact (Admin)
export const getContactById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findById(id).populate("service", "title slug");

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, contact, "Contact fetched successfully."));
});

// Update Contact (Admin)
export const updateContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  const { status, isRead } = req.body;

  const updatedContact = await Contact.findByIdAndUpdate(
    id,
    {
      status,
      isRead,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedContact, "Contact updated successfully."),
    );
});

// Delete Contact (Admin)
export const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  await contact.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Contact deleted successfully."));
});
