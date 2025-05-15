import React, { useState, useEffect } from 'react';
import { TemplateList } from '../../components/task/TemplateList';
import { Modal } from '../../components/base/Modal';
import axios from 'axios';
import { toast } from 'react-toastify';

const TemplatePage = () => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'short',
        category: 'default',
        subTasks: []
    });

    // Get Template List
    const fetchTemplates = async () => {
        try {
            const { data } = await axios.get('/api/templates');
            console.log('Fetched templates:', data);
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error(error.response?.data?.message || 'Failed to Retrieve Template List');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Handling form submissions
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.title.trim()) {
                toast.error('Title is required');
                return;
            }

            if (editingTemplate) {
                await axios.put(`/api/templates/${editingTemplate._id}`, formData);
                toast.success('Template Updated Successfully');
            } else {
                await axios.post('/api/templates', formData);
                toast.success('Template Created Successfully');
            }
            setShowForm(false);
            setEditingTemplate(null);
            setFormData({
                title: '',
                description: '',
                type: 'short',
                category: 'default',
                subTasks: []
            });
            fetchTemplates();
        } catch (error) {
            console.error('Error submitting template:', error);
            toast.error(error.response?.data?.message || (editingTemplate ? 'Failed to Update Template' : 'Failed to Create Template'));
        }
    };

    // Processing template editing
    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            title: template.title,
            description: template.description || '',
            type: template.type,
            category: template.category,
            subTasks: template.subTasks || []
        });
        setShowForm(true);
    };

    // Processing template deletion
    const handleDelete = async (template) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await axios.delete(`/api/templates/${template._id}`);
                toast.success('Template Deleted Successfully');
                fetchTemplates();
            } catch (error) {
                console.error('Error deleting template:', error);
                toast.error(error.response?.data?.message || 'Failed to Delete Template');
            }
        }
    };

    // Processing template selection
    const handleSelect = (template) => {
        // TODO: Implement the ability to create tasks from templates
        console.log('Selected template:', template);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quest Template</h1>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setFormData({
                            title: '',
                            description: '',
                            type: 'short',
                            category: 'default',
                            subTasks: []
                        });
                        setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Create Template
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <TemplateList
                    templates={templates}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            <Modal
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
                }}
                title={editingTemplate ? 'Edit Template' : 'Create Template'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="short">short</option>
                            <option value="long">long</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingTemplate(null);
                            }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {editingTemplate ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TemplatePage; 