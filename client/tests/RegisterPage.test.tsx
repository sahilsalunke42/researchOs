import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/(auth)/register/page';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const registerMock = vi.fn();
vi.mock('@/lib/auth', () => ({ register: (...args: unknown[]) => registerMock(...args) }));

describe('RegisterPage', () => {
  it('submits and navigates on success', async () => {
    registerMock.mockResolvedValueOnce({ id: '1', email: 'a@b.com', name: 'A', createdAt: 'x' });
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(registerMock).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123', name: 'Alice' });
    expect(push).toHaveBeenCalledWith('/dashboard');
  });
});
