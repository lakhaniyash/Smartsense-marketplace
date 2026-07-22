import { MockedProvider, type MockedResponse } from '@apollo/client/testing'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  GetInvoiceByIdDocument,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '@lib/graphql/__generated__/graphql'
import { ToastProvider } from '@shared/components'
import { BreadcrumbProvider } from '@shared/layouts'
import { InvoiceDetailPage } from './InvoiceDetailPage'

// usePermissions is stubbed so each test can pick the caller's capabilities
// (Admin = billing:manage, Partner = billing:read only) without standing up
// AuthProvider/Keycloak; the useInvoice query itself runs for real through
// Apollo's MockedProvider, per docs/testing.md § Mocking Strategy.
const { usePermissionsMock } = vi.hoisted(() => ({ usePermissionsMock: vi.fn() }))
vi.mock('@features/auth', () => ({ usePermissions: usePermissionsMock }))

const INVOICE_ID = 'inv-1'

const ADMIN_PERMISSIONS = { canManageBilling: true, canViewBilling: true }
const PARTNER_PERMISSIONS = { canManageBilling: false, canViewBilling: true }

function invoiceResult(overrides: Record<string, unknown> = {}): MockedResponse {
  return {
    request: { query: GetInvoiceByIdDocument, variables: { id: INVOICE_ID } },
    result: {
      data: {
        invoice: {
          id: INVOICE_ID,
          invoiceNumber: 'INV-20260701-ABCD',
          orderId: 'order-1',
          partnerId: 'partner-1',
          amountDue: '100.00',
          status: InvoiceStatus.Issued,
          issuedAt: '2026-07-01T00:00:00.000Z',
          dueAt: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
          payments: [],
          ...overrides,
        },
      },
    },
  }
}

function renderPage(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/billing/${INVOICE_ID}`]}>
          <BreadcrumbProvider>
            <Routes>
              <Route path="/billing/:id" element={<InvoiceDetailPage />} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      </ToastProvider>
    </MockedProvider>,
  )
}

describe('InvoiceDetailPage', () => {
  beforeEach(() => {
    usePermissionsMock.mockReturnValue(ADMIN_PERMISSIONS)
  })

  it('renders the loading skeleton before the query resolves', () => {
    const { container } = renderPage([{ ...invoiceResult(), delay: Infinity }])

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: /Invoice #/ })).not.toBeInTheDocument()
  })

  it('renders the error state when the query fails', async () => {
    renderPage([
      {
        request: { query: GetInvoiceByIdDocument, variables: { id: INVOICE_ID } },
        error: new Error('network down'),
      },
    ])

    expect(await screen.findByText("Couldn't load this invoice")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to billing' })).toBeInTheDocument()
  })

  it('renders the invoice, its payments, and Admin billing controls on the data path', async () => {
    renderPage([
      invoiceResult({
        status: InvoiceStatus.PartiallyPaid,
        payments: [
          {
            id: 'pay-1',
            amount: '40.00',
            method: PaymentMethod.Card,
            externalTransactionId: 'TX-1',
            status: PaymentStatus.Succeeded,
            processedAt: '2026-07-02T00:00:00.000Z',
            createdAt: '2026-07-02T00:00:00.000Z',
          },
        ],
      }),
    ])

    expect(
      await screen.findByRole('heading', { name: 'Invoice #INV-20260701-ABCD' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Partially paid')).toBeInTheDocument()
    expect(screen.getByText('TX-1')).toBeInTheDocument()
    // billing:manage present → the money-movement controls render. A
    // PARTIALLY_PAID invoice is past DRAFT/ISSUED, so it can no longer be voided.
    expect(screen.getByRole('button', { name: 'Record Payment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Void Invoice' })).not.toBeInTheDocument()
  })

  it('offers Void on an ISSUED invoice to a billing:manage caller', async () => {
    renderPage([invoiceResult()])

    await screen.findByRole('heading', { name: 'Invoice #INV-20260701-ABCD' })
    expect(screen.getByRole('button', { name: 'Record Payment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Void Invoice' })).toBeInTheDocument()
  })

  it('hides the money-movement controls from a billing:read-only (Partner) caller', async () => {
    usePermissionsMock.mockReturnValue(PARTNER_PERMISSIONS)
    renderPage([invoiceResult()])

    await screen.findByRole('heading', { name: 'Invoice #INV-20260701-ABCD' })
    // Read-only: can still download, but cannot record a payment or void.
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Record Payment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Void Invoice' })).not.toBeInTheDocument()
  })
})
