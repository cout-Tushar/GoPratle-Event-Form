import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RequirementWizard } from './RequirementWizard';

import { createRequirement } from '@/lib/api';

vi.mock('@/lib/api', () => ({ createRequirement: vi.fn() }));

describe('requirement wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates basics, advances, and preserves entered event values', async () => {
    render(<RequirementWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(
      (await screen.findAllByText('This field is required.')).length,
    ).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Event name'), { target: { value: 'Garden wedding' } });
    fireEvent.change(screen.getByLabelText('Event type'), { target: { value: 'Wedding' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2027-08-01' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2027-08-01' } });
    fireEvent.change(screen.getByLabelText('City or location'), { target: { value: 'Pune' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(await screen.findByText('Event planner requirements')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByLabelText('Event name')).toHaveValue('Garden wedding');
  });

  it('switches categories and renders only matching fields', async () => {
    render(<RequirementWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Performer/ }));

    expect(screen.getByRole('button', { name: /Performer/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByLabelText('Expected guest count')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Event name'), { target: { value: 'Live show' } });
    fireEvent.change(screen.getByLabelText('Event type'), { target: { value: 'Concert' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2027-09-12' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2027-09-12' } });
    fireEvent.change(screen.getByLabelText('City or location'), { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(await screen.findByLabelText('Performance type')).toBeInTheDocument();
    expect(screen.queryByLabelText('Expected guest count')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    fireEvent.click(screen.getByRole('button', { name: /Event planner/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(await screen.findByLabelText('Expected guest count')).toBeInTheDocument();
    expect(screen.queryByLabelText('Performance type')).not.toBeInTheDocument();
  });

  const reachReview = () => {
    render(<RequirementWizard />);
    fireEvent.change(screen.getByLabelText('Event name'), { target: { value: 'Launch party' } });
    fireEvent.change(screen.getByLabelText('Event type'), { target: { value: 'Corporate' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2027-09-12' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2027-09-12' } });
    fireEvent.change(screen.getByLabelText('City or location'), { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    fireEvent.click(screen.getByLabelText('Event planning'));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
  };

  it('shows success only after the backend confirms the saved requirement', async () => {
    vi.mocked(createRequirement).mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        id: 'abc123',
        category: 'planner',
        status: 'submitted',
        createdAt: '2027-01-01T00:00:00.000Z',
      },
    });
    reachReview();
    fireEvent.click(screen.getByRole('button', { name: /Submit requirement/i }));

    expect(await screen.findByText('Your event is taking shape.')).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(createRequirement).toHaveBeenCalledOnce();
  });

  it('shows a useful message when the API rejects a submission', async () => {
    vi.mocked(createRequirement).mockRejectedValueOnce(new Error('Service unavailable'));
    reachReview();
    fireEvent.click(screen.getByRole('button', { name: /Submit requirement/i }));

    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Your event is taking shape.')).not.toBeInTheDocument();
  });

  it('disables repeat submissions while the first request is pending', async () => {
    let confirm!: (value: {
      success: true;
      message: string;
      data: {
        id: string;
        category: 'planner';
        status: 'submitted';
        createdAt: string;
      };
    }) => void;

    vi.mocked(createRequirement).mockReturnValueOnce(
      new Promise(resolve => {
        confirm = resolve;
      }),
    );
    reachReview();

    const submit = screen.getByRole('button', { name: /Submit requirement/i });
    fireEvent.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());
    fireEvent.click(submit);
    expect(createRequirement).toHaveBeenCalledOnce();

    confirm({
      success: true,
      message: 'ok',
      data: {
        id: 'abc123',
        category: 'planner',
        status: 'submitted',
        createdAt: '2027-01-01T00:00:00.000Z',
      },
    });

    expect(await screen.findByText('Your event is taking shape.')).toBeInTheDocument();
  });
});
