import { createFileRoute, redirect } from '@tanstack/react-router';

// Password reset is a link sent by email now (no OTP step); keep the old URL
// working by sending visitors to the start of the flow.
export const Route = createFileRoute('/_public/auth/forgot_/otp')({
  beforeLoad: () => {
    throw redirect({ to: '/auth/forgot' });
  },
});
