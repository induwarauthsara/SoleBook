import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from '@simplewebauthn/types';

const rpName = 'SoleBook';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const rpOrigin = process.env.WEBAUTHN_RP_ORIGIN || 'http://localhost:3000';

export interface StoredCredential {
  credentialID: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
  deviceName?: string;
}

export async function getRegistrationOptions(
  userId: string,
  userEmail: string,
  existingCredentials: StoredCredential[] = []
) {
  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: userEmail,
    userDisplayName: userEmail,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.credentialID,
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
}

export async function verifyRegistration(
  response: any,
  expectedChallenge: string
): Promise<VerifiedRegistrationResponse> {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rpOrigin,
    expectedRPID: rpID,
  });
}

export async function getAuthenticationOptions(
  credentials: StoredCredential[] = []
) {
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((cred) => ({
      id: cred.credentialID,
      transports: cred.transports,
    })),
    userVerification: 'preferred',
  });
}

export async function verifyAuthentication(
  response: any,
  expectedChallenge: string,
  credential: StoredCredential
) {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rpOrigin,
    expectedRPID: rpID,
    credential: {
      id: credential.credentialID,
      publicKey: Buffer.from(credential.publicKey, 'base64url'),
      counter: credential.counter,
      transports: credential.transports,
    },
  });
}
