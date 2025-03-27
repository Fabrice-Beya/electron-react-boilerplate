import React, { useEffect } from 'react';
import { useEnvStore, EnvStore } from '../store/envStore';

const EnvInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializeFromWindowEnv = useEnvStore((state: EnvStore) => state.initializeFromWindowEnv);

  useEffect(() => {
    initializeFromWindowEnv();
  }, [initializeFromWindowEnv]);

  return <>{children}</>;
};

export default EnvInitializer; 