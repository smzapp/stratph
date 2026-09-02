"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { apiFetch, resolveFileUrl } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { timeAgo } from "@/lib/helpers";
import { Avatar, Button, EmptyState, PageHeader, Textarea } from "@/components/ui/Primitives";
import type { ChatMessage } from "@/lib/types";

const MESSAGE_PAGE_SIZE = 30;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_TEXTAREA_HEIGHT = 160;
const ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/png,image/jpeg,image/jpg";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string | null): string {
  if (!type) return "📎";
  if (type === "application/pdf") return "📕";
  if (type.includes("word")) return "📄";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  if (type.includes("presentation") || type.includes("powerpoint")) return "📽️";
  if (type.startsWith("text/")) return "📃";
  return "📎";
}

function mergeMessages(existing: ChatMessage[], fresh: ChatMessage[]): ChatMessage[] {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const m of fresh) byId.set(m.id, m);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function AttachmentPreview({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  if (!message.attachmentUrl) return null;
  const url = resolveFileUrl(message.attachmentUrl);
  const isImage = message.attachmentType?.startsWith("image/");

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- external/user-uploaded file, not an optimizable local asset */}
        <img src={url} alt={message.attachmentName || "Attachment"} className="max-h-56 max-w-full object-cover" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        isMine
          ? "border-indigo-400 bg-indigo-500/40 hover:bg-indigo-500/60"
          : "border-zinc-200 bg-white hover:bg-zinc-50"
      }`}
    >
      <span className="text-lg leading-none">{fileIcon(message.attachmentType)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{message.attachmentName}</span>
        {message.attachmentSize ? (
          <span className={`block text-[11px] ${isMine ? "text-indigo-100" : "text-zinc-400"}`}>
            {formatFileSize(message.attachmentSize)}
          </span>
        ) : null}
      </span>
    </a>
  );
}

export function MessagesView() {
  const {
    currentUser,
    conversations,
    sendMessage,
    sendAttachment,
    markConversationRead,
    typingConversationId,
    messageReadSignal,
    messageDeletedSignal,
    deleteMessage,
    closeConversation,
    setConversationArchived,
  } = useApp();
  const searchParams = useSearchParams();

  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("with"));
  const [showArchived, setShowArchived] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const lastTypingEmitRef = useRef(0);
  const lastLocalCreatedAtRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const selected = conversations.find((c) => c.id === selectedId) || null;
  const otherTyping = typingConversationId === selectedId;
  const visibleConversations = conversations.filter((c) => (showArchived ? c.archived : !c.archived));
  const archivedCount = conversations.filter((c) => c.archived).length;

  useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    shouldStickToBottomRef.current = true;
    apiFetch<ChatMessage[]>(`/conversations/${selectedId}/messages?limit=${MESSAGE_PAGE_SIZE}`)
      .then((res) => {
        if (cancelled) return;
        setMessages(res);
        setHasMoreOlder(res.length === MESSAGE_PAGE_SIZE);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    markConversationRead(selectedId);
    return () => {
      cancelled = true;
    };
  }, [selectedId, markConversationRead]);

  useEffect(() => {
    lastLocalCreatedAtRef.current = messages[messages.length - 1]?.createdAt ?? null;
  }, [messages]);

  // Conversations refresh live over the socket (see store.tsx), so a newer
  // lastMessageAt than what we've rendered means a message arrived for this
  // thread — catch up by re-fetching instead of listening on the socket
  // directly here, which would race the socket's own connection on mount.
  useEffect(() => {
    if (!selectedId || !selected?.lastMessageAt) return;
    const lastLocal = lastLocalCreatedAtRef.current;
    if (lastLocal && new Date(selected.lastMessageAt).getTime() <= new Date(lastLocal).getTime()) return;
    shouldStickToBottomRef.current = true;
    apiFetch<ChatMessage[]>(`/conversations/${selectedId}/messages?limit=${MESSAGE_PAGE_SIZE}`).then((res) => {
      setMessages((prev) => mergeMessages(prev, res));
      markConversationRead(selectedId);
    });
  }, [selected?.lastMessageAt, selectedId, markConversationRead]);

  // Read receipts ("Seen") update live the same way — a signal from the store
  // (fired on the socket's "message:read" event) tells us to re-sync.
  useEffect(() => {
    if (!selectedId || !messageReadSignal || messageReadSignal.conversationId !== selectedId) return;
    apiFetch<ChatMessage[]>(`/conversations/${selectedId}/messages?limit=${MESSAGE_PAGE_SIZE}`).then((res) => {
      setMessages((prev) => mergeMessages(prev, res));
    });
  }, [messageReadSignal, selectedId]);

  // The other participant deleting a message arrives as a scrubbed message
  // (body/attachment stripped, deletedAt set) over the socket — patch it in
  // directly rather than refetching the whole page.
  useEffect(() => {
    if (!selectedId || !messageDeletedSignal || messageDeletedSignal.conversationId !== selectedId) return;
    const deleted = messageDeletedSignal.message;
    setMessages((prev) => prev.map((m) => (m.id === deleted.id ? deleted : m)));
  }, [messageDeletedSignal, selectedId]);

  useEffect(() => {
    const el = draftTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const overflowing = el.scrollHeight > MAX_TEXTAREA_HEIGHT;
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    // Only show a scrollbar once content is actually clipped at the max
    // height — otherwise the reserved scrollbar gutter looks like a bug on a
    // single-line draft.
    el.style.overflowY = overflowing ? "auto" : "hidden";
  }, [draft]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  async function loadOlderMessages() {
    if (!selectedId || messages.length === 0 || loadingOlder) return;
    setLoadingOlder(true);
    shouldStickToBottomRef.current = false;
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    try {
      const older = await apiFetch<ChatMessage[]>(
        `/conversations/${selectedId}/messages?before=${encodeURIComponent(messages[0].createdAt)}&limit=${MESSAGE_PAGE_SIZE}`,
      );
      setMessages((prev) => mergeMessages(prev, older));
      setHasMoreOlder(older.length === MESSAGE_PAGE_SIZE);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - previousScrollHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  function openConversation(id: string) {
    setSelectedId(id);
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    const socket = getSocket();
    const now = Date.now();
    if (socket && selected && now - lastTypingEmitRef.current > 1500) {
      lastTypingEmitRef.current = now;
      socket.emit("typing", { conversationId: selected.id, recipientId: selected.otherParty.id });
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      window.alert("That file is too large — the limit is 10MB.");
      return;
    }
    setPendingFile(file);
  }

  async function handleSend(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!selectedId || sending || (!draft.trim() && !pendingFile)) return;
    setSending(true);
    shouldStickToBottomRef.current = true;
    const message = pendingFile
      ? await sendAttachment(selectedId, pendingFile, draft.trim())
      : await sendMessage(selectedId, draft.trim());
    setSending(false);
    if (message) {
      setMessages((prev) => mergeMessages(prev, [message]));
      setDraft("");
      setPendingFile(null);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!selectedId) return;
    if (!window.confirm("Delete this message? This can't be undone.")) return;
    const updated = await deleteMessage(selectedId, messageId);
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }
  }

  async function handleCloseConversation() {
    if (!selectedId) return;
    if (
      !window.confirm(
        "Close this conversation? Neither of you will be able to send new messages — the history stays, but this is final. Contacting this person again will start a new conversation.",
      )
    ) {
      return;
    }
    await closeConversation(selectedId);
  }

  async function handleToggleArchive() {
    if (!selectedId || !selected) return;
    const nextArchived = !selected.archived;
    const prompt = nextArchived
      ? "Archive this conversation? It'll move out of your inbox into Archived."
      : "Unarchive this conversation? It'll move back into your inbox.";
    if (!window.confirm(prompt)) return;
    await setConversationArchived(selectedId, nextArchived);
  }

  if (!currentUser) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Live messaging"
        title="Messages"
        description="Chat in real time — messages, typing, and read receipts update instantly."
      />

      <div
        className="grid overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:grid-cols-[260px_1fr] md:grid-cols-[300px_1fr]"
        style={{ height: "min(75vh, 700px)" }}
      >
        <div
          className={`min-h-0 flex-col overflow-y-auto border-zinc-200 sm:flex sm:border-r ${selectedId ? "hidden" : "flex"}`}
        >
          {conversations.length > 0 ? (
            <div className="flex shrink-0 gap-1 border-b border-zinc-100 p-2">
              <button
                onClick={() => setShowArchived(false)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  !showArchived ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  showArchived ? "bg-indigo-50 text-indigo-700" : "text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                Archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
              </button>
            </div>
          ) : null}
          {conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No conversations yet"
                description={
                  currentUser.role === "employer"
                    ? "Message a candidate from Reverse Hiring search to start a conversation."
                    : "When an employer messages you, it'll show up here."
                }
              />
            </div>
          ) : visibleConversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={showArchived ? "No archived conversations" : "Nothing here"}
                description={
                  showArchived
                    ? "Conversations you archive will show up here."
                    : "All your conversations are archived — check the Archived tab."
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {visibleConversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openConversation(c.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                      selectedId === c.id ? "bg-indigo-50/70" : ""
                    }`}
                  >
                    <Avatar name={c.otherParty.companyName || c.otherParty.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {c.otherParty.companyName || c.otherParty.name}
                          {c.closed ? (
                            <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-400">
                              Closed
                            </span>
                          ) : null}
                        </p>
                        {c.lastMessageAt ? (
                          <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(c.lastMessageAt)}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-zinc-500">{c.lastMessagePreview || "No messages yet"}</p>
                        {c.unreadCount > 0 ? (
                          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
                            {c.unreadCount > 9 ? "9+" : c.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`min-h-0 flex-col ${selectedId ? "flex" : "hidden sm:flex"}`}>
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <p className="text-sm text-zinc-400">Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-4 py-3">
                <button onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-zinc-600 sm:hidden">
                  ←
                </button>
                <Avatar name={selected.otherParty.companyName || selected.otherParty.name} size={8} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {selected.otherParty.companyName || selected.otherParty.name}
                  </p>
                  {selected.closed ? <p className="text-[11px] text-rose-500">Conversation closed</p> : null}
                </div>
                {!selected.closed ? (
                  <button
                    type="button"
                    onClick={handleCloseConversation}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-rose-600"
                  >
                    Close
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleToggleArchive}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  {selected.archived ? "Unarchive" : "Archive"}
                </button>
              </div>

              <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
                {loadingMessages ? (
                  <p className="text-center text-sm text-zinc-400">Loading messages…</p>
                ) : (
                  <>
                    {hasMoreOlder ? (
                      <div className="mb-3 flex justify-center">
                        <button
                          onClick={loadOlderMessages}
                          disabled={loadingOlder}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                        >
                          {loadingOlder ? "Loading…" : "View older messages"}
                        </button>
                      </div>
                    ) : null}
                    {messages.length === 0 ? (
                      <p className="text-center text-sm text-zinc-400">No messages yet — say hello!</p>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((m) => {
                          const isMine = m.senderId === currentUser.id;
                          const isDeleted = Boolean(m.deletedAt);
                          return (
                            <div
                              key={m.id}
                              className={`group flex items-end gap-1 ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              {isMine && !isDeleted ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(m.id)}
                                  className="mb-1 shrink-0 rounded-full p-1 text-zinc-300 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100"
                                  title="Delete message"
                                  aria-label="Delete message"
                                >
                                  🗑
                                </button>
                              ) : null}
                              <div
                                className={`max-w-[85%] space-y-1.5 rounded-2xl px-3 py-2 text-sm sm:max-w-[75%] ${
                                  isDeleted
                                    ? "border border-dashed border-zinc-200 bg-transparent text-zinc-400"
                                    : isMine
                                      ? "bg-indigo-600 text-white"
                                      : "bg-zinc-100 text-zinc-800"
                                }`}
                              >
                                {isDeleted ? (
                                  <p className="italic">This message was deleted</p>
                                ) : (
                                  <>
                                    {m.attachmentUrl ? <AttachmentPreview message={m} isMine={isMine} /> : null}
                                    {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
                                  </>
                                )}
                                <p className={`text-[10px] ${isDeleted ? "text-zinc-400" : isMine ? "text-indigo-200" : "text-zinc-400"}`}>
                                  {timeAgo(m.createdAt)}
                                  {isMine && m.readAt && !isDeleted ? " · Seen" : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                {otherTyping ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 px-3 py-2.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                    </div>
                    <p className="text-xs text-zinc-400">
                      {selected.otherParty.companyName || selected.otherParty.name} is typing…
                    </p>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              {selected.closed ? (
                <div className="shrink-0 border-t border-zinc-100 p-3">
                  <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center text-xs text-zinc-400">
                    This conversation is closed — new messages can&apos;t be sent.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="shrink-0 border-t border-zinc-100 p-3">
                  {pendingFile ? (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                      <span className="text-lg leading-none">{fileIcon(pendingFile.type)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-zinc-700">{pendingFile.name}</span>
                        <span className="block text-[11px] text-zinc-400">{formatFileSize(pendingFile.size)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                        aria-label="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ATTACHMENT_ACCEPT}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Textarea
                      ref={draftTextareaRef}
                      rows={1}
                      placeholder="Write a message…"
                      value={draft}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                      style={{ maxHeight: MAX_TEXTAREA_HEIGHT, overflowY: "hidden" }}
                      className="min-h-9 w-full resize-none py-2"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                        title="Attach a file"
                        aria-label="Attach a file"
                      >
                        📎
                      </button>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-9 shrink-0"
                        disabled={(!draft.trim() && !pendingFile) || sending}
                      >
                        {sending ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
