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
        type: '短期',
        category: 'default',
        subTasks: []
    });

    // 获取模板列表
    const fetchTemplates = async () => {
        try {
            const { data } = await axios.get('/api/templates');
            console.log('Fetched templates:', data);
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('获取模板列表失败');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await axios.put(`/api/templates/${editingTemplate._id}`, formData);
                toast.success('模板更新成功');
            } else {
                await axios.post('/api/templates', formData);
                toast.success('模板创建成功');
            }
            setShowForm(false);
            setEditingTemplate(null);
            setFormData({
                title: '',
                description: '',
                type: '短期',
                category: 'default',
                subTasks: []
            });
            fetchTemplates();
        } catch (error) {
            console.error('Error submitting template:', error);
            toast.error(editingTemplate ? '更新模板失败' : '创建模板失败');
        }
    };

    // 处理模板编辑
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

    // 处理模板删除
    const handleDelete = async (template) => {
        if (window.confirm('确定要删除这个模板吗？')) {
            try {
                await axios.delete(`/api/templates/${template._id}`);
                toast.success('模板删除成功');
                fetchTemplates();
            } catch (error) {
                console.error('Error deleting template:', error);
                toast.error('删除模板失败');
            }
        }
    };

    // 处理模板选择
    const handleSelect = (template) => {
        // TODO: 实现从模板创建任务的功能
        console.log('Selected template:', template);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">任务模板</h1>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setFormData({
                            title: '',
                            description: '',
                            type: '短期',
                            category: 'default',
                            subTasks: []
                        });
                        setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    创建模板
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8">加载中...</div>
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
                title={editingTemplate ? '编辑模板' : '创建模板'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">标题</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">描述</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">类型</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="短期">短期</option>
                            <option value="长期">长期</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">分类</label>
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
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {editingTemplate ? '更新' : '创建'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TemplatePage; 