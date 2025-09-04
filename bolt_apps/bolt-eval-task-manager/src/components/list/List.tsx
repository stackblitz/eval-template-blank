import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { Task } from '../task/Task';
import { CreateTask } from '../task/CreateTask';
import type { List as ListType, Task as TaskType } from '../../lib/types';

interface ListProps {
  list: ListType;
  tasks: TaskType[];
  onUpdateList: (list: ListType) => void;
  onDeleteList: (listId: string) => void;
  onCreateTask: (listId: string, title: string) => void;
  onUpdateTask: (task: TaskType) => void;
  onDeleteTask: (taskId: string) => void;
  index: number;
}

export function List({
  list,
  tasks,
  onUpdateList,
  onDeleteList,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  index,
}: ListProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const handleTitleSubmit = async () => {
    if (title.trim() && title !== list.title) {
      onUpdateList({ ...list, title: title.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(list.title);
      setIsEditing(false);
    }
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-gray-100 rounded-xl p-3 w-80 flex-shrink-0 transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
          }`}
        >
          <div {...provided.dragHandleProps} className="flex items-center justify-between mb-3">
            {isEditing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                className="font-semibold text-gray-900 bg-transparent border-b-2 border-blue-600 outline-none flex-1 mr-2"
                autoFocus
              />
            ) : (
              <h3
                onClick={() => setIsEditing(true)}
                className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex-1"
              >
                {list.title}
              </h3>
            )}
            <button className="p-1 hover:bg-gray-200 rounded transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <Droppable droppableId={list.id} type="TASK">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 min-h-[4rem] transition-colors duration-200 ${
                  snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                }`}
              >
                {tasks.map((task, index) => (
                  <Task
                    key={task.id}
                    task={task}
                    index={index}
                    onUpdate={onUpdateTask}
                    onDelete={onDeleteTask}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {showCreateTask ? (
            <CreateTask
              onSubmit={(title) => {
                onCreateTask(list.id, title);
                setShowCreateTask(false);
              }}
              onCancel={() => setShowCreateTask(false)}
            />
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowCreateTask(true)}
              className="w-full mt-3 justify-start text-gray-600 hover:text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add a card
            </Button>
          )}
        </div>
      )}
    </Draggable>
  );
}