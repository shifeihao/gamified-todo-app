// src/components/TemplateList.js
import React from 'react';
import { motion } from 'framer-motion';

export const TemplateList = ({ templates = [], onSelect, onDelete, onEdit }) => {
    return (
        <div className="space-y-4">
            {templates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无模板</p>
            ) : (
                templates.map(template => (
                    <motion.div
                        key={template._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer bg-white shadow-sm"
                    >
                        <div className="flex justify-between items-start">
                            <div 
                                className="flex-1"
                                onClick={() => onSelect && onSelect(template)}
                            >
                                <h3 className="font-semibold text-gray-900">{template.title}</h3>
                                {template.description && (
                                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                        {template.type}
                                    </span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                        {template.category}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit && onEdit(template)}
                                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onDelete && onDelete(template)}
                                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    );
};