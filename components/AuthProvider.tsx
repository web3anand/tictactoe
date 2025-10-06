import { PrivyProvider } from '@privy-io/react-auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpuaqm120006l708r1u2niv7'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#0052FF',
        },
        loginMethods: ['google', 'twitter', 'email'],
      }}
    >
      {children}
    </PrivyProvider>
  );
}