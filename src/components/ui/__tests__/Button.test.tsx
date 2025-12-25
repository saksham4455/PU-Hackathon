import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
    it('renders button with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('applies primary variant styles by default', () => {
        render(<Button>Primary</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-blue-600');
    });

    it('applies secondary variant styles', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-gray-200');
    });

    it('shows loading state', () => {
        render(<Button isLoading>Loading</Button>);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
        render(<Button isLoading>Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('calls onClick handler', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click</Button>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick} disabled>Click</Button>);

        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders with icon', () => {
        const TestIcon = () => <span data-testid="test-icon">Icon</span>;
        render(<Button icon={<TestIcon />}>With Icon</Button>);

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('applies small size styles', () => {
        render(<Button size="sm">Small</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('applies large size styles', () => {
        render(<Button size="lg">Large</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
});
