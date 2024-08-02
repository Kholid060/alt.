import { useEffect, useRef, useState } from 'react';
import {
  _extension,
  commandRenderer,
  UiExtIcon,
  UiList,
  UiListItem,
} from '@altdot/extension';
import { makeId } from './utils/helper';

interface TodoItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

const TODO_STORAGE_KEY = 'todos';

function ViewCommand() {
  const todoTitleRef = useRef('');

  const [todos, setTodos] = useState<TodoItem[]>([]);

  const listItems = todos.map((item) => ({
    value: item.id,
    title: item.title,
    group: item.isCompleted ? 'Completed' : 'To Do',
    icon: item.isCompleted ? <UiExtIcon.CheckCircle /> : <UiExtIcon.Circle />,
    actions: [
      {
        type: 'button',
        title: 'Delete',
        value: 'delete',
        color: 'destructive',
        icon: UiExtIcon.Trash2,
        shortcut: { mod1: 'ctrlKey', key: 'Delete' },
        onAction() {
          const updatedTodos = todos.filter((value) => value.id !== item.id);
          setTodos(updatedTodos);
          _extension.storage.local.set(TODO_STORAGE_KEY, updatedTodos);
        },
      },
    ],
    metadata: item.isCompleted ? 1 : 0,
  } as UiListItem)).sort((a, z) => a.metadata - z.metadata);

  function toggleTodo(id: string) {
    const updatedTodos = todos.map((todo) => {
      if (todo.id !== id) return todo;
      
      return {
        ...todo,
        isCompleted: !todo.isCompleted,
      }
    });
    setTodos(updatedTodos);
    _extension.storage.local.set(TODO_STORAGE_KEY, updatedTodos);
  }

  useEffect(() => {
    _extension.ui.searchPanel.clearValue();
    _extension.ui.searchPanel.updatePlaceholder('Search or press ctrl+enter to create to do');

    const offSearchEvent = _extension.ui.searchPanel.onChanged.addListener((value) => {
      todoTitleRef.current = value;
    });
    _extension.storage.local.get(TODO_STORAGE_KEY).then((storage) => {
      setTodos((storage[TODO_STORAGE_KEY] ?? []) as TodoItem[]);
    });

    return () => {
      offSearchEvent();
    };
  }, []);
  useEffect(() => _extension.ui.searchPanel.onKeydown.addListener(async ({ ctrlKey, key }) => {
      if (!ctrlKey || key !== 'Enter') return;

      try {
        const newTodos = [
          ...todos,
          { id: makeId(6), isCompleted: false, title: todoTitleRef.current }
        ];
        setTodos(newTodos);
        
        await _extension.storage.local.set(TODO_STORAGE_KEY, newTodos);

        _extension.ui.searchPanel.clearValue();
        todoTitleRef.current = '';
      } catch (error) {
        _extension.ui.showToast({
          type: 'error',
          description: (error as Error).message,
          title: 'Error when adding to-do items',
        });
      }
    })
  , [todos]);

  return (
    <div className="p-2">
      <UiList items={listItems} onItemSelected={toggleTodo} />
    </div>
  );
}

export default commandRenderer(ViewCommand);
