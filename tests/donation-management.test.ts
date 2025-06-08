import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
let mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockInstitution = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
const mockDonor = "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"

// Mock state
let mockState = {
  donations: {},
  institutionDonations: {},
  donorDonations: {},
  donationIdCounter: 0,
  admin: mockTxSender,
  blockHeight: 100,
  balances: {
    [mockTxSender]: 1000,
    [mockDonor]: 500,
  },
}

// Mock contract functions
const mockContract = {
  isAdmin: () => mockState.admin === mockTxSender,
  stxGetBalance: (principal) => {
    return mockState.balances[principal] || 0
  },
  stxTransfer: (amount, sender, recipient) => {
    if (mockState.balances[sender] < amount) {
      return { type: "err", value: 102 } // ERR-INSUFFICIENT-FUNDS
    }
    mockState.balances[sender] -= amount
    mockState.balances[recipient] = (mockState.balances[recipient] || 0) + amount
    return { type: "ok", value: true }
  },
  makeDonation: (institution, amount, purpose) => {
    if (mockState.balances[mockTxSender] < amount) {
      return { type: "err", value: 102 } // ERR-INSUFFICIENT-FUNDS
    }
    const donationId = mockState.donationIdCounter
    mockContract.stxTransfer(amount, mockTxSender, institution)
    mockState.donations[donationId] = {
      donor: mockTxSender,
      institution,
      amount,
      purpose,
      timestamp: mockState.blockHeight,
    }
    mockState.institutionDonations[institution] = (mockState.institutionDonations[institution] || 0) + amount
    mockState.donorDonations[mockTxSender] = (mockState.donorDonations[mockTxSender] || 0) + amount
    mockState.donationIdCounter++
    return { type: "ok", value: donationId }
  },
  getDonationDetails: (donationId) => {
    return mockState.donations[donationId] || null
  },
  getInstitutionTotal: (institution) => {
    return mockState.institutionDonations[institution] || 0
  },
  getDonorTotal: (donor) => {
    return mockState.donorDonations[donor] || 0
  },
  transferAdmin: (newAdmin) => {
    if (!mockContract.isAdmin()) {
      return { type: "err", value: 100 } // ERR-NOT-AUTHORIZED
    }
    mockState.admin = newAdmin
    return { type: "ok", value: true }
  },
}

describe("Donation Management Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    mockState = {
      donations: {},
      institutionDonations: {},
      donorDonations: {},
      donationIdCounter: 0,
      admin: mockTxSender,
      blockHeight: 100,
      balances: {
        [mockTxSender]: 1000,
        [mockDonor]: 500,
      },
    }
  })
  
  it("should make a donation", () => {
    const result = mockContract.makeDonation(mockInstitution, 100, "Tithe")
    expect(result).toEqual({ type: "ok", value: 0 })
    expect(mockContract.getDonationDetails(0)).toEqual({
      donor: mockTxSender,
      institution: mockInstitution,
      amount: 100,
      purpose: "Tithe",
      timestamp: 100,
    })
    expect(mockContract.getInstitutionTotal(mockInstitution)).toBe(100)
    expect(mockContract.getDonorTotal(mockTxSender)).toBe(100)
    expect(mockState.balances[mockTxSender]).toBe(900)
    expect(mockState.balances[mockInstitution]).toBe(100)
  })
  
  it("should not allow donation with insufficient funds", () => {
    mockTxSender = mockDonor
    const result = mockContract.makeDonation(mockInstitution, 1000, "Tithe")
    expect(result).toEqual({ type: "err", value: 102 }) // ERR-INSUFFICIENT-FUNDS
    expect(mockContract.getInstitutionTotal(mockInstitution)).toBe(0)
    expect(mockContract.getDonorTotal(mockDonor)).toBe(0)
    expect(mockState.balances[mockDonor]).toBe(500)
  })
})
