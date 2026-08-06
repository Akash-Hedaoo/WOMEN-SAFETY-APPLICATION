import React from 'react';
import FormInput from './FormInput';

export default function EmergencyContactSection({ contactName, setContactName, contactPhone, setContactPhone }) {
    return (
        <div className="premium-panel p-5 mt-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-violet-300 text-sm">contact_emergency</span>
                <h4 className="font-label font-semibold text-white text-sm">Primary Emergency Contact</h4>
            </div>
            <div className="space-y-4">
                <FormInput
                    id="contactName"
                    type="text"
                    placeholder="Contact Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                />
                <FormInput
                    id="contactPhone"
                    type="tel"
                    placeholder="Phone Number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                />
            </div>
        </div>
    );
}
