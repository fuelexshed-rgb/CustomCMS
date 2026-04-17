import { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { uploadArticleImage } from '../lib/storageUpload'

type Props = {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Write here (RTL for Dhivehi)…',
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor dhivehi-editor',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const handleFiles = async (files: FileList | null) => {
      if (!files?.length) return
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        try {
          const url = await uploadArticleImage(file, 'inline')
          editor.chain().focus().setImage({ src: url }).run()
        } catch (e) {
          console.error(e)
        }
      }
    }

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const f = item.getAsFile()
          if (f) void handleFiles(createFileList(f))
          return
        }
      }
    }

    const onDrop = (e: DragEvent) => {
      const dt = e.dataTransfer
      if (!dt?.files?.length) return
      if (!Array.from(dt.files).some((f) => f.type.startsWith('image/'))) return
      e.preventDefault()
      void handleFiles(dt.files)
    }

    dom.addEventListener('paste', onPaste, true)
    dom.addEventListener('drop', onDrop, true)
    return () => {
      dom.removeEventListener('paste', onPaste, true)
      dom.removeEventListener('drop', onDrop, true)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (content !== current) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])
  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])
  const setH2 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run()
  }, [editor])

  if (!editor) return <div className="card tiptap-editor dhivehi-editor">Loading editor…</div>

  return (
    <div className="rich-wrap article-rich-editor">
      <div className="toolbar" dir="ltr">
        <button type="button" className="btn btn-ghost" onClick={toggleBold} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" className="btn btn-ghost" onClick={toggleItalic} title="Italic">
          <em>I</em>
        </button>
        <button type="button" className="btn btn-ghost" onClick={setH2} title="Heading">
          H2
        </button>
        <span className="toolbar-hint">Paste or drop images</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function createFileList(file: File): FileList {
  const dt = new DataTransfer()
  dt.items.add(file)
  return dt.files
}
