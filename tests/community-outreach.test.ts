import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
let mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockInstitution = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
const mockParticipant = "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"

// Mock state
let mockState = {
  outreachPrograms: {},
  programParticipants: {},
  participantCount: {},
  programIdCounter: 0,
  admin: mockTxSender,
}

// Mock contract functions
const mockContract = {
  isAdmin: () => mockState.admin === mockTxSender,
  createProgram: (name, description, startDate, endDate, institution) => {
    if (!(mockContract.isAdmin() || mockTxSender === institution)) {
      return { type: "err", value: 100 } // ERR-NOT-AUTHORIZED
    }
    const programId = mockState.programIdCounter
    mockState.outreachPrograms[programId] = {
      name,
      description,
      startDate,
      endDate,
      institution,
      active: true,
    }
    mockState.participantCount[programId] = 0
    mockState.programIdCounter++
    return { type: "ok", value: programId }
  },
  updateProgram: (programId, name, description, startDate, endDate) => {
    if (!mockState.outreachPrograms[programId]) {
      return { type: "err", value: 101 } // ERR-PROGRAM-NOT-FOUND
    }
    const institution = mockState.outreachPrograms[programId].institution
    if (!(mockContract.isAdmin() || mockTxSender === institution)) {
      return { type: "err", value: 100 } // ERR-NOT-AUTHORIZED
    }
    mockState.outreachPrograms[programId] = {
      ...mockState.outreachPrograms[programId],
      name,
      description,
      startDate,
      endDate,
    }
    return { type: "ok", value: true }
  },
  endProgram: (programId) => {
    if (!mockState.outreachPrograms[programId]) {
      return { type: "err", value: 101 } // ERR-PROGRAM-NOT-FOUND
    }
    const institution = mockState.outreachPrograms[programId].institution
    if (!(mockContract.isAdmin() || mockTxSender === institution)) {
      return { type: "err", value: 100 } // ERR-NOT-AUTHORIZED
    }
    mockState.outreachPrograms[programId].active = false
    return { type: "ok", value: true }
  },
  joinProgram: (programId) => {
    if (!mockState.outreachPrograms[programId]) {
      return { type: "err", value: 101 } // ERR-PROGRAM-NOT-FOUND
    }
    if (!mockState.outreachPrograms[programId].active) {
      return { type: "err", value: 104 } // ERR-PROGRAM-INACTIVE
    }
    const key = `${programId}-${mockTxSender}`
    if (mockState.programParticipants[key]) {
      return { type: "err", value: 102 } // ERR-ALREADY-PARTICIPATING
    }
    mockState.programParticipants[key] = true
    mockState.participantCount[programId]++
    return { type: "ok", value: true }
  },
  leaveProgram: (programId) => {
    if (!mockState.outreachPrograms[programId]) {
      return { type: "err", value: 101 } // ERR-PROGRAM-NOT-FOUND
    }
    const key = `${programId}-${mockTxSender}`
    if (!mockState.programParticipants[key]) {
      return { type: "err", value: 103 } // ERR-NOT-PARTICIPATING
    }
    delete mockState.programParticipants[key]
    mockState.participantCount[programId]--
    return { type: "ok", value: true }
  },
  getProgramDetails: (programId) => {
    return mockState.outreachPrograms[programId] || null
  },
  isParticipatingInProgram: (programId, participant) => {
    const key = `${programId}-${participant}`
    return !!mockState.programParticipants[key]
  },
  getParticipantCount: (programId) => {
    return mockState.participantCount[programId] || 0
  },
  transferAdmin: (newAdmin) => {
    if (!mockContract.isAdmin()) {
      return { type: "err", value: 100 } // ERR-NOT-AUTHORIZED
    }
    mockState.admin = newAdmin
    return { type: "ok", value: true }
  },
}

describe("Community Outreach Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    mockState = {
      outreachPrograms: {},
      programParticipants: {},
      participantCount: {},
      programIdCounter: 0,
      admin: mockTxSender,
    }
  })
  
  it("should create a new outreach program", () => {
    const result = mockContract.createProgram(
        "Food Drive",
        "Monthly food collection for local shelter",
        1000,
        1030,
        mockInstitution,
    )
    expect(result).toEqual({ type: "ok", value: 0 })
    expect(mockContract.getProgramDetails(0)).toEqual({
      name: "Food Drive",
      description: "Monthly food collection for local shelter",
      startDate: 1000,
      endDate: 1030,
      institution: mockInstitution,
      active: true,
    })
  })
  
  it("should allow institution to create a program", () => {
    mockTxSender = mockInstitution
    const result = mockContract.createProgram(
        "Food Drive",
        "Monthly food collection for local shelter",
        1000,
        1030,
        mockInstitution,
    )
    expect(result).toEqual({ type: "ok", value: 0 })
  })
  
  it("should update a program", () => {
    mockContract.createProgram("Food Drive", "Monthly food collection for local shelter", 1000, 1030, mockInstitution)
    const result = mockContract.updateProgram(0, "Updated Food Drive", "Updated description", 1100, 1130)
    expect(result).toEqual({ type: "ok", value: true })
    expect(mockContract.getProgramDetails(0)).toEqual({
      name: "Updated Food Drive",
      description: "Updated description",
      startDate: 1100,
      endDate: 1130,
      institution: mockInstitution,
      active: true,
    })
  })
  
  it("should end a program", () => {
    mockContract.createProgram("Food Drive", "Monthly food collection for local shelter", 1000, 1030, mockInstitution)
    const result = mockContract.endProgram(0)
    expect(result).toEqual({ type: "ok", value: true })
    expect(mockContract.getProgramDetails(0).active).toBe(false)
  })
  
  it("should join a program", () => {
    mockContract.createProgram("Food Drive", "Monthly food collection for local shelter", 1000, 1030, mockInstitution)
    mockTxSender = mockParticipant
    const result = mockContract.joinProgram(0)
    expect(result).toEqual({ type: "ok", value: true })
    expect(mockContract.isParticipatingInProgram(0, mockParticipant)).toBe(true)
    expect(mockContract.getParticipantCount(0)).toBe(1)
  })
  
  it("should not join an inactive program", () => {
    mockContract.createProgram("Food Drive", "Monthly food collection for local shelter", 1000, 1030, mockInstitution)
    mockContract.endProgram(0)
    mockTxSender = mockParticipant
    const result = mockContract.joinProgram(0)
    expect(result).toEqual({ type: "err", value: 104 }) // ERR-PROGRAM-INACTIVE
  })
  
  it("should leave a program", () => {
    mockContract.createProgram("Food Drive", "Monthly food collection for local shelter", 1000, 1030, mockInstitution)
    mockTxSender = mockParticipant
    mockContract.joinProgram(0)
    const result = mockContract.leaveProgram(0)
    expect(result).toEqual({ type: "ok", value: true })
    expect(mockContract.isParticipatingInProgram(0, mockParticipant)).toBe(false)
    expect(mockContract.getParticipantCount(0)).toBe(0)
  })
})
