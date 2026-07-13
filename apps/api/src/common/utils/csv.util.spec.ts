import { buildCsv, escapeCsvField } from './csv.util'

describe('csv.util', () => {
  describe('escapeCsvField', () => {
    it('returns a plain field unchanged', () => {
      expect(escapeCsvField('INV-0001')).toBe('INV-0001')
    })

    it('quotes and escapes a field containing a comma', () => {
      expect(escapeCsvField('Acme, Inc')).toBe('"Acme, Inc"')
    })

    it('quotes and doubles internal quotes in a field containing a quote', () => {
      expect(escapeCsvField('Say "hi"')).toBe('"Say ""hi"""')
    })

    it('quotes a field containing a newline', () => {
      expect(escapeCsvField('line one\nline two')).toBe('"line one\nline two"')
    })
  })

  describe('buildCsv', () => {
    it('joins header and rows with commas and newlines', () => {
      const csv = buildCsv(
        ['invoiceNumber', 'amountDue'],
        [
          ['INV-0001', '100'],
          ['INV-0002', '250'],
        ],
      )
      expect(csv).toBe('invoiceNumber,amountDue\nINV-0001,100\nINV-0002,250')
    })

    it('escapes fields within rows', () => {
      const csv = buildCsv(['name'], [['Acme, Inc']])
      expect(csv).toBe('name\n"Acme, Inc"')
    })

    it('returns just the header line when there are no rows', () => {
      const csv = buildCsv(['a', 'b'], [])
      expect(csv).toBe('a,b')
    })
  })
})
