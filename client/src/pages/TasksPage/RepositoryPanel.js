import React, { useState, useEffect, useContext } from 'react';
import {TaskRepository} from '../../components';
import {TemplateList} from '../../components';
import {BlankCardRepository} from '../../components';
import { LayoutList, Clock, Vault, Award, FileText, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { Modal } from '../../components/base/Modal';

const RepositoryPanel = ({
    tasks,
    cards = [],
    onComplete,
    onDelete,
    onEdit,
    onEquip,
    onExpand,
    isExpanded
}) => {
    const [activeTab, setActiveTab] = useState('store');
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [deletingTemplate, setDeletingTemplate] = useState(null);
    const [templateFormData, setTemplateFormData] = useState({
        title: '',
        description: '',
        type: 'short',
        category: 'default',
        subTasks: []
    });
    const { user } = useContext(AuthContext);

    // 获取模板列表
    const fetchTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const { data } = await axios.get('/api/templates', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoadingTemplates(false);
        }
    };

    // 当切换到模板标签页时加载模板
    useEffect(() => {
        if (activeTab === 'template' && user?.token) {
            fetchTemplates();
        }
    }, [activeTab, user?.token]);

    // Processing template selection (create task)
    const handleTemplateSelect = (template) => {
        // 使用onEdit来触发CreateTaskModal，并预填模板数据
        if (onEdit) {
            const templateData = {
                ...template,
                _id: undefined, // 清除模板ID，这样会创建新任务而不是编辑模板
                status: undefined, // 清除状态
                equipped: undefined, // 清除装备状态
                cardUsed: undefined, // 清除使用的卡片
                dueDate: template.type === 'short' ? 
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19) : 
                    undefined, // 如果是短期任务，设置24小时后的截止时间
                isFromTemplate: true // 标记这是从模板创建的任务
            };
            console.log('Creating task from template:', templateData);
            onEdit(templateData);
        }
    };

    // 处理模板删除
    const handleTemplateDelete = async (template) => {
        setDeletingTemplate(template);
    };

    // 确认删除模板
    const confirmDeleteTemplate = async () => {
        try {
            await axios.delete(`/api/templates/${deletingTemplate._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            toast.success('Template deleted successfully');
            setDeletingTemplate(null);
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    // 处理编辑模板
    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setTemplateFormData({
            title: template.title,
            description: template.description || '',
            type: template.type,
            category: template.category,
            subTasks: template.subTasks || []
        });
        setShowTemplateForm(true);
    };

    // 处理创建或更新模板
    const handleSubmitTemplate = async (e) => {
        e.preventDefault();
        try {
            if (!templateFormData.title.trim()) {
                toast.error('Title is required');
                return;
            }

            if (editingTemplate) {
                // 更新模板
                await axios.put(`/api/templates/${editingTemplate._id}`, templateFormData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                toast.success('Template updated successfully');
            } else {
                // 创建新模板
                await axios.post('/api/templates', templateFormData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                toast.success('Template created successfully');
            }

            setShowTemplateForm(false);
            setEditingTemplate(null);
            setTemplateFormData({
                title: '',
                description: '',
                type: 'short',
                category: 'default',
                subTasks: []
            });
            fetchTemplates();
        } catch (error) {
            console.error('Error submitting template:', error);
            toast.error(editingTemplate ? 'Failed to update template' : 'Failed to create template');
        }
    };

    return (
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 border-2 border-amber-300 backdrop-blur-sm h-full relative">
            {/* 展开/收起按钮 */}
            <button
                onClick={() => onExpand(!isExpanded)}
                className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-amber-500 text-white rounded-full p-1 shadow-lg hover:bg-amber-600 transition-colors duration-200 z-10"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isExpanded ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                    />
                </svg>
            </button>

            {/* 标题与标签同一行 */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-amber-900 flex items-center truncate">
                    <Vault className="h-6 w-6 mr-2 flex-shrink-0" />
                    <span className="truncate">Task Library</span>
                </h2>
                <div className="flex space-x-2 flex-shrink-0">
                    {[
                        { id: 'store', icon: <Vault size={18} />, label: 'Vault' },
                        { id: 'blank', icon: <Award size={18} />, label: 'Rewards' },
                        { id: 'template', icon: <FileText size={18} />, label: 'Template' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-md flex flex-col items-center transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? 'text-amber-600 bg-amber-50 font-semibold'
                                    : 'text-gray-500 hover:text-amber-500 hover:bg-amber-50'
                            }`}
                            title={tab.label}
                        >
                            {tab.icon}
                            <span className="text-xs mt-1">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 内容区域 */}
            <div className="mt-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                {activeTab === 'store' && (
                    <TaskRepository
                        tasks={tasks}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onEquip={onEquip}
                        isExpanded={isExpanded}
                    />
                )}
                {activeTab === 'blank' && (
                    <BlankCardRepository cards={cards} />
                )}
                {activeTab === 'template' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-gray-500">
                                Create and manage your task templates
                            </div>
                            <button
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateFormData({
                                        title: '',
                                        description: '',
                                        type: 'short',
                                        category: 'default',
                                        subTasks: []
                                    });
                                    setShowTemplateForm(true);
                                }}
                                className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-500 
                                text-white rounded-full hover:from-amber-500 hover:to-amber-600 transition-all duration-200 
                                shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                                title="Create Template"
                            >
                                <Plus className="h-6 w-6" strokeWidth={2.5} />
                            </button>
                        </div>
                        {loadingTemplates ? (
                            <div className="text-center py-4">Loading templates...</div>
                        ) : (
                            <TemplateList
                                templates={templates}
                                onSelect={handleTemplateSelect}
                                onEdit={handleEditTemplate}
                                onDelete={handleTemplateDelete}
                            />
                        )}
                    </>
                )}
            </div>

            {/* 删除确认模态框 */}
            <Modal
                isOpen={!!deletingTemplate}
                onClose={() => setDeletingTemplate(null)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                            Are you sure you want to delete this template?
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            {deletingTemplate?.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            This action cannot be undone
                        </p>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setDeletingTemplate(null)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteTemplate}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            {/* 创建/编辑模板的模态框 */}
            <Modal
                isOpen={showTemplateForm}
                onClose={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                    setTemplateFormData({
                        title: '',
                        description: '',
                        type: 'short',
                        category: 'default',
                        subTasks: []
                    });
                }}
                title={editingTemplate ? "Edit Template" : "Create Template"}
            >
                <form onSubmit={handleSubmitTemplate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={templateFormData.title}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={templateFormData.description}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={templateFormData.type}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, type: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        >
                            <option value="short">Short Term</option>
                            <option value="long">Long Term</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                            type="text"
                            value={templateFormData.category}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowTemplateForm(false);
                                setEditingTemplate(null);
                                setTemplateFormData({
                                    title: '',
                                    description: '',
                                    type: 'short',
                                    category: 'default',
                                    subTasks: []
                                });
                            }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                            {editingTemplate ? 'Save' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RepositoryPanel;
