import { google } from 'googleapis'

const spreadsheetId = process.env.GOOGLE_SHEET_ID

function getPrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY

  if (!key) {
    throw new Error('GOOGLE_PRIVATE_KEY is missing')
  }

  return key.replace(/\\n/g, '\n')
}

export async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is missing')
  }

  if (!clientEmail) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is missing')
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: getPrivateKey(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

export async function readSheet(range: string) {
  const sheets = await getSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return response.data.values ?? []
}

export async function appendSheet(range: string, values: string[][]) {
  const sheets = await getSheetsClient()

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  })
}

export async function updateSheet(range: string, values: string[][]) {
  const sheets = await getSheetsClient()

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  })
}