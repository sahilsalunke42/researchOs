import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const loginMock = vi.fn();
vi.mock('@/lib/auth', () => ({ login: (...args: unknown[]) => loginMock(...args) }));

describe('LoginPage', () => {
  it('submits credentials and navigates on success', async () => {
    loginMock.mockResolvedValueOnce({ id: '1', email: 'a@b.com', name: 'A', createdAt: 'x' });
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(loginMock).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows inline error on failure', async () => {
    loginMock.mockRejectedValueOnce(Object.assign(new Error('nope'), { code: 'INVALID_CREDENTIALS' }));
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/nope/i)).toBeInTheDocument();
  });
});
