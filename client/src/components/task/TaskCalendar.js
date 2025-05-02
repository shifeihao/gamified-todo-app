import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export const TaskCalendar = ({ tasks }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarItems, setCalendarItems] = useState([]);

    useEffect(() => {
        const longTasks = tasks.filter(task => task.type === '长期' && task.equipped);
        const palette = ['#f9f871','#a6f991', '#45f1bf', '#66b6f9', '#8885d8'];

        const result = longTasks.flatMap((task, idx) => {
            const baseColor = palette[task.slotPosition % palette.length] || '#999999';
            const items = [];

            if (task.dueDate) {
                items.push({
                    id: task._id,
                    title: task.title,
                    type: 'Main task',
                    dueDate: new Date(task.dueDate),
                    color: baseColor,
                    status: task.status,
                });
            }

            if (task.subTasks && task.subTasks.length > 0) {
                task.subTasks.forEach((sub, i) => {
                    if (sub.dueDate) {
                        items.push({
                            id: `${task._id}-sub-${i}`,
                            title: sub.title,
                            type: 'Sub task',
                            parent: task.title,
                            dueDate: new Date(sub.dueDate),
                            color: baseColor,
                            status: sub.status ?? task.status, // ✅ 添加在这里（子任务）
                        });
                    }
                });
            }

            return items;
        });

        setCalendarItems(result);
    }, [tasks]);

    const sameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const tasksOnDate = calendarItems.filter(item =>
        sameDay(item.dueDate, selectedDate)
    );

    const tileContent = ({ date }) => {
        const items = calendarItems.filter(item => sameDay(item.dueDate, date));
        return (
            <div className="flex justify-center items-center mt-1 space-x-1">
                {items.slice(0, 3).map((item, idx) => (
                    <div
                        key={idx}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full">
            <Calendar
                value={selectedDate}
                onClickDay={(date) => setSelectedDate(date)}
                tileContent={tileContent}
                locale="en-US"
                className="w-full text-black" // ✅ 防止数字变灰或变红
                tileClassName={({ date }) => {
                    if (sameDay(date, new Date())) {
                        return 'calendar-today';
                    }
                    return 'rounded-xl';
                }}
                tileDisabled={() => false}
            />

            {tasksOnDate.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-semibold">
                        📅 {selectedDate.toDateString()} Tasks:
                    </h3>
                    {tasksOnDate.map((task, idx) => (
                        <div
                            key={idx}
                            className="p-3 rounded shadow text-sm flex justify-between items-center min-h-[60px]"
                            style={{ borderLeft: `4px solid ${task.color}` }}
                        >
                            <div className="flex flex-col">
                                <span className="font-bold">{task.title}</span>
                                <div className="text-xs text-gray-500">
                                    ({task.type}) {task.parent && <span className="ml-1 text-gray-400">From: {task.parent}</span>}
                                </div>
                            </div>
                            <div className="text-green-500 text-lg">
                                {task.status === '已完成' ? (
                                    <span title="已完成">✅</span>
                                ) : (
                                    <span title="未完成">⌛</span>
                                )}
                            </div>
                        </div>
                    ))}

                </div>
            )}
            <style>
                {`
        .calendar-today {
          background-color: #d1d5db !important;
          color: #000 !important;
          border-radius: 0.75rem !important;
          font-weight: 600 !important;
        }
      `}
            </style>
        </div>

    );

};
