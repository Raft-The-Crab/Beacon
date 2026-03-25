import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { Button, Input, Card } from '../components/ui';
import styles from '../styles/modules/pages/Login.module.css';

export const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.resetPassword({ token, newPassword });
            if (response.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(response.error || 'Failed to reset password.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <Card className={styles.loginCard}>
                    <div className={styles.header}>
                        <h1>Success!</h1>
                        <p>Your password has been reset. Redirecting you to login...</p>
                    </div>
                    <Button variant="primary" onClick={() => navigate('/login')} className={styles.submitBtn}>
                        Go to Login
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Card className={styles.loginCard}>
                <div className={styles.header}>
                    <h1>Reset Password</h1>
                    <p>Enter your new password below to regain access to your account.</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorBanner}>{error}</div>}
                    
                    <div className={styles.formGroup}>
                        <label>New Password</label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Confirm Password</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your new password"
                            required
                        />
                    </div>

                    <Button 
                        type="submit" 
                        variant="primary" 
                        loading={isLoading}
                        className={styles.submitBtn}
                    >
                        Update Password
                    </Button>
                </form>
            </Card>
        </div>
    );
};
