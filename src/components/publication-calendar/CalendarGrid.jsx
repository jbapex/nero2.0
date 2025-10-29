import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CalendarDay from './CalendarDay';
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';

const CalendarGrid = ({ currentMonth, ...props }) => {
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground mb-2">
          {weekdays.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, dayIdx) => (
            <CalendarDay
              key={day.toString()}
              day={day}
              dayIdx={dayIdx}
              firstDayOfMonth={firstDayOfMonth}
              currentMonth={currentMonth}
              {...props}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarGrid;