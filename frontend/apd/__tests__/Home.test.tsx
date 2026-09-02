import React from 'react';
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Page from '@/app/home/page'

// Create a new QueryClient instance
const queryClient = new QueryClient();

describe('Home Page', () => {
  it('renders user greeting and progress section', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    )
    
    // Check for the user greeting
    const heading = screen.getByText(/Hello/i)
    expect(heading).toBeInTheDocument()

    // Check for the presence of the Progress section
    const progressTitle = screen.getByText(/Progress/i)
    expect(progressTitle).toBeInTheDocument()

    // Check for the presence of the Easy, Medium, and Hard sections
    const easySections = screen.getAllByText(/Easy/i)
    expect(easySections.length).toBeGreaterThan(1)

    const mediumSections = screen.getAllByText(/Medium/i)
    expect(mediumSections.length).toBeGreaterThan(1)

    const hardSections = screen.getAllByText(/Hard/i)
    expect(hardSections.length).toBeGreaterThan(1)
  })
})