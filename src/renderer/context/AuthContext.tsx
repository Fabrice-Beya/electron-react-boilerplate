import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceFactory } from '../../services/ServiceFactory';
import { AuthResponse, RefreshOptions, UserData } from '../../types';

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    error: string | null;
    register: (email: string, password: string, name?: string) => Promise<AuthResponse>;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<AuthResponse>;
    checkUser: (options?: RefreshOptions) => Promise<void>;
    refreshUser: (options?: RefreshOptions) => Promise<void>;
    authRefreshing: boolean;
    updateProfile: (data: { name: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authRefreshing, setAuthRefreshing] = useState(false);

    const serviceFactory = ServiceFactory.getInstance();
    const authService = serviceFactory.getAuthService();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async (options?: RefreshOptions) => {
        try {
            setLoading(true);
            setAuthRefreshing(true);
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            console.error('Error checking user:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
            setAuthRefreshing(false);
        }
    };

    const refreshUser = async (options?: RefreshOptions) => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            console.error('Error refreshing user:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            setError(null);
            const userData = await authService.login({ email, password });
            if (!userData) {
                throw new Error('Failed to login');
            }
            setUser(userData);
            return { success: true, error: null };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to login');
            return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
        }
    };

    const register = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            setError(null);
            const userData = await authService.register({ email, password });
            if (!userData) {
                throw new Error('Failed to register');
            }
            await checkUser();
            return { success: true, error: null };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to register');
            return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
        }
    };

    const logout = async (): Promise<AuthResponse> => {
        try {
            setError(null);
            const response = await authService.logout();
            if (!response.success) {
                throw new Error(response.error || 'Failed to logout');
            }
            setUser(null);
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to logout');
            return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
        }
    };

    const updateProfile = async (data: { name: string }) => {
        try {
            setError(null);
            const response = await authService.updateUserName(data.name);
            if (!response.success) {
                throw new Error(response.error || 'Failed to update profile');
            }
            
            // Refresh user data
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
            throw err;
        }
    };

    const value = {
        user,
        loading,
        error,
        register,
        login,
        logout,
        checkUser,
        refreshUser,
        authRefreshing,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 