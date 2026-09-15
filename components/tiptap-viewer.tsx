'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/core';

interface TiptapViewerProps {
  content: JSONContent;
}

export function TiptapViewer({ content }: TiptapViewerProps) {
  const editor = useEditor({
    content,
    editable: false,
    extensions: [StarterKit],
    immediatelyRender: false,
  });

  return <EditorContent editor={editor} className="prose prose-sm max-w-none" />;
}
