import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface EmojiReactionProps {
  emoji: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Componente que muestra un emoji con su contador y permite reaccionar haciendo clic
 */
export function EmojiReaction({ emoji, count, isSelected, onClick }: EmojiReactionProps) {
  return (
    <button
      className={`inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs transition-colors ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
      onClick={onClick}
    >
      <span>{emoji}</span>
      <span className="font-medium">{count}</span>
    </button>
  );
}

interface EmojiReactionListProps {
  reactions: {
    emoji: string;
    count: number;
    selected: boolean;
  }[];
  onReactionSelect: (emoji: string) => void;
}

/**
 * Componente que muestra una lista de reacciones existentes
 */
export function EmojiReactionList({ reactions, onReactionSelect }: EmojiReactionListProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {reactions.map((reaction) => (
        <EmojiReaction
          key={reaction.emoji}
          emoji={reaction.emoji}
          count={reaction.count}
          isSelected={reaction.selected}
          onClick={() => onReactionSelect(reaction.emoji)}
        />
      ))}
    </div>
  );
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Componente que muestra un selector de emojis comunes
 */
export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  // Lista de emojis más comunes para reacciones
  const commonEmojis = [
    '👍', '❤️', '😂', '😍', '😮', '😢', '😡',
    '👏', '🎉', '🔥', '💯', '✅', '⭐', '🙌'
  ];

  return (
    <div className="absolute z-10 mt-1 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
      <div className="flex flex-wrap gap-2 max-w-xs">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            className="text-xl hover:bg-gray-100 p-1 rounded"
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

interface AddReactionButtonProps {
  commentId?: number;
  taskId?: number;
  onReactionAdded?: () => void;
  className?: string;
}

/**
 * Botón para añadir una nueva reacción
 */
export function AddReactionButton({ commentId, taskId, onReactionAdded, className = '' }: AddReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      if (!commentId && !taskId) {
        throw new Error('Se requiere un commentId o taskId');
      }
      
      const payload = {
        emoji,
        commentId,
        taskId
      };
      
      const response = await apiRequest('POST', '/api/reactions', payload);
      if (!response.ok) {
        throw new Error('Error al añadir la reacción');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar consultas relacionadas
      if (commentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/comments', commentId] });
        queryClient.invalidateQueries({ queryKey: ['/api/reactions', { commentId }] });
      }
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
        queryClient.invalidateQueries({ queryKey: ['/api/reactions', { taskId }] });
      }
      
      if (onReactionAdded) {
        onReactionAdded();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo añadir la reacción',
        variant: 'destructive',
      });
    }
  });

  const handleEmojiSelect = (emoji: string) => {
    addReactionMutation.mutate(emoji);
  };

  return (
    <div className="relative">
      <button
        className={`text-gray-500 hover:text-gray-700 ${className}`}
        onClick={() => setShowPicker(!showPicker)}
      >
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
          <span className="ml-1">Reaccionar</span>
        </span>
      </button>
      
      {showPicker && (
        <EmojiPicker 
          onEmojiSelect={handleEmojiSelect} 
          onClose={() => setShowPicker(false)} 
        />
      )}
    </div>
  );
}

interface ReactionManagerProps {
  commentId?: number;
  taskId?: number;
  reactions: {
    emoji: string;
    count: number;
    selected?: boolean;
  }[];
  className?: string;
}

/**
 * Componente completo que gestiona las reacciones (mostrar y añadir)
 */
export function ReactionManager({ commentId, taskId, reactions, className = '' }: ReactionManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      if (!commentId && !taskId) {
        throw new Error('Se requiere un commentId o taskId');
      }
      
      // El endpoint debe manejar la lógica de agregar o quitar la reacción
      const payload = {
        emoji,
        commentId,
        taskId
      };
      
      const response = await apiRequest('POST', '/api/reactions/toggle', payload);
      if (!response.ok) {
        throw new Error('Error al gestionar la reacción');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar consultas relacionadas
      if (commentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/comments', commentId] });
        queryClient.invalidateQueries({ queryKey: ['/api/reactions', { commentId }] });
      }
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
        queryClient.invalidateQueries({ queryKey: ['/api/reactions', { taskId }] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo procesar la reacción',
        variant: 'destructive',
      });
    }
  });

  const handleReactionSelect = (emoji: string) => {
    toggleReactionMutation.mutate(emoji);
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2">
        {reactions.length > 0 && (
          <EmojiReactionList 
            reactions={reactions.map(r => ({ 
              ...r, 
              selected: r.selected || false 
            }))} 
            onReactionSelect={handleReactionSelect} 
          />
        )}
        <AddReactionButton 
          commentId={commentId} 
          taskId={taskId} 
          onReactionAdded={() => {}} 
        />
      </div>
    </div>
  );
}
