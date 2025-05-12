import React, { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ReactDOM from 'react-dom';

export const TaskCalendar = ({ tasks }) => {
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [hoverInfo, setHoverInfo] = useState({ visible: false, date: null, tasks: [], position: { top: 0, left: 0 } });
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const calendarRef = useRef(null);
    const hoverTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    
    // 监听窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        
        window.addEventListener('resize', handleResize);
        
        // 初始渲染后强制更新日历大小
        if (calendarRef.current && calendarRef.current.getApi) {
            setTimeout(() => {
                const api = calendarRef.current.getApi();
                api.updateSize();
            }, 100);
        }
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    // 当窗口大小改变时，更新日历大小
    useEffect(() => {
        if (calendarRef.current && calendarRef.current.getApi) {
            const api = calendarRef.current.getApi();
            api.updateSize();
        }
    }, [windowSize]);
    
    // 修复日期处理，确保日期不会偏移
    const normalizeDate = (dateString) => {
        // 将日期字符串解析为YYYY-MM-DD格式
        if (!dateString) return null;
        
        // 首先尝试从ISO格式提取日期部分
        let dateOnlyStr = dateString;
        if (dateString.includes('T')) {
            dateOnlyStr = dateString.split('T')[0];
        }
        
        // 创建日期对象，确保使用正确的时区
        const [year, month, day] = dateOnlyStr.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    };
    
    // 比较两个日期是否是同一天（使用UTC比较）
    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getUTCFullYear() === d2.getUTCFullYear() &&
               d1.getUTCMonth() === d2.getUTCMonth() &&
               d1.getUTCDate() === d2.getUTCDate();
    };
    
    // 获取日期的YYYY-MM-DD格式字符串（UTC基准）
    const formatDateToYYYYMMDD = (date) => {
        if (!date) return '';
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    };
    
    // 处理事件，确保日期正确
    const processEvents = useCallback((tasks) => {
        const longTasks = tasks.filter(task => task.type === 'long' && task.equipped);
        const palette = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
        
        console.log("处理任务列表:", longTasks);
        
        return longTasks.flatMap((task, idx) => {
            const baseColor = palette[task.slotPosition % palette.length] || '#1e3a8a';
            const items = [];

            if (task.subTasks && task.subTasks.length > 0) {
                task.subTasks.forEach((sub, i) => {
                    if (sub.dueDate) {
                        // 规范化日期，确保不会有偏移
                        const normalizedDate = normalizeDate(sub.dueDate);
                        
                        if (normalizedDate) {
                            const formattedDate = formatDateToYYYYMMDD(normalizedDate);
                            console.log(`子任务 "${sub.title}" 原始日期: ${sub.dueDate}, 规范化后: ${formattedDate}`);
                            
                            items.push({
                                id: `${task._id}-sub-${i}`,
                                title: '',
                                start: formattedDate, // 使用格式化的日期字符串而不是Date对象
                                allDay: true,
                                display: 'background',
                                backgroundColor: 'transparent',
                                extendedProps: {
                                    type: 'Sub task',
                                    subTaskTitle: sub.title,
                                    parentTitle: task.title,
                                    status: sub.status ?? task.status,
                                    color: baseColor,
                                    rawDate: formattedDate,
                                    originalDate: sub.dueDate
                                }
                            });
                        } else {
                            console.log(`子任务日期解析失败: ${sub.dueDate}`);
                        }
                    }
                });
            }

            return items;
        });
    }, []);

    useEffect(() => {
        const events = processEvents(tasks);
        setCalendarEvents(events);
    }, [tasks, processEvents]);

    // 获取特定日期的所有任务
    const getTasksForDate = useCallback((date) => {
        // 获取日期的标准格式用于比较
        const dateStr = formatDateToYYYYMMDD(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
        
        console.log(`查找日期 ${dateStr} 的任务`);
        
        return calendarEvents.filter(event => {
            // 使用标准化的日期字符串进行比较
            return event.extendedProps.rawDate === dateStr;
        }).map(event => ({
            id: event.id,
            title: event.extendedProps.subTaskTitle,
            parentTitle: event.extendedProps.parentTitle,
            type: event.extendedProps.type,
            status: event.extendedProps.status,
            color: event.extendedProps.color,
            originalDate: event.extendedProps.originalDate
        }));
    }, [calendarEvents]);

    // 处理日期单元格的鼠标事件
    const handleDayCellMouseEnter = (info) => {
        const date = info.date;
        const tasksForDate = getTasksForDate(date);
        
        if (tasksForDate.length > 0) {
            // 计算弹出框位置
            const rect = info.el.getBoundingClientRect();
            const calendarRect = calendarRef.current.elRef.current.getBoundingClientRect();
            
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            
            hoverTimeoutRef.current = setTimeout(() => {
                setHoverInfo({
                    visible: true,
                    date: date,
                    tasks: tasksForDate,
                    position: {
                        top: rect.bottom - calendarRect.top,
                        left: rect.left - calendarRect.left + rect.width / 2
                    }
                });
            }, 100);
        }
    };

    const handleDayCellMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        
        hoverTimeoutRef.current = setTimeout(() => {
            setHoverInfo(prev => ({ ...prev, visible: false }));
        }, 300);
    };

    const handleHoverInfoMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    const handleHoverInfoMouseLeave = () => {
        setHoverInfo(prev => ({ ...prev, visible: false }));
    };

    // 日期单元格内容渲染
    const dayCellContent = useCallback((info) => {
        // 使用UTC日期格式进行比较
        const dateStr = formatDateToYYYYMMDD(new Date(Date.UTC(info.date.getFullYear(), info.date.getMonth(), info.date.getDate())));
        
        // 找出当天所有任务
        const dayTasks = calendarEvents.filter(event => {
            return event.extendedProps.rawDate === dateStr;
        });
        
        // 按颜色分组任务
        const tasksByColor = {};
        dayTasks.forEach(task => {
            const color = task.extendedProps.color;
            if (!tasksByColor[color]) {
                tasksByColor[color] = [];
            }
            tasksByColor[color].push(task);
        });
        
        return (
            <div className="fc-daygrid-day-top">
                <span className="fc-daygrid-day-number">{info.dayNumberText}</span>
                <div className="task-dots-container">
                    {Object.keys(tasksByColor).map((color, idx) => (
                        tasksByColor[color].map((task, taskIdx) => (
                            <div
                                key={`${idx}-${taskIdx}`}
                                className="task-dot"
                                style={{ backgroundColor: color }}
                            />
                        ))
                    ))}
                </div>
            </div>
        );
    }, [calendarEvents]);

    useEffect(() => {
        // 当日历组件挂载后，为每个日期单元格添加事件监听器
        const addDateCellListeners = () => {
            if (calendarRef.current) {
                const dayCells = calendarRef.current.elRef.current.querySelectorAll('.fc-daygrid-day');
                
                dayCells.forEach((cell) => {
                    // 提取日期
                    const dateAttr = cell.getAttribute('data-date');
                    if (dateAttr) {
                        cell.addEventListener('mouseenter', (e) => {
                            const date = new Date(dateAttr);
                            handleDayCellMouseEnter({ date, el: cell });
                        });
                        
                        cell.addEventListener('mouseleave', handleDayCellMouseLeave);
                    }
                });
            }
        };
        
        // 等待日历渲染完成
        setTimeout(addDateCellListeners, 100);
        
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [calendarEvents]);

    // 使用一个单独的组件来渲染悬停信息，这样可以挂载到body上
    const HoverInfoPortal = () => {
        if (!hoverInfo.visible || hoverInfo.tasks.length === 0) return null;
        
        // 计算绝对位置，而不是相对于日历容器的位置
        let absolutePosition = { top: 0, left: 0 };
        
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            absolutePosition = {
                top: rect.top + hoverInfo.position.top + window.scrollY,
                left: rect.left + hoverInfo.position.left + window.scrollX
            };
        }
        
        return ReactDOM.createPortal(
            <div 
                className="hover-task-info-portal"
                style={{
                    position: 'fixed',
                    top: `${absolutePosition.top}px`,
                    left: `${absolutePosition.left}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 9999999
                }}
                onMouseEnter={handleHoverInfoMouseEnter}
                onMouseLeave={handleHoverInfoMouseLeave}
            >
                <div className="hover-task-info-content">
                    <div className="hover-task-info-header">
                        {hoverInfo.date && (
                            <span>{`${hoverInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} Tasks:`}</span>
                        )}
                    </div>
                    <div className="hover-task-info-body">
                        {hoverInfo.tasks.map((task, idx) => (
                            <div
                                key={idx}
                                className="hover-task-item"
                                style={{ borderLeft: `3px solid ${task.color}` }}
                            >
                                <div className="flex flex-col">
                                    <span className="hover-task-title">{task.title}</span>
                                    <span className="hover-task-parent">Main task: {task.parentTitle}</span>
                                </div>
                                <div className="hover-task-status">
                                    {task.status === 'completed' ? (
                                        <span title="completed" className="completed-icon">✅</span>
                                    ) : (
                                        <span title="in process" className="in-process-icon">⏳</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="w-full flex flex-col relative" ref={containerRef}>
            <div className="fullcalendar-container">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: ''
                    }}
                    height="auto"
                    events={calendarEvents}
                    dayCellContent={dayCellContent}
                    contentHeight="auto"
                    fixedWeekCount={false}
                    aspectRatio={1.5}
                    themeSystem="standard"
                    timeZone="UTC"
                    windowResize={() => {
                        if (calendarRef.current && calendarRef.current.getApi) {
                            setTimeout(() => {
                                const api = calendarRef.current.getApi();
                                api.updateSize();
                            }, 0);
                        }
                    }}
                />
            </div>
            
            {/* 使用Portal渲染悬停信息 */}
            <HoverInfoPortal />

            <style>
                {`
                .fullcalendar-container {
                    width: 100%;
                    font-size: 0.85rem;
                    overflow: hidden;
                }
                .fc {
                    max-width: 100%;
                    min-width: 250px;
                }
                .fc .fc-toolbar-title {
                    font-size: clamp(0.8rem, 1.8vw, 1rem);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .fc button {
                    font-size: clamp(0.65rem, 1.2vw, 0.75rem);
                    padding: 0.2rem 0.4rem;
                    height: auto;
                }
                .fc .fc-daygrid-day.fc-day-today {
                    background-color: rgba(191, 219, 254, 0.3) !important;
                }
                .fc-daygrid-day-frame {
                    min-height: 2.5rem;
                    padding: 0 !important;
                }
                .fc-header-toolbar {
                    margin-bottom: 0.5rem !important;
                    flex-wrap: wrap;
                    row-gap: 0.5rem;
                    padding-top: 0.25rem;
                    padding-bottom: 0.25rem;
                    height: auto;
                    min-height: auto;
                }
                .fc-toolbar-chunk {
                    display: flex;
                    align-items: center;
                }
                .fc-today-button {
                    text-transform: lowercase;
                    font-variant: small-caps;
                    height: 1.7rem !important;
                    line-height: 1 !important;
                }
                .fc-prev-button, .fc-next-button {
                    width: 1.7rem !important;
                    height: 1.7rem !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                @media (max-width: 480px) {
                    .fc-header-toolbar {
                        flex-direction: column;
                        align-items: center;
                    }
                    .fc-direction-ltr .fc-toolbar > * > :not(:first-child) {
                        margin-left: 0.25em;
                    }
                }
                .fc-theme-standard .fc-scrollgrid {
                    border-color: #e5e7eb;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                    border-color: #e5e7eb;
                }
                .fc-col-header-cell {
                    padding: 0.375rem 0;
                    background-color: #f3f4f6;
                    color: #4b5563;
                    font-size: clamp(0.7rem, 1.8vw, 0.8rem);
                }
                .fc-daygrid-day-number {
                    color: #1f2937;
                    font-weight: 500;
                    padding: 0.25rem !important;
                    font-size: clamp(0.7rem, 1.8vw, 0.85rem);
                }
                .task-dots-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 2px;
                    padding-top: 2px;
                    justify-content: center;
                }
                .task-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .fc-dayGridMonth-view .fc-daygrid-day-top {
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 0 !important;
                }
                
                /* 悬停信息样式 */
                .hover-task-info-portal {
                    z-index: 9999999;
                }
                .hover-task-info-content {
                    width: 280px;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                }
                .hover-task-info-content:before {
                    content: '';
                    position: absolute;
                    top: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 0 8px 8px;
                    border-style: solid;
                    border-color: transparent transparent white;
                    z-index: 1;
                }
                .hover-task-info-header {
                    padding: 8px 12px;
                    background-color: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #374151;
                }
                .hover-task-info-body {
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 8px 0;
                }
                .hover-task-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    border-bottom: 1px solid #f3f4f6;
                    background-color: white;
                }
                .hover-task-item:last-child {
                    border-bottom: none;
                }
                .hover-task-title {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1f2937;
                }
                .hover-task-parent {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin-top: 2px;
                }
                .hover-task-status {
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                }
                .completed-icon {
                    color: #10b981;
                }
                .in-process-icon {
                    color: #f59e0b;
                }
                `}
            </style>
        </div>
    );
};