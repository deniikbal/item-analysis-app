import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';

export const validateRequest = async () => {
  const request = {
    headers: {
      get: (name: string) => {
        const cookieStore = cookies();
        if (name.toLowerCase() === 'cookie') {
          return cookieStore.toString();
        }
        return null;
      },
    },
  } as const;

  const authRequest = auth.handleRequest({
    request,
    cookies,
  });

  return await authRequest.validateUser();
};