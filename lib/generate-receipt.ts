import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function generateReceiptPDF({
  clientName,
  clientEmail,
  proName,
  amount,
  date,
  transactionId,
  service,
}: {
  clientName: string
  clientEmail: string
  proName: string
  amount: number // en centimes, diviser par 100 pour afficher
  date: string
  transactionId: string
  service?: string
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size in points

  const { width, height } = page.getSize()
  const margin = 50

  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Colors
  const purpleColor = rgb(0.486, 0.227, 0.929) // #7c3aed
  const darkColor = rgb(0.059, 0.086, 0.165) // #0f172a
  const mutedColor = rgb(0.392, 0.455, 0.545) // #64748b
  const lightGray = rgb(0.871, 0.906, 0.937) // #e2e8f0

  let y = height - margin

  // Logo "CalendaPro" en haut à gauche en violet
  page.drawText('Calenda', {
    x: margin,
    y,
    size: 24,
    font: helveticaBold,
    color: darkColor,
  })
  page.drawText('Pro', {
    x: margin + 85,
    y,
    size: 24,
    font: helveticaBold,
    color: purpleColor,
  })

  y -= 40

  // Titre 'Reçu de paiement' en gros
  page.drawText('Recu de paiement', {
    x: margin,
    y,
    size: 32,
    font: helveticaBold,
    color: darkColor,
  })

  y -= 30

  // Numéro de reçu basé sur le transactionId
  page.drawText(`N° ${transactionId}`, {
    x: margin,
    y,
    size: 12,
    font: helvetica,
    color: mutedColor,
  })

  y -= 25

  // Date du paiement
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  page.drawText(`Date : ${formattedDate}`, {
    x: margin,
    y,
    size: 12,
    font: helvetica,
    color: darkColor,
  })

  y -= 40

  // Séparateur horizontal
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: lightGray,
  })

  y -= 35

  // Section 'Payé par' : nom + email du client
  page.drawText('Paye par', {
    x: margin,
    y,
    size: 10,
    font: helveticaBold,
    color: mutedColor,
  })

  y -= 20

  page.drawText(clientName, {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: darkColor,
  })

  y -= 18

  page.drawText(clientEmail, {
    x: margin,
    y,
    size: 12,
    font: helvetica,
    color: mutedColor,
  })

  y -= 35

  // Section 'Professionnel' : nom du pro
  page.drawText('Professionnel', {
    x: margin,
    y,
    size: 10,
    font: helveticaBold,
    color: mutedColor,
  })

  y -= 20

  page.drawText(proName, {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: darkColor,
  })

  y -= 35

  // Section 'Service' si fourni
  if (service) {
    page.drawText('Service', {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
      color: mutedColor,
    })

    y -= 20

    page.drawText(service, {
      x: margin,
      y,
      size: 14,
      font: helvetica,
      color: darkColor,
    })

    y -= 35
  }

  // Séparateur horizontal
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: lightGray,
  })

  y -= 50

  // Montant total en grand avec le symbole €
  const amountInEuros = (amount / 100).toFixed(2)
  page.drawText(`${amountInEuros} €`, {
    x: margin,
    y,
    size: 48,
    font: helveticaBold,
    color: purpleColor,
  })

  y -= 30

  // Mention 'Paiement sécurisé via Stripe'
  page.drawText('Paiement securise via Stripe', {
    x: margin,
    y,
    size: 11,
    font: helvetica,
    color: mutedColor,
  })

  // Pied de page : 'Merci pour votre confiance — CalendaPro'
  const footerY = 60
  page.drawLine({
    start: { x: margin, y: footerY + 20 },
    end: { x: width - margin, y: footerY + 20 },
    thickness: 1,
    color: lightGray,
  })

  page.drawText('Merci pour votre confiance — CalendaPro', {
    x: margin,
    y: footerY,
    size: 10,
    font: helvetica,
    color: mutedColor,
  })

  // Save PDF
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
