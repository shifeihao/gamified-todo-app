// src/components/TemplateList.js
import React from 'react';

export const TemplateList = ({ templates = [], onSelect }) => {
    return (
        <div className="space-y-4">
            {templates.length === 0 ? (
                <p className="text-gray-500">No template yet</p>
            ) : (
                templates.map(template => (
                    <div
                        key={template._id || template.id}
                        className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSelect && onSelect(template)}
                    >
                        <h3 className="font-semibold">{template.title}</h3>
                        {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};