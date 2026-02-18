import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, mockAuthenticatedUser } from '../../test/utils';
import Layout from '../Layout';

describe('Layout Component', () => {
  it('renders children content', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="child-content">Test Content</div>
      </Layout>,
      { authValue: mockAuthenticatedUser }
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays tenant name when user is authenticated', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { authValue: mockAuthenticatedUser }
    );

    expect(screen.getByText('Test Cabinet')).toBeInTheDocument();
  });

  it('displays logout button', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { authValue: mockAuthenticatedUser }
    );

    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', async () => {
    const mockLogout = vi.fn();

    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      {
        authValue: {
          ...mockAuthenticatedUser,
          logout: mockLogout,
        }
      }
    );

    const logoutButton = screen.getByText('Déconnexion');
    logoutButton.click();

    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders navigation links', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { authValue: mockAuthenticatedUser }
    );

    // Check for main navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Dossiers')).toBeInTheDocument();
  });

  it('displays LexDoc branding', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { authValue: mockAuthenticatedUser }
    );

    expect(screen.getByText('LexDoc')).toBeInTheDocument();
    expect(screen.getByText('v2.0')).toBeInTheDocument();
  });

  it('displays user name in header', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { authValue: mockAuthenticatedUser }
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('has settings navigation section', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
      { authValue: mockAuthenticatedUser }
    );

    expect(screen.getByText('Paramètres')).toBeInTheDocument();
  });
});
