'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';
import { Button } from './primitives/button';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({ content, onChange, placeholder, className }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-3',
          className,
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    editor && (
      <div className='border-input relative rounded-md border'>
        <div className='border-input flex flex-wrap items-center gap-1 border-b p-1'>
          <Button
            type='button'
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant={editor.isActive('code') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className='h-4 w-4' />
          </Button>

          <div className='bg-border mx-1 h-6 w-px' />

          <Button
            type='button'
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className='h-4 w-4' />
          </Button>

          <div className='bg-border mx-1 h-6 w-px' />

          <Button
            type='button'
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className='h-4 w-4' />
          </Button>

          <div className='bg-border mx-1 h-6 w-px' />

          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className='h-4 w-4' />
          </Button>
        </div>

        <EditorContent editor={editor} />

        {!content && placeholder && (
          <div className='text-muted-foreground pointer-events-none absolute top-14 left-3'>
            {placeholder}
          </div>
        )}
      </div>
    )
  );
}
