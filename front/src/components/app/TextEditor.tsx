import ListItem from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import UnderLine from "@tiptap/extension-underline";
import {
  Editor,
  EditorContent,
  Extension,
  generateHTML,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  CornerDownLeft,
  Italic,
  List,
  ListOrdered,
  Redo,
  Underline,
  Undo,
} from "lucide-react";
import { MutableRefObject, useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import Tooltip from "./Tooltip";

const MenuBarButton = ({
  name,
  onClick,
  isActive = false,
  disabled = false,
  children,
}) => (
  <Tooltip
    triggerAsChild
    trigger={
      <Button
        tabIndex={-1}
        variant="ghost"
        size="icon"
        onClick={onClick}
        onTouchEnd={(e) => {
          e.preventDefault();
          onClick();
        }}
        disabled={disabled}
        className={isActive ? "active" : ""}
      >
        {children}
      </Button>
    }
  >
    {name}
  </Tooltip>
);

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-row gap-x-0.5 flex-wrap tiptap-menubar">
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        name="Bold"
      >
        <Bold />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        name="Italic"
      >
        <Italic />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        name="Underline"
      >
        <Underline />
      </MenuBarButton>
      <MenuBarButton
        onClick={() =>
          editor.chain().focus().keyboardShortcut("Shift-Enter").run()
        }
        name="New line"
      >
        <CornerDownLeft />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        name="Undo"
      >
        <Undo />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        name="Redo"
      >
        <Redo />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        name="Bullet list"
      >
        <List />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        name="Ordered list"
      >
        <ListOrdered />
      </MenuBarButton>
    </div>
  );
};

const extensions = [
  TextStyle.configure({ HTMLAttributes: [ListItem.name] }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
  }),
  UnderLine,
  Extension.create({
    name: "contextbreak",
    priority: 1000,
    addKeyboardShortcuts() {
      return {
        Enter: () => {
          if (
            this.editor.isActive("orderedList") ||
            this.editor.isActive("bulletList")
          ) {
            return this.editor.chain().createParagraphNear().run();
          }
          return this.editor.commands.setHardBreak();
        },
        "Shift-Enter": () =>
          this.editor.commands.first(({ commands }) => [
            () => commands.newlineInCode(),
            () => commands.createParagraphNear(),
            () => commands.liftEmptyBlock(),
            () => commands.splitBlock(),
          ]),
      };
    },
  }),
];

const TextEditor = ({
  readOnly = false,
  disabled = false,
  defaultValue = "",
  className = undefined,
  placeholder = undefined,
  editorRef = undefined,
}: {
  readOnly?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  editorRef?: MutableRefObject<Editor | null>;
}) => {
  const editor = useEditor({
    extensions: placeholder
      ? [
          ...extensions,
          Placeholder.configure({
            showOnlyWhenEditable: true,
            placeholder,
          }),
        ]
      : extensions,
    content: defaultValue,
  });

  if (editorRef) editorRef.current = editor;

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <div
      className={cn("tiptap-editor" + (readOnly ? " readOnly" : ""), className)}
      aria-disabled={disabled}
    >
      {!readOnly && <MenuBar editor={editor} />}
      <EditorContent
        placeholder={placeholder}
        className="tiptap-wrapper"
        editor={editor}
        disabled={readOnly}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export const RenderJSON = ({ document }) => {
  const result = useMemo(() => {
    return generateHTML(document, extensions);
  }, [document]);

  return (
    <div
      className="tiptap-html prose prose-sm"
      dangerouslySetInnerHTML={{ __html: result }}
    ></div>
  );
};

export const EmptyDocument = {
  type: "doc",
  content: [],
};

export default TextEditor;
