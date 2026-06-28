import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(currentDir, "logo.png");
const logoBuffer = readFileSync(logoPath);

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, "");

const formatDateTime = (input) => {
  if (!input) return "N/A";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatMoney = (value, currency = "USD") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} 0.00`;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const escapeText = (value) => {
  const text = String(value ?? "").split(/\s+/).join(" ").trim();
  return text || "N/A";
};

const getDisplayName = (userData) => {
  const profile = userData?.userProfile;
  const firstName = profile?.firstName?.trim();
  const lastName = profile?.lastName?.trim();
  return [firstName, lastName].filter(Boolean).join(" ") || userData?.email || "N/A";
};

const getEventById = async (eventServiceUrl, eventId) => {
  const response = await fetch(`${eventServiceUrl}/events`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch event list: ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new TypeError("Invalid event list response");
  }

  return payload.find((item) => String(item?.id) === String(eventId)) ?? null;
};

const drawQrFinderPattern = (doc, x, y, cellSize) => {
  const outer = cellSize * 7;
  const middle = cellSize * 5;
  const inner = cellSize * 3;

  doc.rect(x, y, outer, outer).fill("#ffffff");
  doc.rect(x + cellSize, y + cellSize, middle, middle).fill("#111827");
  doc.rect(x + cellSize * 2, y + cellSize * 2, inner, inner).fill("#ffffff");
  doc.rect(x + cellSize * 3, y + cellSize * 3, cellSize, cellSize).fill("#111827");
};

const drawSimpleQrCode = (doc, code, x, y, size) => {
  const gridSize = 21;
  const cellSize = Math.max(2, Math.floor(size / gridSize));
  const drawSize = cellSize * gridSize;
  const codeSeed = String(code ?? "TICKETY").replaceAll(/[^a-z0-9]/gi, "") || "TICKETY";

  doc.roundedRect(x, y, drawSize, drawSize, 8).fill("#ffffff");

  drawQrFinderPattern(doc, x + cellSize, y + cellSize, cellSize);
  drawQrFinderPattern(doc, x + drawSize - cellSize * 8, y + cellSize, cellSize);
  drawQrFinderPattern(doc, x + cellSize, y + drawSize - cellSize * 8, cellSize);

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const inTopLeft = row < 8 && column < 8;
      const inTopRight = row < 8 && column >= gridSize - 8;
      const inBottomLeft = row >= gridSize - 8 && column < 8;

      if (inTopLeft || inTopRight || inBottomLeft) {
        continue;
      }

      const seedIndex = (row * gridSize + column) % codeSeed.length;
      const seedValue = codeSeed.codePointAt(seedIndex) || 65;
      const patternValue = (seedValue + row * 7 + column * 13) % 5;

      if (patternValue === 0 || patternValue === 2) {
        doc.rect(x + column * cellSize, y + row * cellSize, cellSize, cellSize).fill("#111827");
      }
    }
  }

  doc.roundedRect(x, y, drawSize, drawSize, 8).stroke("#111827");
};

const createPdfBuffer = async (ticketData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [540, 560], margin: 0 });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 36;
    const outerX = margin;
    const outerY = margin;
    const outerWidth = pageWidth - margin * 2;
    const outerHeight = pageHeight - margin * 2;
    const headerHeight = 118;
    const accent = "#06b6d4";
    const accentDark = "#0f172a";
    const slate = "#334155";
    const muted = "#64748b";

    doc.rect(0, 0, pageWidth, pageHeight).fill("#f1f5f9");
    doc.roundedRect(outerX, outerY, outerWidth, outerHeight, 22).fillAndStroke("#ffffff", "#dbe4ee");
    doc.roundedRect(outerX, outerY, outerWidth, headerHeight, 22).fill(accentDark);
    doc.rect(outerX, outerY + headerHeight - 22, outerWidth, 22).fill(accentDark);

    try {
      doc.image(logoBuffer, outerX + 16, outerY + 12, { fit: [40, 40] });
    } catch {
      doc.fillColor(accent).circle(outerX + 32, outerY + 30, 18).fill();
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text("T", outerX + 24, outerY + 18, { width: 16, align: "center" });
    }
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("Tickety", outerX + 64, outerY + 16);
    doc.fillColor("#cbd5e1").font("Helvetica").fontSize(9).text("Your Event Ticket Platform", outerX + 64, outerY + 40);

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text("EVENT TICKET", outerX + 28, outerY + 72);
    doc.fillColor("#dbeafe").font("Helvetica").fontSize(10).text(`Ticket Code: ${escapeText(ticketData.ticketCode)}`, outerX + outerWidth - 238, outerY + 22, {
      width: 210,
      align: "right",
    });

    const contentTop = outerY + headerHeight + 24;
    const leftX = outerX + 24;
    const rightX = outerX + outerWidth / 2 + 8;
    const sectionWidth = outerWidth / 2 - 32;

    const drawSectionHeader = (title, x, y) => {
      doc.roundedRect(x, y, sectionWidth, 26, 8).fill(accent);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text(title.toUpperCase(), x + 10, y + 8);
    };

    const drawInfoRow = (label, value, x, y, options = {}) => {
      const labelWidth = options.labelWidth ?? sectionWidth * 0.34;
      const valueWidth = options.valueWidth ?? sectionWidth - labelWidth;
      const valueFontSize = options.valueFontSize ?? 11;

      doc.fillColor(muted).font("Helvetica").fontSize(9).text(label, x, y, { width: labelWidth });
      doc.fillColor(accentDark).font("Helvetica-Bold").fontSize(valueFontSize).text(value, x + labelWidth, y - 1, {
        width: valueWidth,
        align: "right",
        lineBreak: false,
      });
    };

    drawSectionHeader("Ticket & Event", leftX, contentTop);
    doc.fillColor(accentDark).font("Helvetica-Bold").fontSize(16).text(escapeText(ticketData.eventName), leftX, contentTop + 36, { width: sectionWidth });
    doc.fillColor(slate).font("Helvetica").fontSize(10).text(escapeText(ticketData.eventTagline), leftX, contentTop + 60, { width: sectionWidth });

    drawInfoRow("Event ID", escapeText(ticketData.eventId), leftX, contentTop + 94);
    drawInfoRow("Ticket Type", escapeText(ticketData.ticketTypeName), leftX, contentTop + 114);
    drawInfoRow("Ticket No.", `${ticketData.ticketIndex} of ${ticketData.ticketCount}`, leftX, contentTop + 134);
    drawInfoRow("Seat / Zone", escapeText(ticketData.seatInfo), leftX, contentTop + 154);
    drawInfoRow("Event Date", formatDateTime(ticketData.eventDate), leftX, contentTop + 174, { valueFontSize: 10 });
    drawInfoRow("Venue", escapeText(ticketData.eventVenue), leftX, contentTop + 194);

    drawSectionHeader("Buyer & Payment", rightX, contentTop);
    doc.fillColor(accentDark).font("Helvetica-Bold").fontSize(16).text(escapeText(ticketData.userName), rightX, contentTop + 36, { width: sectionWidth });
    doc.fillColor(slate).font("Helvetica").fontSize(10).text(escapeText(ticketData.userEmail), rightX, contentTop + 60, { width: sectionWidth });

    drawInfoRow("Booking ID", escapeText(ticketData.bookingId), rightX, contentTop + 94);
    drawInfoRow("Issued On", formatDateTime(ticketData.issuedAt), rightX, contentTop + 114, { valueFontSize: 10, labelWidth: sectionWidth * 0.28 });
    drawInfoRow("Quantity", String(ticketData.quantity), rightX, contentTop + 134);
    drawInfoRow("Unit Price", formatMoney(ticketData.unitPrice, ticketData.currency), rightX, contentTop + 154);
    drawInfoRow("Subtotal", formatMoney(ticketData.subtotal, ticketData.currency), rightX, contentTop + 174);

    const qrSize = 72;
    const qrX = outerX + outerWidth - qrSize - 24;
    const qrY = pageHeight - margin - qrSize - 44;
    drawSimpleQrCode(doc, ticketData.ticketCode, qrX, qrY, qrSize);
    doc.fillColor(muted).font("Helvetica").fontSize(8).text("Scan QR", qrX, qrY + qrSize + 4, {
      width: qrSize,
      align: "center",
    });

    doc.fillColor(accent).font("Helvetica-Bold").fontSize(11).text("Tickety", outerX + 24, pageHeight - margin - 26);
    doc.fillColor(muted).font("Helvetica").fontSize(9).text("Thank you for booking with Tickety. Enjoy the event!", outerX + 86, pageHeight - margin - 24);

    doc.end();
  });
};

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const sesClient = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });

const buildTicketData = ({
  booking,
  item,
  ticketIndex,
  quantity,
  matchedTicketType,
  userId,
  userName,
  userEmail,
  eventName,
  eventTagline,
  eventDate,
  eventVenue,
}) => {
  const ticketTypeName = matchedTicketType?.name?.trim() || `Ticket Type ${item.ticketTypeId}`;
  const seatInfo = matchedTicketType?.description?.trim() || "General Admission";
  const unitPrice = Number(item.unitPrice) || 0;
  const subtotal = Number(item.subtotal) || unitPrice * quantity;

  return {
    bookingId: booking.id,
    userId,
    eventId: booking.eventId,
    ticketCode: `TKT-${booking.id}-${item.ticketTypeId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ticketTypeId: item.ticketTypeId,
    ticketTypeName,
    seatInfo,
    ticketIndex,
    ticketCount: quantity,
    userName,
    userEmail,
    eventName,
    eventTagline,
    eventDate,
    eventVenue,
    issuedAt: new Date().toISOString(),
    quantity,
    unitPrice,
    subtotal,
    currency: booking.currency || "USD",
  };
};

const processTicketRecord = async ({
  record,
  bookingServiceUrl,
  userServiceUrl,
  eventServiceUrl,
  bucketName,
  senderEmail,
}) => {
  const payload = JSON.parse(record.body);
  const { bookingId, userId } = payload;

  if (!bookingId || !userId) {
    throw new Error("Missing bookingId or userId in payload");
  }

  const userRes = await fetch(`${userServiceUrl}/users/${userId}`);
  if (!userRes.ok) throw new Error(`Failed to fetch user: ${userRes.status}`);
  const userData = await userRes.json();
  const userEmail = userData.email;
  const userName = getDisplayName(userData);

  const bookingRes = await fetch(`${bookingServiceUrl}/bookings/${bookingId}/details`);
  if (!bookingRes.ok) throw new Error(`Failed to fetch booking details: ${bookingRes.status}`);
  const { booking } = await bookingRes.json();

  if (!booking?.items) {
    throw new Error("Invalid booking data or missing items");
  }

  const eventData = await getEventById(eventServiceUrl, booking.eventId);
  const eventName = eventData?.title?.trim() || `Event #${booking.eventId}`;
  const eventDate = eventData?.startTime || null;
  const eventVenue = eventData?.venueDetails?.name?.trim() || eventData?.venueDetails?.city?.trim() || "Venue TBA";
  const eventTagline = [eventData?.category?.trim(), eventData?.venueDetails?.city?.trim()].filter(Boolean).join(" · ") || "Live event";

  const ticketTypeMap = new Map((eventData?.eventTicketTypes || []).map((ticketType) => [String(ticketType.id), ticketType]));
  const ticketsToCreate = [];
  const s3Urls = [];

  for (const item of booking.items) {
    const matchedTicketType = ticketTypeMap.get(String(item.ticketTypeId)) || {};
    const quantity = Number(item.quantity) || 0;

    for (let index = 0; index < quantity; index += 1) {
      const ticketData = buildTicketData({
        booking,
        item,
        ticketIndex: index + 1,
        quantity,
        matchedTicketType,
        userId,
        userName,
        userEmail,
        eventName,
        eventTagline,
        eventDate,
        eventVenue,
      });

      const pdfBuffer = await createPdfBuffer(ticketData);

      const s3Key = `tickets/booking-${bookingId}/${ticketData.ticketCode}.pdf`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        }),
      );

      const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3Key}`;
      s3Urls.push(s3Url);

      ticketsToCreate.push({
        ...ticketData,
        s3Url,
      });
    }
  }

  const createTicketsRes = await fetch(`${bookingServiceUrl}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickets: ticketsToCreate }),
  });

  if (!createTicketsRes.ok) {
    const errText = await createTicketsRes.text();
    throw new Error(`Failed to save tickets in DB: ${createTicketsRes.status} - ${errText}`);
  }

  let emailBody = `Hello,\n\nYour booking (ID: ${bookingId}) is confirmed! Here are your ticket links:\n\n`;
  s3Urls.forEach((url, index) => {
    emailBody += `Ticket ${index + 1}: ${url}\n`;
  });
  emailBody += `\nEnjoy the event!`;

  await sesClient.send(
    new SendEmailCommand({
      Source: senderEmail,
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: `Your Tickets for Booking #${bookingId}` },
        Body: {
          Text: { Data: emailBody },
        },
      },
    }),
  );

  console.log(`Successfully processed ticket generation for booking ${bookingId}`);
};

export const handler = async (event) => {
  console.log("Received SQS event:", JSON.stringify(event));

  const bookingServiceUrl = normalizeBaseUrl(requireEnv("BOOKING_SERVICE_URL"));
  const userServiceUrl = normalizeBaseUrl(requireEnv("USER_SERVICE_URL"));
  const eventServiceUrl = normalizeBaseUrl(process.env.EVENT_SERVICE_URL || "http://localhost:3001");
  const bucketName = requireEnv("S3_TICKET_BUCKET_NAME");
  const senderEmail = requireEnv("SES_SENDER_EMAIL");

  for (const record of event.Records) {
    try {
      await processTicketRecord({
        record,
        bookingServiceUrl,
        userServiceUrl,
        eventServiceUrl,
        bucketName,
        senderEmail,
      });
    } catch (error) {
      console.error("Error processing record:", error);
      throw error;
    }
  }

  return { status: "Success" };
};



