# Blockchain-Based Religious Community Management System

This project implements a set of smart contracts for managing religious communities on the blockchain. The system provides functionality for institution verification, member management, event coordination, donation management, and community outreach programs.

## Overview

The system consists of five main contracts:

1. **Institution Verification Contract**: Validates and manages religious institutions on the blockchain
2. **Member Management Contract**: Manages community members, their roles, and affiliations
3. **Event Coordination Contract**: Coordinates religious events, services, and attendee registrations
4. **Donation Management Contract**: Manages religious donations and tithes
5. **Community Outreach Contract**: Coordinates community outreach programs and participation

## Contracts

### Institution Verification Contract

This contract validates religious institutions on the blockchain:

- Stores verified institutions and their details
- Allows admin to add/remove institutions
- Provides functions to check institution verification status

### Member Management Contract

This contract manages religious community members:

- Stores member information and profiles
- Allows institutions to add/remove members
- Provides functions to update member status and profiles

### Event Coordination Contract

This contract coordinates religious events and services:

- Stores event information
- Allows institutions to create/update/cancel events
- Provides functions for members to register for events

### Donation Management Contract

This contract manages religious donations and tithes:

- Tracks donations made to institutions
- Allows members to make donations
- Provides functions to view donation history and totals

### Community Outreach Contract

This contract coordinates community outreach programs:

- Stores outreach program information
- Allows institutions to create/update/end programs
- Provides functions for members to join/leave programs

## Testing

The project includes comprehensive tests for each contract using Vitest. The tests cover all major functionality and edge cases.

## Getting Started

1. Clone the repository
2. Review the contract files in the `contracts` directory
3. Run the tests to verify functionality

## Usage

Each contract provides public functions that can be called by users or other contracts. The contracts use a permission system to ensure that only authorized users can perform certain actions.

## Security

The contracts implement security measures
