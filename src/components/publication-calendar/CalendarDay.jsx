import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { format, isSameMonth, isToday } from 'date-fns';
import { Loader2, Sparkles } from 'lucide-react';
import GenerateHookPopover from './GenerateHookPopover';

const CalendarDay = ({ day, dayIdx, firstDayOfMonth, currentMonth, hooks, generatingDays, setSelectedHook, setEditedHookText, setIsModalOpen, ...popoverProps }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const dateKey = format(day, 'yyyy-MM-dd');
  const isDayGenerating = generatingDays[dateKey];
  const hookText = hooks[dateKey];

  const colStartClasses = ['', 'col-start-2', 'col-start-3', 'col-start-4', 'col-start-5', 'col-start-6', 'col-start-7'];

  const handleDayClick = () => {
    if (hookText) {
      setSelectedHook({ day, text: hookText });
      setEditedHookText(hookText);
      setIsModalOpen(true);
    }
  };

  return (
    <div
      onClick={handleDayClick}
      className={cn(
        'relative h-36 rounded-lg border p-2 flex flex-col overflow-hidden group transition-all duration-200',
        hookText ? 'cursor-pointer hover:border-primary hover:bg-primary/5' : '',
        dayIdx === 0 && colStartClasses[firstDayOfMonth],
        !isSameMonth(day, currentMonth) && 'bg-muted/50 text-muted-foreground',
        isToday(day) && 'bg-primary/10 border-primary'
      )}
    >
      <div className="flex justify-between items-start">
        <time dateTime={dateKey} className="font-semibold">
          {format(day, 'd')}
        </time>
        {isSameMonth(day, currentMonth) && !hookText && (
          <GenerateHookPopover
            day={day}
            dateKey={dateKey}
            isDayGenerating={isDayGenerating}
            setPopoverOpen={setPopoverOpen}
            popoverOpen={popoverOpen}
            {...popoverProps}
          />
        )}
      </div>

      {hookText && (
        <p className="text-xs mt-1 text-foreground/80 overflow-hidden text-ellipsis">
          {hookText}
        </p>
      )}
    </div>
  );
};

export default CalendarDay;