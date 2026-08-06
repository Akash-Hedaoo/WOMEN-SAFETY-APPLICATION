import React from 'react';
import Button from '../Common/Button';

export default function SubmitButton({ children, onClick, disabled }) {
    return (
        <Button
            type="submit"
            variant="primary"
            className="w-full mt-4 h-12 flex justify-center items-center"
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}
