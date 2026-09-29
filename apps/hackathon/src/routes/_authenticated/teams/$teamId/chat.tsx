import { type FC, type ReactElement, useState, useRef, useEffect } from 'react';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTeamChat } from '../../../../hooks/use-chat';
import { useTeam, useTeamRole } from '../../../../hooks/use-teams';
import { toastError } from '../../../../lib/errors';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';

const TeamChatPage: FC = (): ReactElement => {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: team } = useTeam(teamId);
  const { userId: currentUserId, isLeader, isMember } = useTeamRole(team);
  const {
    messages: displayMessages,
    isLoading,
    hasOlder,
    isLoadingOlder,
    loadOlder,
    send,
    remove,
  } = useTeamChat(teamId, isMember);
  const isSending = send.isPending;
  const lastMessageId = displayMessages.at(-1)?.id;

  useEffect(() => {
    if (lastMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastMessageId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    try {
      await send.mutateAsync({ teamId, body: message.trim() });
      setMessage('');
    } catch (error) {
      toastError(error, 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await remove.mutateAsync({ id: messageId });
      toast.success('Message deleted');
      setDeleteTargetId(null);
    } catch (error) {
      toastError(error, 'Failed to delete message');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm dark:shadow-gray-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Chat
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                {team?.name}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                navigate({ to: '/teams/$teamId', params: { teamId } })
              }
            >
              Back to Team
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-primary-400"></div>
            </div>
          ) : displayMessages && displayMessages.length > 0 ? (
            <div className="space-y-4">
              {hasOlder && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isLoadingOlder}
                    onClick={() => {
                      loadOlder().catch((error: unknown) =>
                        toastError(error, 'Failed to load older messages')
                      );
                    }}
                  >
                    {isLoadingOlder ? 'Loading...' : 'Load older messages'}
                  </Button>
                </div>
              )}
              {displayMessages.map((msg) => {
                const isOwnMessage = msg.author.id === currentUserId;
                const canDelete = isOwnMessage || isLeader;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-lg ${
                        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="shrink-0">
                        {msg.author.image ? (
                          <img
                            src={msg.author.image}
                            alt={msg.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {msg.author.name.charAt(0) || '?'}
                          </div>
                        )}
                      </div>

                      <div className={`flex-1 text-left`}>
                        <div
                          className={`inline-block ${
                            isOwnMessage ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                              {isOwnMessage ? 'You' : msg.author.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`relative group rounded-2xl px-4 py-2.5 ${
                              isOwnMessage
                                ? 'bg-blue-600 dark:bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap wrap-break-word font-sans">
                              {msg.body}
                            </p>

                            {canDelete && (
                              <button
                                onClick={() =>
                                  setDeleteTargetId(
                                    deleteTargetId === msg.id ? null : msg.id
                                  )
                                }
                                className={`absolute top-1 ${
                                  isOwnMessage ? 'left-1' : 'right-1'
                                } opacity-0 hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer ${
                                  isOwnMessage
                                    ? 'hover:bg-blue-700 dark:hover:bg-primary-700'
                                    : ''
                                }`}
                                title="Delete message"
                              >
                                <Icon
                                  icon="mdi:trash-can-outline"
                                  className="w-4 h-4"
                                />
                              </button>
                            )}
                          </div>
                          {canDelete && deleteTargetId === msg.id && (
                            <div
                              className={`mt-2 flex gap-2 ${
                                isOwnMessage ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteTargetId(null)}
                                className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Icon
                icon="mdi:chat-outline"
                className="text-6xl mb-4 text-gray-400"
              />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No messages yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-sans">
                Be the first to start the conversation!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 shadow-lg dark:shadow-gray-950/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary-500 focus:border-transparent"
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || isSending}
              className="px-6 py-3"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_authenticated/teams/$teamId/chat')({
  component: TeamChatPage,
});
