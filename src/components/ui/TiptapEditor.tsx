'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
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
  ImageIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import MessageDialog from '@/components/ui/MessageDialog';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  popupId?: string; // 팝업 ID 추가
}

export function TiptapEditor({
  content,
  onChange,
  placeholder,
  className,
  popupId,
}: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
        inline: false,
        allowBase64: true,
      }),
    ],
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

  // alert 대신 dialog를 보여주는 함수
  const showAlert = (title: string, description?: string) => {
    setDialogTitle(title);
    setDialogDescription(description || '');
    setShowDialog(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!popupId) {
      showAlert('오류', '팝업 ID가 필요합니다.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('popupId', popupId);

      const response = await fetch('/api/upload/popup-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // 에디터에 이미지 삽입
        editor?.chain().focus().setImage({ src: result.imageUrl }).run();
      } else {
        showAlert('업로드 실패', result.message || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      showAlert('오류', '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageButtonClick = () => {
    if (!popupId) {
      showAlert('알림', '팝업을 저장한 후 이미지를 업로드할 수 있습니다.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('파일 크기 초과', '파일 용량은 5MB 이하여야 합니다.');
        return;
      }

      // 이미지 파일인지 확인
      if (!file.type.match('image.*')) {
        showAlert('파일 형식 오류', '이미지 파일만 업로드 가능합니다.');
        return;
      }

      handleImageUpload(file);
    }
    // 파일 input 값 초기화
    event.target.value = '';
  };

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
            onClick={handleImageButtonClick}
            disabled={isUploading}
            title={!popupId ? '팝업을 저장한 후 이미지를 업로드할 수 있습니다.' : '이미지 업로드'}
          >
            <ImageIcon className='h-4 w-4' />
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

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileChange}
          className='hidden'
        />

        {isUploading && (
          <div className='absolute inset-0 flex items-center justify-center bg-white/50'>
            <div className='text-sm text-gray-600'>이미지 업로드 중...</div>
          </div>
        )}

        <MessageDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          title={dialogTitle}
          description={dialogDescription}
        />
      </div>
    )
  );
}
