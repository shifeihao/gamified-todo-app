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
    
    // Monitor window size changes
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        
        window.addEventListener('resize', handleResize);
        
        // Force calendar size to update after initial render
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
    
    // Update the calendar size when the window is resized
    useEffect(() => {
        if (calendarRef.current && calendarRef.current.getApi) {
            const api = calendarRef.current.getApi();
            api.updateSize();
        }
    }, [windowSize]);
    
    // Fixed date handling to ensure dates don't drift
    const normalizeDate = (dateString) => {
        // Parse date string into YYYY-MM-DD format
        if (!dateString) return null;
        
        // First try to extract the date part from ISO format
        let dateOnlyStr = dateString;
        if (dateString.includes('T')) {
            dateOnlyStr = dateString.split('T')[0];
        }
        
        // Create a date object, ensuring the correct time zone is used
        const [year, month, day] = dateOnlyStr.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    };
    
    // Compare two dates to see if they are on the same day (using UTC)
    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getUTCFullYear() === d2.getUTCFullYear() &&
               d1.getUTCMonth() === d2.getUTCMonth() &&
               d1.getUTCDate() === d2.getUTCDate();
    };
    
    // Get the date in YYYY-MM-DD format (UTC basis)
    const formatDateToYYYYMMDD = (date) => {
        if (!date) return '';
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    };
    
    // Process the event, making sure the date is correct
    const processEvents = useCallback((tasks) => {
        const longTasks = tasks.filter(task => task.type === 'long' && task.equipped);
        const palette = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
        
        console.log("Processing Task List:", longTasks);
        
        return longTasks.flatMap((task, idx) => {
            const baseColor = palette[task.slotPosition % palette.length] || '#1e3a8a';
            const items = [];

            if (task.subTasks && task.subTasks.length > 0) {
                task.subTasks.forEach((sub, i) => {
                    if (sub.dueDate) {
                        // Normalize the date to ensure there is no drift
                        const normalizedDate = normalizeDate(sub.dueDate);
                        
                        if (normalizedDate) {
                            const formattedDate = formatDateToYYYYMMDD(normalizedDate);
                            console.log(`Subtask "${sub.title}" Original Date: ${sub.dueDate}, After normalization: ${formattedDate}`);
                            
                            items.push({
                                id: `${task._id}-sub-${i}`,
                                title: '',
                                start: formattedDate, // Use formatted date strings instead of Date objects
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
                            console.log(`Subtask date parsing failed: ${sub.dueDate}`);
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

    // Get all tasks for a specific date
    const getTasksForDate = useCallback((date) => {
        // Get the standard format of the date for comparison
        const dateStr = formatDateToYYYYMMDD(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
        
        console.log(`Find tasks for date ${dateStr}`);
        
        return calendarEvents.filter(event => {
            // Use normalized date strings for comparison
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

    // Handle mouse events for date cells
    const handleDayCellMouseEnter = (info) => {
        const date = info.date;
        const tasksForDate = getTasksForDate(date);
        
        if (tasksForDate.length > 0) {
            // Calculate the popup box position
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

    // Date cell content rendering
    const dayCellContent = useCallback((info) => {
        // Use UTC date format for comparison
        const dateStr = formatDateToYYYYMMDD(new Date(Date.UTC(info.date.getFullYear(), info.date.getMonth(), info.date.getDate())));
        
        // Find all tasks for the day
        const dayTasks = calendarEvents.filter(event => {
            return event.extendedProps.rawDate === dateStr;
        });
        
        //Group tasks by color
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
        // When the calendar component is mounted, add an event listener for each date cell
        const addDateCellListeners = () => {
            if (calendarRef.current) {
                const dayCells = calendarRef.current.elRef.current.querySelectorAll('.fc-daygrid-day');
                
                dayCells.forEach((cell) => {
                    // Extraction date
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
        
        // Wait for calendar rendering to complete
        setTimeout(addDateCellListeners, 100);
        
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [calendarEvents]);

    // Use a separate component to render hover information, which can be mounted on the body
    const HoverInfoPortal = () => {
        if (!hoverInfo.visible || hoverInfo.tasks.length === 0) return null;
        
        // Calculates absolute position, not relative to the calendar container
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
            
            {/* Using Portals to render hover information */}
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